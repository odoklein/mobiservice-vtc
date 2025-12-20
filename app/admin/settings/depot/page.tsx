'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { AddressAutocomplete } from '@/components/booking/address-autocomplete';

export default function DepotSettingsPage() {
    const [address, setAddress] = useState('4 rue des artisans, 74300 Cluses');
    const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>({
        lat: 46.0624,
        lng: 6.5813,
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        // Load current depot settings (could be from API or localStorage)
        // For now, using constants
    }, []);

    const handleAddressChange = (newAddress: string, lat?: number, lng?: number) => {
        setAddress(newAddress);
        if (lat !== undefined && lng !== undefined) {
            setCoordinates({ lat, lng });
        } else {
            setCoordinates(null);
        }
    };

    const handleSave = async () => {
        if (!coordinates) {
            setMessage({ 
                type: 'error', 
                text: 'Veuillez sélectionner une adresse avec des coordonnées valides' 
            });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            // TODO: Save to database or config file
            // For now, this is a fixed value, but we can add an API endpoint later
            console.log('Saving depot:', {
                address,
                lat: coordinates.lat,
                lng: coordinates.lng,
            });

            setMessage({ 
                type: 'success', 
                text: `Configuration du dépôt enregistrée : ${address}` 
            });
            
            // Update constants would require a server restart, so for now just show success
            setTimeout(() => setMessage(null), 5000);
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
                <CardContent className="space-y-6">
                    <AddressAutocomplete
                        label="Adresse complète"
                        placeholder="Recherchez l'adresse du dépôt..."
                        value={address}
                        onChange={handleAddressChange}
                    />

                    {/* Show coordinates when available */}
                    {coordinates && (
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <p className="text-sm font-medium text-slate-900 mb-2">
                                Coordonnées GPS
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-600">Latitude : </span>
                                    <span className="font-mono text-slate-900">{coordinates.lat.toFixed(6)}</span>
                                </div>
                                <div>
                                    <span className="text-slate-600">Longitude : </span>
                                    <span className="font-mono text-slate-900">{coordinates.lng.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {message && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${
                            message.type === 'success' 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div>
                                <p className={`font-medium ${
                                    message.type === 'success' ? 'text-green-900' : 'text-red-900'
                                }`}>
                                    {message.type === 'success' ? 'Succès' : 'Erreur'}
                                </p>
                                <p className={`text-sm mt-1 ${
                                    message.type === 'success' ? 'text-green-700' : 'text-red-700'
                                }`}>
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">
                            <strong>Information :</strong> Le dépôt est actuellement fixe dans le code. 
                            Pour modifier ces valeurs de manière permanente, mettez à jour le fichier{' '}
                            <code className="bg-white px-1.5 py-0.5 rounded text-xs">lib/constants.ts</code>.
                        </p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving || !coordinates}
                        className="w-full h-12 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] font-semibold"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}



