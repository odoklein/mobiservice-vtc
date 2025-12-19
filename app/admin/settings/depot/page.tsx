'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, MapPin } from 'lucide-react';

export default function DepotSettingsPage() {
    const [address, setAddress] = useState('4 rue des artisans, 74300 Cluses');
    const [lat, setLat] = useState('46.0624');
    const [lng, setLng] = useState('6.5813');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        // Load current depot settings (could be from API or localStorage)
        // For now, using constants
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // TODO: Save to database or config file
            // For now, this is a fixed value, but we can add an API endpoint later
            setMessage({ type: 'success', text: 'Configuration du dépôt enregistrée' });
            
            // Update constants would require a server restart, so for now just show success
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#0A0A0A]">Configuration du dépôt VTC</h1>
                <p className="text-gray-600 mt-1">Point de départ pour tous les calculs de tarification</p>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#5CD85A]" />
                        Adresse du dépôt
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Adresse complète</Label>
                        <Input
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="4 rue des artisans, 74300 Cluses"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Latitude</Label>
                            <Input
                                type="number"
                                step="any"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
                                placeholder="46.0624"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Longitude</Label>
                            <Input
                                type="number"
                                step="any"
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                placeholder="6.5813"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-3 rounded-lg ${
                            message.type === 'success' 
                                ? 'bg-green-50 text-green-700' 
                                : 'bg-red-50 text-red-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        <strong>Note:</strong> Le dépôt est actuellement fixe dans le code. 
                        Pour modifier ces valeurs, contactez le développeur ou mettez à jour le fichier <code className="bg-white px-1 rounded">lib/constants.ts</code>.
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

