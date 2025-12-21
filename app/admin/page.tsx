import { db } from '@/lib/db';
import { bookings, workingHours, type WorkingHours } from '@/lib/db/schema';
import { eq, gte, and, sql, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AdminPageHeader,
    AdminPageContainer,
    AdminCard,
    AdminEmptyState,
    AdminAlertBanner
} from '@/components/admin/admin-components';
import { Calendar, Clock, Euro, AlertCircle, Settings, ArrowRight, CheckCircle2, Sparkles, TrendingUp, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/pricing';

// Status translations
const statusLabels: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Confirmé',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
};

const paymentStatusLabels: Record<string, string> = {
    pending: 'Non payé',
    paid: 'Payé',
    refunded: 'Remboursé',
};

const paymentMethodLabels: Record<string, string> = {
    stripe: 'Carte',
    cash: 'Espèces',
    other: 'Autre',
};

async function getStats() {
    try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get start of current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        // Count today's bookings (pickupDate is today)
        const todayBookings = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(
                and(
                    gte(bookings.pickupDate, today),
                    sql`${bookings.pickupDate} < ${tomorrow}`
                )
            );

        // Count pending bookings (status = 'pending')
        const pendingBookings = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(eq(bookings.status, 'pending'));

        // Count verified bookings awaiting approval (status = 'verified')
        const verifiedBookings = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(eq(bookings.status, 'verified'));

        // Count cash payments pending (paymentMethod = 'cash' AND paymentStatus = 'pending')
        const cashPendingBookings = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings)
            .where(
                and(
                    eq(bookings.paymentMethod, 'cash'),
                    eq(bookings.paymentStatus, 'pending')
                )
            );

        // Calculate total revenue (paymentStatus = 'paid')
        const revenueResult = await db
            .select({ total: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
            .from(bookings)
            .where(eq(bookings.paymentStatus, 'paid'));

        // Calculate monthly revenue
        const monthlyRevenueResult = await db
            .select({ total: sql<string>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
            .from(bookings)
            .where(
                and(
                    eq(bookings.paymentStatus, 'paid'),
                    gte(bookings.createdAt, monthStart)
                )
            );

        // Total bookings count
        const totalBookings = await db
            .select({ count: sql<number>`count(*)` })
            .from(bookings);

        return {
            today: Number(todayBookings[0]?.count ?? 0),
            pending: Number(pendingBookings[0]?.count ?? 0),
            verified: Number(verifiedBookings[0]?.count ?? 0),
            cashPending: Number(cashPendingBookings[0]?.count ?? 0),
            revenue: parseFloat(revenueResult[0]?.total ?? '0'),
            monthlyRevenue: parseFloat(monthlyRevenueResult[0]?.total ?? '0'),
            totalBookings: Number(totalBookings[0]?.count ?? 0),
        };
    } catch (error) {
        console.error('Error fetching stats:', error);
        return {
            today: 0,
            pending: 0,
            verified: 0,
            cashPending: 0,
            revenue: 0,
            monthlyRevenue: 0,
            totalBookings: 0,
        };
    }
}

async function getRecentBookings() {
    try {
        const recentBookings = await db
            .select({
                id: bookings.id,
                guestName: bookings.guestName,
                guestEmail: bookings.guestEmail,
                pickupAddress: bookings.pickupAddress,
                dropoffAddress: bookings.dropoffAddress,
                pickupDate: bookings.pickupDate,
                pickupTime: bookings.pickupTime,
                status: bookings.status,
                paymentStatus: bookings.paymentStatus,
                paymentMethod: bookings.paymentMethod,
                totalPrice: bookings.totalPrice,
                serviceType: bookings.serviceType,
                createdAt: bookings.createdAt,
            })
            .from(bookings)
            .orderBy(desc(bookings.createdAt))
            .limit(5);

        return recentBookings;
    } catch (error) {
        console.error('Error fetching recent bookings:', error);
        return [];
    }
}

async function getWorkingHoursStatus() {
    try {
        const hours = await db
            .select()
            .from(workingHours);
        return {
            hasHours: hours.length > 0,
            activeCount: hours.filter((h: WorkingHours) => h.isActive).length,
        };
    } catch (error) {
        console.error('Error checking working hours:', error);
        return { hasHours: false, activeCount: 0 };
    }
}

export default async function AdminDashboard() {
    const stats = await getStats();
    const recentBookings = await getRecentBookings();
    const hoursStatus = await getWorkingHoursStatus();

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminPageHeader
                title="Dashboard"
                description="Vue d'ensemble de votre activité"
            />

            <AdminPageContainer>
                {/* Onboarding Card - Show when no working hours configured */}
                {!hoursStatus.hasHours && (
                    <Card className="border-2 border-sky-500 shadow-lg bg-gradient-to-br from-sky-50 to-sky-100">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-full bg-sky-100">
                                    <Sparkles className="h-6 w-6 text-sky-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-900">
                                        🎉 Bienvenue dans votre espace admin !
                                    </CardTitle>
                                    <p className="text-slate-600 text-sm mt-1">
                                        Configurez vos horaires de travail pour commencer à recevoir des réservations
                                    </p>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-white rounded-xl p-5 border border-slate-200">
                                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-sky-600" />
                                    Configuration requise
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                            1
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">Définissez vos horaires d'ouverture</p>
                                            <p className="text-sm text-slate-500">
                                                Indiquez les jours et heures où vous êtes disponible pour les courses
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                            2
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-400">Recevez vos premières réservations</p>
                                            <p className="text-sm text-slate-400">
                                                Les clients pourront réserver uniquement pendant vos créneaux actifs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                            3
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-400">Gérez votre activité</p>
                                            <p className="text-sm text-slate-400">
                                                Confirmez les réservations et suivez vos revenus
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link
                                href="/admin/settings/working-hours"
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg"
                            >
                                <Clock className="h-5 w-5" />
                                Configurer mes horaires
                                <ArrowRight className="h-5 w-5" />
                            </Link>
                            <p className="text-center text-sm text-slate-500">
                                ⏱️ Configuration en moins de 2 minutes
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Success banner when hours are configured */}
                {hoursStatus.hasHours && hoursStatus.activeCount > 0 && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                        <p className="text-sm text-emerald-800">
                            <strong>{hoursStatus.activeCount} jour{hoursStatus.activeCount > 1 ? 's' : ''} actif{hoursStatus.activeCount > 1 ? 's' : ''}</strong> configuré{hoursStatus.activeCount > 1 ? 's' : ''} —
                            <Link href="/admin/settings/working-hours" className="underline hover:no-underline ml-1">
                                Modifier les horaires
                            </Link>
                        </p>
                    </div>
                )}

                {/* Pending Approvals Alert */}
                {stats.verified > 0 && (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-blue-100">
                                <AlertCircle className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-blue-900 mb-1">
                                    {stats.verified} réservation{stats.verified > 1 ? 's' : ''} en attente d'approbation
                                </h3>
                                <p className="text-sm text-blue-700 mb-4">
                                    Ces clients ont confirmé leur email et attendent votre réponse.
                                </p>
                                <Link
                                    href="/admin/bookings?status=verified"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Voir les réservations à approuver
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid - Clickable Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin/bookings" className="group">
                        <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Aujourd'hui</CardTitle>
                                <div className="p-2 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors">
                                    <Calendar className="h-4 w-4 text-sky-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">{stats.today}</div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    réservations
                                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/bookings?status=verified" className="group">
                        <Card className={`border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${stats.verified > 0 ? 'border-2 border-blue-300 bg-blue-50 hover:bg-blue-100' : 'bg-white'}`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">À approuver</CardTitle>
                                <div className={`p-2 rounded-lg transition-colors ${stats.verified > 0 ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                                    <CheckCircle className={`h-4 w-4 ${stats.verified > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className={`text-3xl font-bold ${stats.verified > 0 ? 'text-blue-600' : 'text-slate-900'}`}>
                                    {stats.verified}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    clients confirmés
                                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/bookings?payment=cash" className="group">
                        <Card className="border-0 shadow-md bg-white hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-600">Paiement espèces</CardTitle>
                                <div className="p-2 rounded-lg bg-orange-50 group-hover:bg-orange-100 transition-colors">
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-slate-900">{stats.cashPending}</div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                    à encaisser
                                    <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </p>
                            </CardContent>
                        </Card>
                    </Link>

                    <Card className="border-0 shadow-md bg-gradient-to-br from-slate-800 to-slate-900">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-300">Chiffre d'affaires</CardTitle>
                            <div className="p-2 rounded-lg bg-white/10">
                                <Euro className="h-4 w-4 text-emerald-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-white">{formatPrice(stats.revenue)}</div>
                            <p className="text-xs text-slate-400 mt-1">
                                {formatPrice(stats.monthlyRevenue)} ce mois
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-3 md:grid-cols-4">
                    <Link
                        href="/admin/bookings/new"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-sky-300 group"
                    >
                        <div className="p-2 rounded-lg bg-sky-50 group-hover:bg-sky-100 transition-colors">
                            <Calendar className="h-5 w-5 text-sky-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Nouvelle réservation</p>
                            <p className="text-xs text-slate-500">Créer manuellement</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/settings/invoices"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-emerald-300 group"
                    >
                        <div className="p-2 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Factures & Devis</p>
                            <p className="text-xs text-slate-500">Gérer les documents</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/settings/pricing"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-amber-300 group"
                    >
                        <div className="p-2 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors">
                            <Euro className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Mes tarifs</p>
                            <p className="text-xs text-slate-500">Modifier les prix</p>
                        </div>
                    </Link>
                    <Link
                        href="/admin/help"
                        className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-slate-200 hover:border-purple-300 group"
                    >
                        <div className="p-2 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                            <Settings className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm">Besoin d'aide ?</p>
                            <p className="text-xs text-slate-500">Guides et FAQ</p>
                        </div>
                    </Link>
                </div>

                {/* Recent Bookings */}
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-bold text-slate-900">Réservations récentes</CardTitle>
                            <Link
                                href="/admin/bookings"
                                className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                            >
                                Voir tout
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {recentBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-500 font-medium">Aucune réservation pour le moment</p>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {!hoursStatus.hasHours
                                            ? "Configurez d'abord vos horaires pour recevoir des réservations"
                                            : "Les nouvelles réservations apparaîtront ici"
                                        }
                                    </p>
                                </div>
                            ) : (
                                recentBookings.map((booking: typeof recentBookings[number]) => (
                                    <Link
                                        key={booking.id}
                                        href={`/admin/bookings/${booking.id}`}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className="font-semibold text-slate-900">
                                                    #{booking.id} - {booking.guestName || 'Client'}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : booking.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : booking.status === 'cancelled'
                                                                ? 'bg-red-100 text-red-700'
                                                                : booking.status === 'completed'
                                                                    ? 'bg-blue-100 text-blue-700'
                                                                    : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {statusLabels[booking.status] || booking.status}
                                                </span>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : booking.paymentStatus === 'pending'
                                                            ? 'bg-orange-100 text-orange-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    {paymentStatusLabels[booking.paymentStatus] || booking.paymentStatus}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <MapPin className="h-4 w-4 flex-shrink-0 text-slate-400" />
                                                <span className="truncate">{booking.pickupAddress}</span>
                                                <span className="text-slate-400">→</span>
                                                <span className="truncate">{booking.dropoffAddress}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                📅 {new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {booking.pickupTime}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-4">
                                            <div className="font-bold text-slate-900">{formatPrice(parseFloat(booking.totalPrice))}</div>
                                            <div className="text-xs text-slate-500 mt-1">{paymentMethodLabels[booking.paymentMethod || 'stripe'] || booking.paymentMethod}</div>
                                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors mt-1 ml-auto" />
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </AdminPageContainer>
        </div>
    );
}
