'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BRAND, CONTACT, DRIVER, VTC_DEPOT } from '@/lib/constants';
import {
    IconArrowLeft,
    IconLoader2,
    IconMapPin,
    IconCalendar,
    IconClock,
    IconUser,
    IconPhone,
    IconMail,
    IconCar,
    IconReceipt,
    IconDiscount,
    IconAlertCircle,
    IconCircleCheck,
    IconCircleX,
    IconClockHour4,
    IconRefresh,
} from '@tabler/icons-react';

interface QuoteData {
    id: number;
    status: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupDate: string;
    pickupTime: string;
    passengers: number;
    luggage: number;
    serviceType: string;
    tripType: string;
    distance: string;
    duration: number;
    totalPriceHT: string;
    totalPriceTTC: string;
    tvaAmount: string;
    tvaRate: string;
    isNightRate: boolean;
    rateType: string;
    discountPercentage: number | null;
    discountAmount: string | null;
    customerComment: string | null;
    adminNotes: string | null;
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Quote Page - PASSIVE VIEW
 * 
 * This page is for the CLIENT to VIEW their quote/reservation status.
 * The CLIENT cannot accept or refuse - only the DRIVER can make decisions.
 * 
 * Statuses displayed:
 * - quote_pending / quote_sent: "En attente de confirmation"
 * - confirmed: "Réservation confirmée"
 * - refused: "Demande non disponible"
 */
export default function QuotePage() {
    const params = useParams();
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchQuote();

        // Auto-refresh every 30 seconds for pending quotes
        const interval = setInterval(() => {
            if (quote && ['quote_pending', 'quote_sent', 'quote_modified'].includes(quote.status)) {
                fetchQuote(true);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [params.id]);

    const fetchQuote = async (silent = false) => {
        if (!silent) setLoading(true);
        if (silent) setRefreshing(true);

        try {
            const response = await fetch(`/api/quote/${params.id}`);
            const data = await response.json();

            if (data.success) {
                setQuote(data.quote);
            } else {
                setError(data.error || 'Devis introuvable');
            }
        } catch (err) {
            setError('Erreur lors du chargement du devis');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'quote_pending':
            case 'quote_sent':
            case 'quote_modified':
                return {
                    type: 'pending' as const,
                    label: 'En attente de confirmation',
                    description: 'Votre demande est en cours de traitement. Vous recevrez un email dès que le chauffeur aura confirmé.',
                    color: 'bg-amber-50 border-amber-200 text-amber-800',
                    iconBg: 'bg-amber-100',
                    icon: IconClockHour4,
                };
            case 'confirmed':
                return {
                    type: 'success' as const,
                    label: 'Réservation confirmée',
                    description: 'Votre réservation est confirmée ! Le chauffeur vous contactera avant le jour du trajet.',
                    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
                    iconBg: 'bg-emerald-100',
                    icon: IconCircleCheck,
                };
            case 'refused':
            case 'quote_refused':
                return {
                    type: 'error' as const,
                    label: 'Demande non disponible',
                    description: 'Nous ne pouvons malheureusement pas donner suite à votre demande.',
                    color: 'bg-red-50 border-red-200 text-red-800',
                    iconBg: 'bg-red-100',
                    icon: IconCircleX,
                };
            case 'cancelled':
                return {
                    type: 'error' as const,
                    label: 'Réservation annulée',
                    description: 'Cette réservation a été annulée.',
                    color: 'bg-gray-50 border-gray-200 text-gray-800',
                    iconBg: 'bg-gray-100',
                    icon: IconCircleX,
                };
            case 'completed':
                return {
                    type: 'success' as const,
                    label: 'Trajet effectué',
                    description: 'Merci d\'avoir voyagé avec MobiService VTC !',
                    color: 'bg-blue-50 border-blue-200 text-blue-800',
                    iconBg: 'bg-blue-100',
                    icon: IconCircleCheck,
                };
            default:
                return {
                    type: 'pending' as const,
                    label: 'En cours',
                    description: '',
                    color: 'bg-gray-50 border-gray-200 text-gray-800',
                    iconBg: 'bg-gray-100',
                    icon: IconAlertCircle,
                };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <IconLoader2 className="h-12 w-12 animate-spin text-[#5CD85A] mx-auto mb-4" />
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (error || !quote) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full mx-4">
                    <CardContent className="pt-8 text-center">
                        <IconAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Réservation introuvable</h2>
                        <p className="text-gray-600 mb-6">{error || 'Cette page n\'existe pas ou a expiré.'}</p>
                        <Button asChild>
                            <Link href="/reservation">Faire une nouvelle demande</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = getStatusConfig(quote.status);
    const StatusIcon = statusConfig.icon;
    const isPending = ['quote_pending', 'quote_sent', 'quote_modified'].includes(quote.status);
    const isConfirmed = quote.status === 'confirmed';
    const isRefused = ['refused', 'quote_refused'].includes(quote.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-[#0A0A0A] text-white">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
                        <IconArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl md:text-3xl font-bold">
                            {isConfirmed ? (
                                <>
                                    <span className="text-[#5CD85A]">✓</span> Réservation #{quote.id}
                                </>
                            ) : (
                                <>
                                    <span className="text-[#5CD85A]">📄</span> Demande #{quote.id}
                                </>
                            )}
                        </h1>
                        {isPending && (
                            <button
                                onClick={() => fetchQuote(true)}
                                disabled={refreshing}
                                className="flex items-center gap-2 text-white/60 hover:text-white text-sm"
                            >
                                <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Status Banner */}
                <div className={`${statusConfig.color} rounded-xl p-5 mb-6 border-2`}>
                    <div className="flex items-start gap-4">
                        <div className={`${statusConfig.iconBg} w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0`}>
                            <StatusIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg">{statusConfig.label}</p>
                            <p className="text-sm opacity-80 mt-1">{statusConfig.description}</p>

                            {/* Rejection reason */}
                            {isRefused && quote.rejectionReason && (
                                <div className="mt-3 p-3 bg-white/50 rounded-lg">
                                    <p className="text-sm font-medium">Raison :</p>
                                    <p className="text-sm mt-1">{quote.rejectionReason}</p>
                                </div>
                            )}

                            {/* Pending animation */}
                            {isPending && (
                                <div className="mt-3 flex items-center gap-2 text-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    <span>En attente de réponse</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Discount Banner */}
                {quote.discountPercentage && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 mb-6 flex items-center gap-3">
                        <IconDiscount className="h-8 w-8" />
                        <div>
                            <p className="font-bold text-lg">Remise de {quote.discountPercentage}% appliquée !</p>
                            <p className="text-sm opacity-90">Vous économisez {quote.discountAmount}€ sur votre trajet</p>
                        </div>
                    </div>
                )}

                {/* Main Quote Card */}
                <Card className="shadow-xl mb-6 overflow-hidden">
                    <CardContent className="p-0">
                        {/* Company Header */}
                        <div className="bg-gray-50 border-b border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-4">SERVICE DE VOITURE DE TRANSPORT AVEC CHAUFFEUR</p>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="font-bold text-lg text-[#0A0A0A]">{BRAND.name}</p>
                                <p className="text-gray-600">Location de véhicule avec chauffeur</p>
                                <p className="text-sm text-gray-500 mt-2">{VTC_DEPOT.address}</p>
                            </div>
                        </div>

                        {/* Driver Info - Only show if confirmed */}
                        {isConfirmed && (
                            <div className="p-6 border-b border-gray-200 bg-emerald-50">
                                <div className="flex items-center gap-2 text-gray-700 mb-2">
                                    <IconCar className="h-5 w-5 text-emerald-600" />
                                    <span className="font-semibold">Votre chauffeur :</span>
                                    <span>{DRIVER.name}</span>
                                </div>
                                <p className="text-sm text-emerald-700 mt-2">
                                    Le chauffeur vous contactera avant le jour du trajet pour confirmer les détails.
                                </p>
                            </div>
                        )}

                        {/* Customer Info */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 text-gray-700">
                                <IconUser className="h-5 w-5 text-[#5CD85A]" />
                                <span className="font-semibold">Client :</span>
                                <span>{quote.guestName}</span>
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <IconCalendar className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Date de prise en charge</p>
                                    <p className="font-medium">{formatDate(quote.pickupDate)} à {quote.pickupTime}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IconMapPin className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Lieu de départ</p>
                                    <p className="font-medium">{quote.pickupAddress}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IconMapPin className="h-5 w-5 text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Destination</p>
                                    <p className="font-medium">{quote.dropoffAddress}</p>
                                </div>
                            </div>

                            {/* Trip Info */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <p className="text-sm text-gray-500">Distance estimée</p>
                                    <p className="font-medium">{Math.round(parseFloat(quote.distance || '0'))} km</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Type de trajet</p>
                                    <p className="font-medium">{quote.tripType === 'round-trip' ? 'Aller-Retour' : 'Aller Simple'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Passagers</p>
                                    <p className="font-medium">{quote.passengers}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Bagages</p>
                                    <p className="font-medium">{quote.luggage}</p>
                                </div>
                            </div>
                        </div>

                        {/* Price Section */}
                        <div className="bg-[#0A0A0A] text-white p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/60 text-sm">
                                        {isConfirmed ? 'Montant à régler' : 'Estimation'}
                                        {quote.isNightRate ? ' (Tarif nuit)' : ' (Tarif jour)'}
                                    </p>
                                    <p className="text-3xl font-bold text-[#5CD85A]">{quote.totalPriceTTC} €</p>
                                    <p className="text-white/60 text-sm mt-1">
                                        {quote.totalPriceHT}€ HT + {quote.tvaAmount}€ TVA
                                    </p>
                                    {isConfirmed && (
                                        <p className="text-white/80 text-sm mt-2">
                                            💳 Paiement à bord avec le chauffeur
                                        </p>
                                    )}
                                </div>
                                {quote.discountPercentage && (
                                    <div className="text-right">
                                        <span className="inline-block bg-[#5CD85A] text-[#0A0A0A] px-3 py-1 rounded-full text-sm font-bold">
                                            -{quote.discountPercentage}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action for refused - New request */}
                {isRefused && (
                    <div className="text-center mb-6">
                        <Button asChild size="lg" className="bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]">
                            <Link href="/reservation">
                                Faire une nouvelle demande
                            </Link>
                        </Button>
                    </div>
                )}

                {/* Contact Section */}
                <Card className="bg-[#0A0A0A] text-white">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4">
                            {isPending ? 'Une question ?' : 'Besoin d\'aide ?'}
                        </h3>
                        <div className="space-y-3">
                            <a
                                href={`tel:${CONTACT.phone}`}
                                className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                            >
                                <IconPhone className="h-5 w-5 text-[#5CD85A]" />
                                {CONTACT.phone}
                            </a>
                            <a
                                href={`mailto:${CONTACT.email}`}
                                className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
                            >
                                <IconMail className="h-5 w-5 text-[#5CD85A]" />
                                {CONTACT.email}
                            </a>
                        </div>
                        {isPending && (
                            <p className="text-white/50 text-sm mt-4">
                                Vous pouvez nous contacter pour toute question concernant votre demande.
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Footer note for pending */}
                {isPending && (
                    <p className="text-center text-gray-500 text-sm mt-6">
                        Cette page se met à jour automatiquement. Vous recevrez également un email dès que votre demande sera traitée.
                    </p>
                )}
            </div>
        </div>
    );
}
