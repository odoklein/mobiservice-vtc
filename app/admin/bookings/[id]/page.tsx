'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    FileText,
    Check,
    Trash2,
    Save,
    X,
    AlertCircle,
    MessageSquare,
    Edit,
    Percent,
    MapPin,
    Calendar,
    Clock,
    Users,
    Briefcase,
    Phone,
    Mail,
    Car,
    BadgeCheck,
    XCircle,
    Send,
    Receipt,
    CreditCard,
    Banknote,
    Route,
    Timer
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

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
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [showNotesDialog, setShowNotesDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [applyingDiscount, setApplyingDiscount] = useState(false);
    const [editingBooking, setEditingBooking] = useState({
        pickupAddress: '',
        dropoffAddress: '',
        pickupDate: '',
        pickupTime: '',
        passengers: 1,
        luggage: 0,
        notes: '',
    });

    const breakdown = booking?.priceBreakdown as Record<string, unknown> | undefined;

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
            setAdminNotes(data.booking?.adminNotes || '');
            if (data.booking) {
                setEditingBooking({
                    pickupAddress: data.booking.pickupAddress || '',
                    dropoffAddress: data.booking.dropoffAddress || '',
                    pickupDate: data.booking.pickupDate ? new Date(data.booking.pickupDate).toISOString().split('T')[0] : '',
                    pickupTime: data.booking.pickupTime || '',
                    passengers: data.booking.passengers || 1,
                    luggage: data.booking.luggage || 0,
                    notes: data.booking.notes || '',
                });
            }
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
                body: JSON.stringify({ status, paymentStatus, paymentMethod }),
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
            const response = await fetch(`/api/admin/bookings/${bookingId}`, { method: 'DELETE' });
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
            const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, { method: 'POST' });
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
            const response = await fetch(`/api/admin/bookings/${bookingId}/generate-pdf?type=${type}`, { method: 'POST' });
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

    const approveBooking = async () => {
        if (!confirm('Approuver cette réservation ? Un email de confirmation sera envoyé au client.')) return;
        setApproving(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notes: adminNotes || undefined }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || "Erreur lors de l'approbation");
            }
            alert('Réservation approuvée avec succès !');
            fetchBooking();
        } catch (error) {
            console.error('Error approving booking:', error);
            alert(error instanceof Error ? error.message : "Erreur lors de l'approbation");
        } finally {
            setApproving(false);
        }
    };

    const rejectBooking = async () => {
        if (!rejectionReason || rejectionReason.length < 10) {
            alert('Veuillez fournir une raison de refus (minimum 10 caractères)');
            return;
        }
        setRejecting(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason, notes: adminNotes || undefined }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors du refus');
            }
            alert('Réservation refusée. Un email a été envoyé au client.');
            setShowRejectDialog(false);
            setRejectionReason('');
            fetchBooking();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert(error instanceof Error ? error.message : 'Erreur lors du refus');
        } finally {
            setRejecting(false);
        }
    };

    const saveAdminNotes = async () => {
        if (!booking) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminNotes }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors de la sauvegarde');
            }
            setBooking(data.booking);
            setShowNotesDialog(false);
            alert('Notes enregistrées');
        } catch (error) {
            console.error('Error saving notes:', error);
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const saveBookingEdits = async () => {
        if (!booking) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pickupAddress: editingBooking.pickupAddress,
                    dropoffAddress: editingBooking.dropoffAddress,
                    pickupDate: editingBooking.pickupDate ? new Date(editingBooking.pickupDate) : booking.pickupDate,
                    pickupTime: editingBooking.pickupTime,
                    passengers: editingBooking.passengers,
                    luggage: editingBooking.luggage,
                    notes: editingBooking.notes,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors de la mise à jour');
            }
            setBooking(data.booking);
            setShowEditDialog(false);
            alert('Réservation mise à jour avec succès');
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    // State for selected discount (before accepting)
    const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);

    const acceptQuoteWithDiscount = async (discountPercent?: number) => {
        if (!booking) return;
        const message = discountPercent
            ? `Accepter la demande avec ${discountPercent}% de remise ? Un email sera envoyé au client.`
            : 'Accepter la demande ? Un email sera envoyé au client.';
        if (!confirm(message)) return;
        setApproving(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/accept-quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    discountPercentage: discountPercent,
                    notes: adminNotes || undefined
                }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || "Erreur lors de l'acceptation");
            }
            alert(discountPercent
                ? `Demande acceptée avec ${discountPercent}% de remise ! Email envoyé au client.`
                : 'Demande acceptée ! Email envoyé au client.');
            setSelectedDiscount(null);
            fetchBooking();
        } catch (error) {
            console.error('Error accepting quote:', error);
            alert(error instanceof Error ? error.message : "Erreur lors de l'acceptation");
        } finally {
            setApproving(false);
        }
    };

    const refuseQuoteWithReason = async () => {
        if (!rejectionReason || rejectionReason.length < 10) {
            setShowRejectDialog(true);
            return;
        }
        setRejecting(true);
        try {
            const response = await fetch(`/api/admin/bookings/${bookingId}/reject`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reason: rejectionReason,
                    notes: adminNotes || undefined
                }),
            });
            const data = await response.json();
            if (!response.ok || !data?.success) {
                throw new Error(data?.message || 'Erreur lors du refus');
            }
            alert('Demande refusée. Email envoyé au client.');
            setShowRejectDialog(false);
            setRejectionReason('');
            fetchBooking();
        } catch (error) {
            console.error('Error refusing quote:', error);
            alert(error instanceof Error ? error.message : 'Erreur lors du refus');
        } finally {
            setRejecting(false);
        }
    };

    // Status configuration
    const getStatusConfig = (statusValue: string) => {
        const configs: Record<string, { label: string; color: string; icon: React.ElementType; bgColor: string }> = {
            quote_pending: { label: 'Nouvelle Demande', color: 'text-amber-700', icon: Clock, bgColor: 'bg-amber-100' },
            quote_sent: { label: 'Demande en Attente', color: 'text-purple-700', icon: Send, bgColor: 'bg-purple-100' },
            quote_modified: { label: 'Remise Sélectionnée', color: 'text-indigo-700', icon: Percent, bgColor: 'bg-indigo-100' },
            quote_accepted: { label: 'Devis Accepté', color: 'text-emerald-700', icon: BadgeCheck, bgColor: 'bg-emerald-100' },
            quote_refused: { label: 'Refusé', color: 'text-rose-700', icon: XCircle, bgColor: 'bg-rose-100' },
            refused: { label: 'Refusé', color: 'text-rose-700', icon: XCircle, bgColor: 'bg-rose-100' },
            pending: { label: 'En Attente', color: 'text-amber-700', icon: Clock, bgColor: 'bg-amber-100' },
            verified: { label: 'Vérifié', color: 'text-blue-700', icon: BadgeCheck, bgColor: 'bg-blue-100' },
            confirmed: { label: 'Confirmé', color: 'text-green-700', icon: Check, bgColor: 'bg-green-100' },
            in_progress: { label: 'En Cours', color: 'text-cyan-700', icon: Car, bgColor: 'bg-cyan-100' },
            completed: { label: 'Terminé', color: 'text-gray-700', icon: Check, bgColor: 'bg-gray-100' },
            cancelled: { label: 'Annulé', color: 'text-red-700', icon: X, bgColor: 'bg-red-100' },
        };
        return configs[statusValue] || { label: statusValue, color: 'text-gray-700', icon: AlertCircle, bgColor: 'bg-gray-100' };
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

    const statusConfig = getStatusConfig(booking.status);
    const StatusIcon = statusConfig.icon;
    const isQuoteStatus = ['quote_pending', 'quote_sent', 'quote_modified', 'quote_accepted'].includes(booking.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Link href="/admin/bookings" className="self-start sm:self-center">
                                <Button variant="ghost" size="sm" className="gap-2 -ml-2 sm:ml-0">
                                    <ArrowLeft className="h-4 w-4" />
                                    Retour
                                </Button>
                            </Link>
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                                        {isQuoteStatus ? 'Devis' : 'Réservation'} #{booking.id}
                                    </h1>
                                    <Badge className={`${statusConfig.bgColor} ${statusConfig.color} gap-1 px-3 py-1`}>
                                        <StatusIcon className="h-3.5 w-3.5" />
                                        {statusConfig.label}
                                    </Badge>
                                </div>
                                <p className="text-gray-500 text-sm mt-1">
                                    Créé le {new Date(booking.createdAt).toLocaleDateString('fr-FR')} à {new Date(booking.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)} className="w-full sm:w-auto mt-2 sm:mt-0">
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                        </Button>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                {/* Quote Action Banner - Only for pending quote statuses */}
                {['quote_pending', 'quote_sent', 'quote_modified'].includes(booking.status) && (
                    <Card className="mb-6 border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col sm:flex-row items-start gap-4">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                                        <Receipt className="h-6 w-6 md:h-7 md:w-7 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Nouvelle Demande de Devis</h2>
                                        <p className="text-sm md:text-base text-gray-600 mt-1">
                                            Le client attend votre réponse. Vous pouvez accepter la demande (avec ou sans remise) ou la refuser.
                                        </p>
                                        {(selectedDiscount || booking.discountPercentage) && (
                                            <div className="mt-2 inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                                                <Percent className="h-3 w-3 md:h-4 md:w-4" />
                                                Remise de {selectedDiscount || booking.discountPercentage}% sélectionnée
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Row */}
                                <div className="flex flex-col gap-4 pt-4 border-t border-amber-200">
                                    {/* Discount Selection */}
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">Remise :</span>
                                        <div className="grid grid-cols-4 gap-2 w-full sm:w-auto">
                                            <Button
                                                variant={selectedDiscount === null ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => setSelectedDiscount(null)}
                                                className={cn(
                                                    "h-10 md:h-9",
                                                    selectedDiscount === null ? "bg-gray-800 text-white" : ""
                                                )}
                                            >
                                                Aucune
                                            </Button>
                                            {[5, 8, 12].map((percent) => (
                                                <Button
                                                    key={percent}
                                                    variant={selectedDiscount === percent ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setSelectedDiscount(percent)}
                                                    className={cn(
                                                        "h-10 md:h-9",
                                                        selectedDiscount === percent
                                                            ? "bg-green-600 hover:bg-green-700 text-white"
                                                            : "border-green-300 text-green-700 hover:bg-green-50"
                                                    )}
                                                >
                                                    -{percent}%
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Accept/Refuse Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto w-full sm:w-auto">
                                        <Button
                                            onClick={() => acceptQuoteWithDiscount(selectedDiscount || undefined)}
                                            disabled={approving}
                                            className="h-12 md:h-10 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white gap-2 text-base md:text-sm"
                                        >
                                            <Check className="h-5 w-5 md:h-4 md:w-4" />
                                            {approving ? 'Confirmation...' : selectedDiscount ? `Accepter (-${selectedDiscount}%)` : 'Accepter'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowRejectDialog(true)}
                                            disabled={rejecting}
                                            className="h-12 md:h-10 w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 gap-2 text-base md:text-sm"
                                        >
                                            <X className="h-5 w-5 md:h-4 md:w-4" />
                                            Refuser
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Customer Comment Alert */}
                {booking.customerComment && (
                    <Card className="mb-6 border-2 border-yellow-200 bg-yellow-50">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <MessageSquare className="h-5 w-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-800">Commentaire du client</p>
                                    <p className="text-yellow-700 mt-1 italic">"{booking.customerComment}"</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trip Details Card */}
                        <Card className="overflow-hidden">
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4 md:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Route className="h-5 w-5 text-[#5CD85A]" />
                                    Détails du Trajet
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                {/* Route visualization */}
                                <div className="relative pl-6 md:pl-8 space-y-6 mb-6">
                                    <div className="absolute left-2 md:left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-[#5CD85A] to-red-500"></div>

                                    <div className="relative">
                                        <div className="absolute -left-7 md:-left-8 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#5CD85A] flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Départ</p>
                                            <p className="text-gray-900 font-medium mt-1 text-sm md:text-base">{booking.pickupAddress}</p>
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-7 md:-left-8 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 flex items-center justify-center">
                                            <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Arrivée</p>
                                            <p className="text-gray-900 font-medium mt-1 text-sm md:text-base">{booking.dropoffAddress}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Trip info grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <Calendar className="h-5 w-5 text-[#5CD85A] mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Date</p>
                                        <p className="font-semibold text-gray-900 text-sm md:text-base">{new Date(booking.pickupDate).toLocaleDateString('fr-FR')}</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <Clock className="h-5 w-5 text-[#5CD85A] mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Heure</p>
                                        <p className="font-semibold text-gray-900 text-sm md:text-base">{booking.pickupTime}</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <Users className="h-5 w-5 text-[#5CD85A] mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Passagers</p>
                                        <p className="font-semibold text-gray-900 text-sm md:text-base">{booking.passengers}</p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                                        <Briefcase className="h-5 w-5 text-[#5CD85A] mx-auto mb-2" />
                                        <p className="text-xs text-gray-500">Bagages</p>
                                        <p className="font-semibold text-gray-900 text-sm md:text-base">{booking.luggage}</p>
                                    </div>
                                </div>

                                {/* Additional info */}
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500">Type de service</p>
                                        <p className="font-medium text-gray-900 capitalize text-sm md:text-base">{booking.serviceType}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <p className="text-xs text-gray-500">Distance</p>
                                        <p className="font-medium text-gray-900 text-sm md:text-base">{booking.distance} km</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Card */}
                        <Card>
                            <CardHeader className="bg-gray-50 border-b border-gray-100 p-4 md:p-6">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Users className="h-5 w-5 text-[#5CD85A]" />
                                    Informations Client
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#5CD85A] to-emerald-600 flex items-center justify-center text-white text-xl md:text-2xl font-bold self-center md:self-auto">
                                        {booking.guestName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 space-y-3 text-center md:text-left">
                                        <div>
                                            <p className="text-lg md:text-xl font-bold text-gray-900">{booking.guestName}</p>
                                        </div>
                                        <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-4 justify-center md:justify-start">
                                            <a href={`mailto:${booking.guestEmail}`} className="flex items-center gap-2 text-gray-600 hover:text-[#5CD85A] transition-colors text-sm">
                                                <Mail className="h-4 w-4" />
                                                {booking.guestEmail}
                                            </a>
                                            <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-2 text-gray-600 hover:text-[#5CD85A] transition-colors text-sm">
                                                <Phone className="h-4 w-4" />
                                                {booking.guestPhone}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes Card */}
                        {booking.notes && (
                            <Card>
                                <CardHeader className="bg-gray-50 border-b border-gray-100 p-4 md:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <MessageSquare className="h-5 w-5 text-[#5CD85A]" />
                                        Notes du Client
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <p className="text-gray-700 text-sm md:text-base">{booking.notes}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Pricing Breakdown */}
                        {breakdown && (
                            <Card>
                                <CardHeader className="bg-gray-50 border-b border-gray-100 p-4 md:p-6">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Receipt className="h-5 w-5 text-[#5CD85A]" />
                                        Détail Tarifaire
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="space-y-2 text-sm">
                                        {!!breakdown.costCA_out && (
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">CA (dépôt → pickup)</span>
                                                <span className="font-medium">{parseFloat(String(breakdown.costCA_out || '0')).toFixed(2)}€</span>
                                            </div>
                                        )}
                                        {!!breakdown.costTP && (
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">TP (pickup → dropoff)</span>
                                                <span className="font-medium">{parseFloat(String(breakdown.costTP || '0')).toFixed(2)}€</span>
                                            </div>
                                        )}
                                        {!!breakdown.costCA_return && booking.tripType === 'round-trip' && (
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">CA retour (dropoff → dépôt)</span>
                                                <span className="font-medium">{parseFloat(String(breakdown.costCA_return || '0')).toFixed(2)}€</span>
                                            </div>
                                        )}
                                        {!!breakdown.tollCost && (
                                            <div className="flex justify-between py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Péages</span>
                                                <span className="font-medium">{parseFloat(String(breakdown.tollCost || '0')).toFixed(2)}€</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
                            <CardContent className="p-4 md:p-6">
                                <div className="text-center mb-6">
                                    <p className="text-gray-400 text-sm mb-2">Total TTC</p>
                                    <p className="text-3xl md:text-4xl font-bold text-[#5CD85A]">
                                        {formatPrice(parseFloat(booking.totalPriceTTC || booking.totalPrice))}
                                    </p>
                                    {booking.discountPercentage && (
                                        <p className="text-green-400 text-sm mt-2">
                                            -{booking.discountPercentage}% de remise appliquée
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Prix HT</span>
                                        <span>{formatPrice(parseFloat(booking.totalPriceHT || booking.basePrice))}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">TVA (10%)</span>
                                        <span>{formatPrice(parseFloat(booking.tvaAmount || '0'))}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        {booking.paymentMethod === 'cash' ? (
                                            <Banknote className="h-4 w-4 text-amber-400" />
                                        ) : (
                                            <CreditCard className="h-4 w-4 text-blue-400" />
                                        )}
                                        <span className="text-gray-400">Paiement:</span>
                                        <span className="capitalize">{booking.paymentMethod}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Timer className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-400">Statut:</span>
                                        <span className="capitalize">{booking.paymentStatus}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Admin Notes */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Notes Internes
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setShowNotesDialog(true)}>
                                    {booking.adminNotes ? 'Modifier' : 'Ajouter'}
                                </Button>
                            </CardHeader>
                            <CardContent className="pt-0">
                                {booking.adminNotes ? (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{booking.adminNotes}</p>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Aucune note interne</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-base">Actions Rapides</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Status Update */}
                                <div>
                                    <Label className="text-xs text-gray-500">Statut</Label>
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">En attente</SelectItem>
                                            <SelectItem value="quote_sent">Devis envoyé</SelectItem>
                                            <SelectItem value="quote_modified">Remise appliquée</SelectItem>
                                            <SelectItem value="quote_accepted">Devis accepté</SelectItem>
                                            <SelectItem value="quote_refused">Devis refusé</SelectItem>
                                            <SelectItem value="verified">Vérifié</SelectItem>
                                            <SelectItem value="confirmed">Confirmé</SelectItem>
                                            <SelectItem value="in_progress">En cours</SelectItem>
                                            <SelectItem value="completed">Terminé</SelectItem>
                                            <SelectItem value="cancelled">Annulé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs text-gray-500">Méthode</Label>
                                        <Select value={paymentMethod || ''} onValueChange={setPaymentMethod}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="stripe">Carte</SelectItem>
                                                <SelectItem value="cash">Espèces</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-gray-500">Paiement</Label>
                                        <Select value={paymentStatus || ''} onValueChange={setPaymentStatus}>
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pending">En attente</SelectItem>
                                                <SelectItem value="paid">Payé</SelectItem>
                                                <SelectItem value="refunded">Remboursé</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button onClick={saveUpdates} disabled={saving} className="w-full bg-[#5CD85A] hover:bg-[#4BC449] text-black">
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>

                                {booking.paymentMethod === 'cash' && booking.paymentStatus === 'pending' && (
                                    <Button onClick={confirmPayment} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                                        <Banknote className="h-4 w-4 mr-2" />
                                        Confirmer Paiement Espèces
                                    </Button>
                                )}

                                <div className="pt-4 border-t border-gray-100 space-y-2">
                                    <Button variant="outline" onClick={() => generatePDF('bon')} className="w-full justify-start">
                                        <FileText className="h-4 w-4 mr-2" />
                                        Bon de commande
                                    </Button>
                                    <Button variant="outline" onClick={() => generatePDF('facture')} className="w-full justify-start">
                                        <Receipt className="h-4 w-4 mr-2" />
                                        Générer facture
                                    </Button>
                                </div>

                                <Button variant="destructive" onClick={deleteBooking} disabled={deleting} className="w-full mt-4">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    {deleting ? 'Suppression...' : 'Supprimer'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refuser la demande</DialogTitle>
                        <DialogDescription>
                            Veuillez fournir une raison de refus. Cette raison sera envoyée au client par email.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Raison du refus <span className="text-red-500">*</span></Label>
                            <Textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Ex: Pas de disponibilité à cette date, véhicule réservé..."
                                className="mt-2 min-h-[100px]"
                            />
                            <p className="text-sm text-gray-500 mt-1">Minimum 10 caractères</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
                        <Button onClick={refuseQuoteWithReason} disabled={rejecting || rejectionReason.length < 10} variant="destructive">
                            {rejecting ? 'Envoi...' : 'Refuser et envoyer email'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Notes internes</DialogTitle>
                        <DialogDescription>Ces notes ne sont pas visibles par le client.</DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Ajoutez des notes..."
                        className="min-h-[150px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNotesDialog(false)}>Annuler</Button>
                        <Button onClick={saveAdminNotes} disabled={saving} className="bg-[#5CD85A] hover:bg-[#4BC449] text-black">
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Modifier la réservation</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div className="md:col-span-2">
                            <Label>Adresse de départ</Label>
                            <Input
                                value={editingBooking.pickupAddress}
                                onChange={(e) => setEditingBooking({ ...editingBooking, pickupAddress: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Adresse d'arrivée</Label>
                            <Input
                                value={editingBooking.dropoffAddress}
                                onChange={(e) => setEditingBooking({ ...editingBooking, dropoffAddress: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Date</Label>
                            <Input
                                type="date"
                                value={editingBooking.pickupDate}
                                onChange={(e) => setEditingBooking({ ...editingBooking, pickupDate: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Heure</Label>
                            <Input
                                type="time"
                                value={editingBooking.pickupTime}
                                onChange={(e) => setEditingBooking({ ...editingBooking, pickupTime: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Passagers</Label>
                            <Input
                                type="number"
                                min="1"
                                max="4"
                                value={editingBooking.passengers}
                                onChange={(e) => setEditingBooking({ ...editingBooking, passengers: parseInt(e.target.value) || 1 })}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Bagages</Label>
                            <Input
                                type="number"
                                min="0"
                                max="5"
                                value={editingBooking.luggage}
                                onChange={(e) => setEditingBooking({ ...editingBooking, luggage: parseInt(e.target.value) || 0 })}
                                className="mt-1"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label>Notes</Label>
                            <Textarea
                                value={editingBooking.notes}
                                onChange={(e) => setEditingBooking({ ...editingBooking, notes: e.target.value })}
                                className="mt-1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDialog(false)}>Annuler</Button>
                        <Button onClick={saveBookingEdits} disabled={saving} className="bg-[#5CD85A] hover:bg-[#4BC449] text-black">
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
