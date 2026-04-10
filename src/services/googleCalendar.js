// src/services/googleCalendar.js

export const buildGoogleEventPayload = (taskDetails, clubs) => {
    let start, end;

    if (taskDetails.isAllDay) {
        start = { date: taskDetails.due };
        const endDate = new Date(taskDetails.due);
        endDate.setDate(endDate.getDate() + 1);
        end = { date: endDate.toISOString().split('T')[0] };
    } else {
        const timeStr = taskDetails.time || '09:00';
        const endTimeStr = taskDetails.endTime || '10:00';
        const startDateTime = new Date(`${taskDetails.due}T${timeStr}:00`).toISOString();
        const endDateTime = new Date(`${taskDetails.due}T${endTimeStr}:00`).toISOString();
        
        start = { dateTime: startDateTime, timeZone: 'Europe/Madrid' };
        end = { dateTime: endDateTime, timeZone: 'Europe/Madrid' };
    }

    const associatedClub = clubs.find(c => c.id === taskDetails.clubId);
    const clubName = associatedClub ? associatedClub.name : 'Ninguno';
    const eventLocation = associatedClub?.address || taskDetails.location || '';

    return {
      summary: taskDetails.task,
      location: eventLocation,
      description: `Generado desde CRM Sooner.\nClub: ${clubName}\nDetalles: ${taskDetails.description || ''}`,
      start: start,
      end: end,
      colorId: taskDetails.priority === 'high' ? '11' : '9',
    };
};

export const createGoogleCalendarEvent = async (taskDetails, token, clubs) => {
    if (!token) return null;
    const event = buildGoogleEventPayload(taskDetails, clubs);
    try {
      const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error("Error creando evento");
      const data = await response.json();
      return data.id; 
    } catch (error) {
      console.error("Error API Google Calendar Create:", error);
      return null;
    }
};

export const updateGoogleCalendarEvent = async (taskDetails, token, clubs) => {
    if (!token || !taskDetails.googleEventId) return;
    const event = buildGoogleEventPayload(taskDetails, clubs);
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${taskDetails.googleEventId}`, {
        method: "PUT",
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error("Error actualizando evento");
    } catch (error) {
      console.error("Error API Google Calendar Update:", error);
    }
};

export const deleteGoogleCalendarEvent = async (eventId, token, onSessionExpired) => {
    if (!token || !eventId) return;
    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: "DELETE",
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401 && onSessionExpired) {
          onSessionExpired();
          return;
      }

      if (!response.ok) throw new Error("Error eliminando evento en Google");
    } catch (error) {
      console.error("Error API Google Calendar Delete:", error);
    }
};