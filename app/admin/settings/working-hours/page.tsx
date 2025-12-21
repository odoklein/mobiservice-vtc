'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save, Clock, Loader2, Info } from 'lucide-react';

interface WorkingHours {
    id?: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function WorkingHoursPage() {
    const [hours, setHours] = useState<WorkingHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchWorkingHours();
    }, []);

    const fetchWorkingHours = async () => {
        try {
            const response = await fetch('/api/admin/settings/working-hours');

            if (!response.ok) {
                console.error('API error:', response.status);
                initializeDefaults();
                return;
            }

            const data = await response.json();

            if (data.hours && data.hours.length > 0) {
                setHours(data.hours);
            } else {
                initializeDefaults();
            }
        } catch (error) {
            console.error('Error fetching hours:', error);
            initializeDefaults();
        } finally {
            setLoading(false);
        }
    };

    const initializeDefaults = () => {
        setHours(
            DAYS.map((_, index) => ({
                dayOfWeek: index,
                startTime: '08:00',
                endTime: '20:00',
                isActive: index !== 0,
            }))
        );
    };

    const updateDay = (dayOfWeek: number, field: keyof WorkingHours, value: unknown) => {
        setHours((prev) =>
            prev.map((h) =>
                h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
            )
        );
    };

    const saveWorkingHours = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/admin/settings/working-hours', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hours }),
            });

            if (response.ok) {
                alert('Horaires enregistrés avec succès !');
            } else {
                alert('Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Error saving hours:', error);
            alert('Erreur serveur');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex justify-center items-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-6">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold">Horaires de travail</h1>
                        <p className="text-slate-400 mt-1">Configurez vos horaires d'ouverture</p>
                    </div>
                    <Button
                        onClick={saveWorkingHours}
                        disabled={saving}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium"
                    >
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </div>
            </div>

            <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-sky-50">
                                <Clock className="h-5 w-5 text-sky-600" />
                            </div>
                            Planning hebdomadaire
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {hours.map((day) => (
                                <div
                                    key={day.dayOfWeek}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <Switch
                                            checked={day.isActive}
                                            onCheckedChange={(checked) =>
                                                updateDay(day.dayOfWeek, 'isActive', checked)
                                            }
                                        />
                                        <span className={`font-medium w-24 ${day.isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {DAYS[day.dayOfWeek]}
                                        </span>
                                    </div>

                                    {day.isActive ? (
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Ouverture</label>
                                                <Input
                                                    type="time"
                                                    value={day.startTime}
                                                    onChange={(e) =>
                                                        updateDay(day.dayOfWeek, 'startTime', e.target.value)
                                                    }
                                                    className="w-28 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                                />
                                            </div>
                                            <span className="text-slate-400 mt-5">→</span>
                                            <div>
                                                <label className="text-xs text-slate-500 block mb-1">Fermeture</label>
                                                <Input
                                                    type="time"
                                                    value={day.endTime}
                                                    onChange={(e) =>
                                                        updateDay(day.dayOfWeek, 'endTime', e.target.value)
                                                    }
                                                    className="w-28 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-400 italic text-sm">Fermé</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <strong>Note :</strong> Les réservations en ligne seront automatiquement bloquées en dehors de ces horaires.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
