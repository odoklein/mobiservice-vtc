'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, MapPin, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
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
        // Load current depot settings
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
            console.log('Saving depot:', {
                address,
                lat: coordinates.lat,
                lng: coordinates.lng,
            });

            setMessage({
                type: 'success',
                text: `Configuration du dépôt enregistrée : ${address}`
            });

            setTimeout(() => setMessage(null), 5000);
        } catch {
            setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-2xl font-bold">Configuration du dépôt VTC</h1>
                    <p className="text-slate-400 mt-1">Point de départ pour tous les calculs de tarification</p>
                </div>
            </div>

            <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <div className="p-2 rounded-lg bg-emerald-50">
                                <MapPin className="h-5 w-5 text-emerald-600" />
                            </div>
                            Adresse du dépôt
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
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
                            <div className={`p-4 rounded-lg flex items-start gap-3 ${message.type === 'success'
                                    ? 'bg-emerald-50 border border-emerald-200'
                                    : 'bg-red-50 border border-red-200'
                                }`}>
                                {message.type === 'success' ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-medium ${message.type === 'success' ? 'text-emerald-900' : 'text-red-900'
                                        }`}>
                                        {message.type === 'success' ? 'Succès' : 'Erreur'}
                                    </p>
                                    <p className={`text-sm mt-1 ${message.type === 'success' ? 'text-emerald-700' : 'text-red-700'
                                        }`}>
                                        {message.text}
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleSave}
                            disabled={saving || !coordinates}
                            className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white font-medium"
                        >
                            {saving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            <strong>Information :</strong> Le dépôt est actuellement fixe dans le code.
                            Pour modifier ces valeurs de manière permanente, mettez à jour le fichier{' '}
                            <code className="bg-white px-1.5 py-0.5 rounded text-xs">lib/constants.ts</code>.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
