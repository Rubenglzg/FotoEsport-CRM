// src/views/LoginScreen.jsx
import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';

export default function LoginScreen({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLogin();
        } catch (err) {
            console.error("Error logging in:", err);
            setError(true);
            setTimeout(() => setError(false), 3000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-zinc-50 dark:bg-zinc-950 items-center justify-center font-sans transition-colors duration-300">
            <div className="w-full max-w-sm p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-2xl flex flex-col items-center">
                
                {/* LOGO MODIFICADO */}
                <img 
                    src="/logo192.png" 
                    alt="Logo" 
                    className="w-16 h-16 mb-6 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] object-contain bg-white" 
                />

                <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sooner CRM</h1>
                <p className="text-zinc-500 text-xs mb-8 text-center">Acceso restringido. Por favor, introduce tus credenciales de administrador.</p>
                
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <div>
                        <div className="relative mb-4">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <input 
                                type="email" placeholder="Correo corporativo" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                            <input 
                                type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required
                                className={cn("w-full bg-zinc-50 dark:bg-zinc-950 border rounded-lg pl-10 pr-4 py-3 text-sm text-zinc-900 dark:text-white outline-none transition-colors", error ? "border-red-500 focus:border-red-500" : "border-zinc-300 dark:border-zinc-700 focus:border-emerald-500")}
                            />
                        </div>
                        {error && <p className="text-red-500 text-[10px] mt-2 font-bold text-center">Credenciales incorrectas.</p>}
                    </div>
                    <Button variant="neon" className="w-full py-6 text-base font-bold tracking-wide mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Acceder al Sistema"}
                    </Button>
                </form>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-600 mt-8 text-center uppercase tracking-widest">Grupo Avantia © 2026</p>
            </div>
        </div>
    );
}