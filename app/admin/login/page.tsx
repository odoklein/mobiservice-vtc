'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
    console.log('[LOGIN PAGE] Rendering login page');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Connexion échouée');
                setIsLoading(false);
                return;
            }

            // Redirect to admin dashboard
            router.push('/admin');
            router.refresh();
        } catch (err) {
            setError('Une erreur est survenue');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md border-0 shadow-xl">
                <CardHeader className="space-y-4 pb-8">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-sky-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-slate-900">
                        Administration
                    </CardTitle>
                    <p className="text-center text-slate-600 text-sm">
                        Connectez-vous pour accéder au panneau admin
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@mobiservice-vtc.com"
                                variant="admin"
                                className="mt-2"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                                Mot de passe
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                variant="admin"
                                className="mt-2"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="admin-secondary"
                            size="admin-lg"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Connexion...' : 'Se connecter'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
