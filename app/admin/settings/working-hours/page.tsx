'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Save, Clock } from 'lucide-react';

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
                // Initialize with defaults on error
                initializeDefaults();
                return;
            }

            const data = await response.json();

            if (data.hours && data.hours.length > 0) {
                setHours(data.hours);
            } else {
                // Initialize with defaults if no data
                initializeDefaults();
            }
        } catch (error) {
            console.error('Error fetching hours:', error);
            // Initialize with defaults on error
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
                isActive: index !== 0, // Sunday off by default
            }))
        );
    };

    const updateDay = (dayOfWeek: number, field: keyof WorkingHours, value: any) => {
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5CD85A]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#0A0A0A]">Horaires de travail</h1>
                    <p className="text-gray-600 mt-1">Configurez vos horaires d'ouverture</p>
                </div>
                <Button
                    onClick={saveWorkingHours}
                    disabled={saving}
                    className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Planning hebdomadaire
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {hours.map((day) => (
                            <div
                                key={day.dayOfWeek}
                                className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-[#5CD85A]/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <Switch
                                        checked={day.isActive}
                                        onCheckedChange={(checked) =>
                                            updateDay(day.dayOfWeek, 'isActive', checked)
                                        }
                                    />
                                    <span className="font-medium text-[#0A0A0A] w-24">
                                        {DAYS[day.dayOfWeek]}
                                    </span>
                                </div>

                                {day.isActive ? (
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Ouverture</label>
                                            <Input
                                                type="time"
                                                value={day.startTime}
                                                onChange={(e) =>
                                                    updateDay(day.dayOfWeek, 'startTime', e.target.value)
                                                }
                                                className="w-32"
                                            />
                                        </div>
                                        <span className="text-gray-400 mt-5">→</span>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Fermeture</label>
                                            <Input
                                                type="time"
                                                value={day.endTime}
                                                onChange={(e) =>
                                                    updateDay(day.dayOfWeek, 'endTime', e.target.value)
                                                }
                                                className="w-32"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-400 italic">Fermé</span>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-blue-50">
                <CardContent className="p-6">
                    <p className="text-sm text-blue-800">
                        <strong>Note :</strong> Les réservations en ligne seront automatiquement bloquées en dehors de ces horaires.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
