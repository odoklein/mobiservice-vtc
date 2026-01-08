'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BRAND, CONTACT, DRIVER, VTC_DEPOT } from '@/lib/constants';
import {
    IconArrowLeft,
    IconCheck,
    IconX,
    IconMessageCircle,
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
    IconEdit,
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

export default function QuotePage() {
    const params = useParams();
    const router = useRouter();
    const [quote, setQuote] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showCommentForm, setShowCommentForm] = useState(false);
    const [showRefuseForm, setShowRefuseForm] = useState(false);
    const [comment, setComment] = useState('');
    const [refuseReason, setRefuseReason] = useState('');

    useEffect(() => {
        fetchQuote();
    }, [params.id]);

    const fetchQuote = async () => {
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
        }
    };

    const handleAccept = async () => {
        if (!quote) return;
        setActionLoading('accept');

        try {
            const response = await fetch(`/api/quote/${quote.id}/accept`, {
                method: 'POST',
            });
            const data = await response.json();

            if (data.success) {
                setQuote({ ...quote, status: 'quote_accepted' });
            } else {
                alert(data.error || 'Erreur lors de l\'acceptation');
            }
        } catch (err) {
            alert('Erreur lors de l\'acceptation du devis');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRefuse = async () => {
        if (!quote) return;
        setActionLoading('refuse');

        try {
            const response = await fetch(`/api/quote/${quote.id}/refuse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: refuseReason }),
            });
            const data = await response.json();

            if (data.success) {
                setQuote({ ...quote, status: 'quote_refused' });
                setShowRefuseForm(false);
            } else {
                alert(data.error || 'Erreur lors du refus');
            }
        } catch (err) {
            alert('Erreur lors du refus du devis');
        } finally {
            setActionLoading(null);
        }
    };

    const handleComment = async () => {
        if (!quote || !comment.trim()) return;
        setActionLoading('comment');

        try {
            const response = await fetch(`/api/quote/${quote.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ comment }),
            });
            const data = await response.json();

            if (data.success) {
                setQuote({ ...quote, customerComment: comment });
                setShowCommentForm(false);
                setComment('');
                alert('Commentaire envoyé avec succès');
            } else {
                alert(data.error || 'Erreur lors de l\'envoi du commentaire');
            }
        } catch (err) {
            alert('Erreur lors de l\'envoi du commentaire');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'quote_sent':
                return { label: 'Devis envoyé', color: 'bg-blue-100 text-blue-800', icon: IconReceipt };
            case 'quote_modified':
                return { label: 'Devis modifié', color: 'bg-amber-100 text-amber-800', icon: IconEdit };
            case 'quote_accepted':
                return { label: 'Devis accepté', color: 'bg-green-100 text-green-800', icon: IconCircleCheck };
            case 'quote_refused':
                return { label: 'Devis refusé', color: 'bg-red-100 text-red-800', icon: IconCircleX };
            case 'confirmed':
                return { label: 'Réservation confirmée', color: 'bg-emerald-100 text-emerald-800', icon: IconCheck };
            default:
                return { label: status, color: 'bg-gray-100 text-gray-800', icon: IconAlertCircle };
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <IconLoader2 className="h-12 w-12 animate-spin text-[#5CD85A] mx-auto mb-4" />
                    <p className="text-gray-600">Chargement du devis...</p>
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
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Devis introuvable</h2>
                        <p className="text-gray-600 mb-6">{error || 'Ce devis n\'existe pas ou a expiré.'}</p>
                        <Button asChild>
                            <Link href="/reservation">Demander un nouveau devis</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusInfo = getStatusInfo(quote.status);
    const StatusIcon = statusInfo.icon;
    const canTakeAction = ['quote_sent', 'quote_modified'].includes(quote.status);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-[#0A0A0A] text-white">
                <div className="container mx-auto px-4 py-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
                        <IconArrowLeft className="h-4 w-4" />
                        Retour à l'accueil
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold">
                        <span className="text-[#5CD85A]">←</span> BON DE RÉSERVATION
                    </h1>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Status Banner */}
                <div className={`${statusInfo.color} rounded-xl p-4 mb-6 flex items-center gap-3`}>
                    <StatusIcon className="h-6 w-6" />
                    <div>
                        <p className="font-semibold">{statusInfo.label}</p>
                        <p className="text-sm opacity-80">Devis n° {quote.id}</p>
                    </div>
                </div>

                {/* Discount Banner */}
                {quote.discountPercentage && (
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl p-4 mb-6 flex items-center gap-3">
                        <IconDiscount className="h-8 w-8" />
                        <div>
                            <p className="font-bold text-lg">Remise de {quote.discountPercentage}% appliquée !</p>
                            <p className="text-sm opacity-90">Économisez {quote.discountAmount}€ sur votre trajet</p>
                        </div>
                    </div>
                )}

                {/* Main Quote Card */}
                <Card className="shadow-xl mb-6 overflow-hidden">
                    <CardContent className="p-0">
                        {/* Company Header */}
                        <div className="bg-gray-50 border-b border-gray-200 p-6">
                            <p className="text-sm text-gray-600 mb-4">SERVICE DE VOITURE DE TRANSPORT AVEC CHAUFFEUR</p>
                            <p className="text-sm text-gray-500">
                                BILLET COLLECTIF<br />
                                (Arrêté du 14 Février 1986 - Article 5)<br />
                                et<br />
                                ORDRE DE MISSION<br />
                                (Arrêté du 6 Janvier 1993 - Article 3)
                            </p>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="font-bold text-lg text-[#0A0A0A]">{BRAND.name}</p>
                                <p className="text-gray-600">Location de véhicule avec chauffeur</p>
                                <p className="text-sm text-gray-500 mt-2">{VTC_DEPOT.address}</p>
                                <p className="text-sm text-gray-500">{CONTACT.phone}</p>
                            </div>
                        </div>

                        {/* Driver Info */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center gap-2 text-gray-700 mb-2">
                                <IconCar className="h-5 w-5 text-[#5CD85A]" />
                                <span className="font-semibold">Conducteur :</span>
                                <span>{DRIVER.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                                <IconUser className="h-5 w-5 text-[#5CD85A]" />
                                <span className="font-semibold">Passager :</span>
                                <span>{quote.guestName} {quote.guestPhone}</span>
                            </div>
                        </div>

                        {/* Trip Details */}
                        <div className="p-6 space-y-4">
                            <div className="flex items-start gap-3">
                                <IconCalendar className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Commande</p>
                                    <p className="font-medium">{formatDate(quote.createdAt)}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IconClock className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Prise en charge</p>
                                    <p className="font-medium">{formatDate(quote.pickupDate)} {quote.pickupTime}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <IconMapPin className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Lieu prise en charge</p>
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
                                    <p className="text-white/60 text-sm">Tarif {quote.isNightRate ? 'nuit' : 'jour'}</p>
                                    <p className="text-3xl font-bold text-[#5CD85A]">{quote.totalPriceTTC} €</p>
                                    <p className="text-white/60 text-sm mt-1">
                                        {quote.totalPriceHT}€ HT + {quote.tvaAmount}€ TVA ({quote.tvaRate}%)
                                    </p>
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

                {/* Customer Comment Display */}
                {quote.customerComment && (
                    <Card className="mb-6">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <IconMessageCircle className="h-5 w-5 text-[#5CD85A] mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-900 mb-1">Votre commentaire</p>
                                    <p className="text-gray-600 italic">"{quote.customerComment}"</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Action Buttons */}
                {canTakeAction && (
                    <div className="space-y-4">
                        {!showRefuseForm && !showCommentForm && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        size="lg"
                                        className="h-14 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] font-bold"
                                        onClick={handleAccept}
                                        disabled={actionLoading !== null}
                                    >
                                        {actionLoading === 'accept' ? (
                                            <IconLoader2 className="h-5 w-5 animate-spin mr-2" />
                                        ) : (
                                            <IconCheck className="h-5 w-5 mr-2" />
                                        )}
                                        Accepter
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="h-14 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold"
                                        onClick={() => setShowRefuseForm(true)}
                                        disabled={actionLoading !== null}
                                    >
                                        <IconX className="h-5 w-5 mr-2" />
                                        Refuser
                                    </Button>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full h-12"
                                    onClick={() => setShowCommentForm(true)}
                                    disabled={actionLoading !== null}
                                >
                                    <IconMessageCircle className="h-5 w-5 mr-2" />
                                    Ajouter un commentaire
                                </Button>
                            </>
                        )}

                        {/* Comment Form */}
                        {showCommentForm && (
                            <Card>
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-4">Ajouter un commentaire</h3>
                                    <textarea
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-[#5CD85A] focus:outline-none resize-none"
                                        rows={4}
                                        placeholder="Écrivez votre message ici..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <Button
                                            className="flex-1 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]"
                                            onClick={handleComment}
                                            disabled={actionLoading !== null || !comment.trim()}
                                        >
                                            {actionLoading === 'comment' ? (
                                                <IconLoader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : null}
                                            Envoyer
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowCommentForm(false);
                                                setComment('');
                                            }}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Refuse Form */}
                        {showRefuseForm && (
                            <Card className="border-red-200">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-4 text-red-600">Refuser le devis</h3>
                                    <textarea
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-red-400 focus:outline-none resize-none"
                                        rows={4}
                                        placeholder="Raison du refus (optionnel)..."
                                        value={refuseReason}
                                        onChange={(e) => setRefuseReason(e.target.value)}
                                    />
                                    <div className="flex gap-3 mt-4">
                                        <Button
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                            onClick={handleRefuse}
                                            disabled={actionLoading !== null}
                                        >
                                            {actionLoading === 'refuse' ? (
                                                <IconLoader2 className="h-5 w-5 animate-spin mr-2" />
                                            ) : null}
                                            Confirmer le refus
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowRefuseForm(false);
                                                setRefuseReason('');
                                            }}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* Status Messages */}
                {quote.status === 'quote_accepted' && (
                    <Card className="border-2 border-green-200 bg-green-50">
                        <CardContent className="pt-6 text-center">
                            <IconCircleCheck className="h-16 w-16 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-green-800 mb-2">Devis accepté !</h3>
                            <p className="text-green-700">
                                Merci pour votre confiance. Notre équipe va confirmer votre réservation sous peu.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {quote.status === 'quote_refused' && (
                    <Card className="border-2 border-red-200 bg-red-50">
                        <CardContent className="pt-6 text-center">
                            <IconCircleX className="h-16 w-16 text-red-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-red-800 mb-2">Devis refusé</h3>
                            <p className="text-red-700 mb-4">
                                Ce devis a été refusé. N'hésitez pas à demander un nouveau devis.
                            </p>
                            <Button asChild>
                                <Link href="/reservation">Demander un nouveau devis</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {quote.status === 'confirmed' && (
                    <Card className="border-2 border-emerald-200 bg-emerald-50">
                        <CardContent className="pt-6 text-center">
                            <IconCheck className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-emerald-800 mb-2">Réservation confirmée !</h3>
                            <p className="text-emerald-700">
                                Votre réservation est confirmée. Le chauffeur vous contactera avant le jour J.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Contact Section */}
                <Card className="mt-6 bg-[#0A0A0A] text-white">
                    <CardContent className="pt-6">
                        <h3 className="font-semibold mb-4">Besoin d'aide ?</h3>
                        <div className="space-y-3">
                            <a
                                href={`tel:${CONTACT.phone}`}
                                className="flex items-center gap-3 text-white/80 hover:text-white"
                            >
                                <IconPhone className="h-5 w-5 text-[#5CD85A]" />
                                {CONTACT.phone}
                            </a>
                            <a
                                href={`mailto:${CONTACT.email}`}
                                className="flex items-center gap-3 text-white/80 hover:text-white"
                            >
                                <IconMail className="h-5 w-5 text-[#5CD85A]" />
                                {CONTACT.email}
                            </a>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
