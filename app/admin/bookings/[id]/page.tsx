'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Check, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/pricing';
import type { Booking } from '@/lib/db/schema';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export default function BookingDetailPage() {
    const params = useParams();
    const router = useRouter();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [status, setStatus] = useState<string>('');
    const [paymentStatus, setPaymentStatus] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<string>('');

    // Extract breakdown for display
    const breakdown = booking?.priceBreakdown as any;

    useEffect(() => {
        fetchBooking();
    }, [bookingId]);

    const fetchBooking = async () => {
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`);
            const data = await response.json();
            setBooking(data.booking);
            setStatus(data.booking?.status || '');
            setPaymentStatus(data.booking?.paymentStatus || '');
            setPaymentMethod(data.booking?.paymentMethod || '');
        } catch (error) {
            console.error('Error fetching booking:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveUpdates = async () => {
        if (!booking) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status,
                    paymentStatus,
                    paymentMethod,
                }),
            });

            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors de la mise à jour');
            }

            setBooking(data.booking);
            alert('Mise à jour enregistrée');
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    const deleteBooking = async () => {
        if (!confirm('Supprimer définitivement cette réservation ?')) return;
        setDeleting(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'DELETE',
            });

            const data = await response.json().catch(() => null);
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors de la suppression');
            }

            router.push('/admin/bookings');
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert('Erreur lors de la suppression');
        } finally {
            setDeleting(false);
        }
    };

    const confirmPayment = async () => {
        if (!confirm('Confirmer le paiement en espèces ?')) return;

        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, {
                method: 'POST',
            });

            if (response.ok) {
                alert('Paiement confirmé !');
                fetchBooking();
            } else {
                alert('Erreur lors de la confirmation');
            }
        } catch (error) {
            console.error('Error confirming payment:', error);
            alert('Erreur serveur');
        }
    };

    const generatePDF = async (type: 'bon' | 'facture') => {
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/generate-pdf?type=${type}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok && data.url) {
                window.open(data.url, '_blank');
            } else {
                alert('Erreur lors de la génération du PDF');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erreur serveur');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5CD85A]"></div>
            </div>
        );
    }

    if (!booking) {
        return (
            <div className="p-6">
                <p className="text-center text-gray-500">Réservation introuvable</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/bookings">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-[#0A0A0A]">Réservation #{booking.id}</h1>
                    <p className="text-gray-600 mt-1">Détails complets</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Informations du trajet</span>
                                <Badge className={
                                    booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-gray-100 text-gray-700'
                                }>
                                    {booking.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Départ</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.pickupAddress}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Arrivée</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.dropoffAddress}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Date</label>
                                    <p className="text-[#0A0A0A] font-medium">
                                        {new Date(booking.pickupDate).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Heure</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.pickupTime}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Passagers</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.passengers}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Bagages</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.luggage}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Type de service</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.serviceType}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Distance</label>
                                    <p className="text-[#0A0A0A] font-medium">{booking.distance} km</p>
                                </div>
                            </div>

                            {booking.notes && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Notes</label>
                                    <p className="text-[#0A0A0A] mt-1">{booking.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Informations client</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-600">Nom</label>
                                <p className="text-[#0A0A0A] font-medium">{booking.guestName}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Email</label>
                                <p className="text-[#0A0A0A] font-medium">{booking.guestEmail}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-600">Téléphone</label>
                                <p className="text-[#0A0A0A] font-medium">{booking.guestPhone}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Breakdown détaillé (admin seulement) */}
                    {breakdown && (
                        <Card className="border-0 shadow-lg bg-gray-50">
                            <CardHeader>
                                <CardTitle className="text-lg">Détail tarifaire (Admin)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {breakdown.costCA_out && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">CA (dépôt → pickup)</span>
                                        <span className="font-medium">{parseFloat(String(breakdown.costCA_out || '0')).toFixed(2)}€</span>
                                    </div>
                                )}
                                {breakdown.costTP && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">TP (pickup → dropoff)</span>
                                        <span className="font-medium">{parseFloat(String(breakdown.costTP || '0')).toFixed(2)}€</span>
                                    </div>
                                )}
                                {breakdown.costCA_return && booking.tripType === 'round-trip' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">CA retour (dropoff → dépôt)</span>
                                        <span className="font-medium">{parseFloat(String(breakdown.costCA_return || '0')).toFixed(2)}€</span>
                                    </div>
                                )}
                                {breakdown.tollCost && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Péages</span>
                                        <span className="font-medium">{parseFloat(String(breakdown.tollCost || '0')).toFixed(2)}€</span>
                                    </div>
                                )}
                                {breakdown.bracket && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Bracket tarifaire</span>
                                        <span className="font-medium">{String(breakdown.bracket)}</span>
                                    </div>
                                )}
                                {breakdown.isForfaitAgglomeration && (
                                    <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
                                        Forfait agglomération appliqué (≤25km A/R)
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-6">
                    <Card className="border-0 shadow-lg bg-[#0A0A0A] text-white">
                        <CardHeader>
                            <CardTitle>Tarification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">Prix HT</span>
                                <span className="font-medium">{formatPrice(parseFloat(booking.basePrice))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/70">TVA (10%)</span>
                                <span className="font-medium">{formatPrice(parseFloat(booking.tvaAmount || '0'))}</span>
                            </div>
                            <div className="h-px bg-white/20"></div>
                            <div className="flex justify-between">
                                <span className="font-semibold">Total TTC</span>
                                <span className="font-bold text-2xl text-[#5CD85A]">
                                    {formatPrice(parseFloat(booking.totalPrice))}
                                </span>
                            </div>
                            <div className="mt-4 p-3 bg-white/10 rounded-lg">
                                <div className="text-sm text-white/70">Mode de paiement</div>
                                <div className="font-medium mt-1">{booking.paymentMethod}</div>
                            </div>
                            <div className="p-3 bg-white/10 rounded-lg">
                                <div className="text-sm text-white/70">Statut paiement</div>
                                <div className="font-medium mt-1">{booking.paymentStatus}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="rounded-lg border border-gray-100 p-3 space-y-3">
                                <div className="text-sm font-semibold text-[#0A0A0A]">Mise à jour rapide</div>
                                <div className="grid grid-cols-1 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Statut réservation</div>
                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">pending</SelectItem>
                                                <SelectItem value="confirmed">confirmed</SelectItem>
                                                <SelectItem value="in_progress">in_progress</SelectItem>
                                                <SelectItem value="completed">completed</SelectItem>
                                                <SelectItem value="cancelled">cancelled</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Méthode</div>
                                            <Select value={paymentMethod || ''} onValueChange={setPaymentMethod}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="stripe">stripe</SelectItem>
                                                    <SelectItem value="cash">cash</SelectItem>
                                                    <SelectItem value="other">other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Statut</div>
                                            <Select value={paymentStatus || ''} onValueChange={setPaymentStatus}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">pending</SelectItem>
                                                    <SelectItem value="paid">paid</SelectItem>
                                                    <SelectItem value="refunded">refunded</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    onClick={saveUpdates}
                                    disabled={saving}
                                    className="w-full bg-[#00FF88] hover:bg-[#00FF88]/90 text-black"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                            </div>

                            {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                                <Button
                                    onClick={confirmPayment}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirmer le paiement
                                </Button>
                            )}
                            <Button
                                onClick={() => generatePDF('bon')}
                                variant="outline"
                                className="w-full"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Bon de commande
                            </Button>
                            <Button
                                onClick={() => generatePDF('facture')}
                                variant="outline"
                                className="w-full"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Générer facture
                            </Button>

                            <Button
                                onClick={deleteBooking}
                                variant="destructive"
                                className="w-full"
                                disabled={deleting}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {deleting ? 'Suppression...' : 'Supprimer'}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
