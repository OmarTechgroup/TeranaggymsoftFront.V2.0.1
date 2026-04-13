'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

// 1. Définition de la forme des données utilisateur
interface User {
    username: string;
    roles: 'ADMIN' | 'CAISSIER' | 'CLIENT' | 'SUPERADMIN';
}

// 2. Définition du type de notre contexte
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, roles: string, username: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // 3. Au chargement, on vérifie si un token existe déjà dans le navigateur
    useEffect(() => {
        const savedToken = localStorage.getItem('token');

        if (savedToken) {
            try {
                const decoded: any = jwtDecode(savedToken);
                // Vérifie si le token n'est pas expiré (optionnel mais recommandé)
                const currentTime = Date.now() / 1000;
                if (decoded.exp < currentTime) {
                    logout();
                } else {
                    const savedRoles = localStorage.getItem('roles') ?? ''
                    const savedUsername = localStorage.getItem('username') ?? decoded.sub
                    setToken(savedToken);
                    setUser({
                        username: savedUsername,
                        roles: savedRoles as User['roles']
                    });
                }
            } catch (error) {
                console.error("Erreur de décodage du token", error);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    // 4. Fonction appelée après un POST /api/auth/login réussi
    const login = (newToken: string, roles: string, username: string) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('roles', roles);
        localStorage.setItem('username', username);
        document.cookie = `token=${newToken}; path=/;`

        setToken(newToken);
        setUser({ username, roles: roles as User['roles'] });

        router.push('/dashboard'); // Redirection automatique vers le dashboard
    };

    // 5. Fonction de déconnexion
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('roles');
        localStorage.removeItem('username');
        document.cookie = 'token=; path=/; max-age=0'
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

// 6. Hook personnalisé pour utiliser l'auth facilement dans n'importe quel composant
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
