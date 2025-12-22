'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';

export default function PasswordSettingsPage() {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Le mot de passe doit contenir au moins 8 caractères';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Le mot de passe doit contenir au moins une majuscule';
        }
        if (!/[a-z]/.test(password)) {
            return 'Le mot de passe doit contenir au moins une minuscule';
        }
        if (!/[0-9]/.test(password)) {
            return 'Le mot de passe doit contenir au moins un chiffre';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            setError('Tous les champs sont requis');
            return;
        }

        const passwordError = validatePassword(formData.newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.currentPassword === formData.newPassword) {
            setError('Le nouveau mot de passe doit être différent de l\'ancien');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/admin/settings/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setFormData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
            } else {
                setError(data.error || 'Erreur lors du changement de mot de passe');
            }
        } catch (err) {
            console.error('Error changing password:', err);
            setError('Erreur serveur. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold">Sécurité</h1>
                    <p className="text-slate-400 mt-1">Modifiez votre mot de passe</p>
                </div>
            </div>

            <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-amber-50">
                                <Lock className="h-5 w-5 text-amber-600" />
                            </div>
                            Changer le mot de passe
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Assurez-vous d'utiliser un mot de passe fort et unique
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        {success && (
                            <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-emerald-900">
                                        Mot de passe modifié avec succès !
                                    </p>
                                    <p className="text-sm text-emerald-700 mt-1">
                                        Votre mot de passe a été mis à jour.
                                    </p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-900">Erreur</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Label htmlFor="currentPassword" className="text-sm font-medium text-slate-700 mb-2 block">
                                    Mot de passe actuel
                                </Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currentPassword: e.target.value })
                                    }
                                    placeholder="Entrez votre mot de passe actuel"
                                    className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                    required
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700 mb-2 block">
                                            Nouveau mot de passe
                                        </Label>
                                        <Input
                                            id="newPassword"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={(e) =>
                                                setFormData({ ...formData, newPassword: e.target.value })
                                            }
                                            placeholder="Entrez un nouveau mot de passe"
                                            className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 mb-2 block">
                                            Confirmer le nouveau mot de passe
                                        </Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={(e) =>
                                                setFormData({ ...formData, confirmPassword: e.target.value })
                                            }
                                            placeholder="Confirmez le nouveau mot de passe"
                                            className="h-11 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Modification en cours...
                                        </>
                                    ) : (
                                        'Changer le mot de passe'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 mb-2">
                                Critères du mot de passe :
                            </p>
                            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                                <li>Au moins 8 caractères</li>
                                <li>Au moins une majuscule (A-Z)</li>
                                <li>Au moins une minuscule (a-z)</li>
                                <li>Au moins un chiffre (0-9)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

