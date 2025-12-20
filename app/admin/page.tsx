import { db } from '@/lib/db';
import { bookings, workingHours } from '@/lib/db/schema';
import { eq, gte, and, sql, desc } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            activeCount: hours.filter(h => h.isActive).length,
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
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[#0A0A0A]">Dashboard</h1>
                <p className="text-gray-600 mt-1">Vue d'ensemble de votre activité</p>
            </div>

            {/* Onboarding Card - Show when no working hours configured */}
            {!hoursStatus.hasHours && (
                <Card className="border-2 border-[#5CD85A] shadow-lg bg-gradient-to-br from-[#5CD85A]/5 to-[#5CD85A]/10">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-full bg-[#5CD85A]/20">
                                <Sparkles className="h-6 w-6 text-[#5CD85A]" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold text-[#0A0A0A]">
                                    🎉 Bienvenue dans votre espace admin !
                                </CardTitle>
                                <p className="text-gray-600 text-sm mt-1">
                                    Configurez vos horaires de travail pour commencer à recevoir des réservations
                                </p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-white rounded-xl p-5 border border-gray-100">
                            <h3 className="font-semibold text-[#0A0A0A] mb-4 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-[#5CD85A]" />
                                Configuration requise
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#0A0A0A]">Définissez vos horaires d'ouverture</p>
                                        <p className="text-sm text-gray-500">
                                            Indiquez les jours et heures où vous êtes disponible pour les courses
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-400">Recevez vos premières réservations</p>
                                        <p className="text-sm text-gray-400">
                                            Les clients pourront réserver uniquement pendant vos créneaux actifs
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-400">Gérez votre activité</p>
                                        <p className="text-sm text-gray-400">
                                            Confirmez les réservations et suivez vos revenus
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Link
                            href="/admin/settings/working-hours"
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-[#5CD85A]/20"
                        >
                            <Clock className="h-5 w-5" />
                            Configurer mes horaires
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                        <p className="text-center text-sm text-gray-500">
                            ⏱️ Configuration en moins de 2 minutes
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Success banner when hours are configured */}
            {hoursStatus.hasHours && hoursStatus.activeCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-800">
                        <strong>{hoursStatus.activeCount} jour{hoursStatus.activeCount > 1 ? 's' : ''} actif{hoursStatus.activeCount > 1 ? 's' : ''}</strong> configuré{hoursStatus.activeCount > 1 ? 's' : ''} —
                        <Link href="/admin/settings/working-hours" className="underline hover:no-underline ml-1">
                            Modifier les horaires
                        </Link>
                    </p>
                </div>
            )}

            {/* Pending Approvals Alert */}
            {stats.verified > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 shadow-lg">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-blue-100">
                            <AlertCircle className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-blue-900 mb-1">
                                {stats.verified} réservation{stats.verified > 1 ? 's' : ''} en attente d'approbation
                            </h3>
                            <p className="text-sm text-blue-700 mb-4">
                                Ces réservations ont été vérifiées par OTP et nécessitent votre confirmation avant d'être validées.
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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Aujourd'hui</CardTitle>
                        <Calendar className="h-5 w-5 text-[#5CD85A]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{stats.today}</div>
                        <p className="text-xs text-gray-500 mt-1">réservations</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">En attente</CardTitle>
                        <Clock className="h-5 w-5 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{stats.pending}</div>
                        <p className="text-xs text-gray-500 mt-1">création initiale</p>
                    </CardContent>
                </Card>

                <Card className={`border-0 shadow-lg ${stats.verified > 0 ? 'border-2 border-blue-300 bg-blue-50/50' : ''}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">À approuver</CardTitle>
                        <CheckCircle className={`h-5 w-5 ${stats.verified > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${stats.verified > 0 ? 'text-blue-600' : 'text-[#0A0A0A]'}`}>
                            {stats.verified}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">vérifiées (OTP OK)</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Espèces</CardTitle>
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{stats.cashPending}</div>
                        <p className="text-xs text-gray-500 mt-1">paiements en attente</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Total réservations</CardTitle>
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{stats.totalBookings}</div>
                        <p className="text-xs text-gray-500 mt-1">depuis le début</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">CA ce mois</CardTitle>
                        <Euro className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{formatPrice(stats.monthlyRevenue)}</div>
                        <p className="text-xs text-gray-500 mt-1">encaissé</p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-[#5CD85A]/5 to-[#5CD85A]/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">CA total</CardTitle>
                        <Euro className="h-5 w-5 text-[#5CD85A]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-[#0A0A0A]">{formatPrice(stats.revenue)}</div>
                        <p className="text-xs text-gray-500 mt-1">total encaissé</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-[#0A0A0A]">Réservations récentes</CardTitle>
                        <Link
                            href="/admin/bookings"
                            className="text-sm text-[#5CD85A] hover:text-[#4BC449] font-medium"
                        >
                            Voir tout →
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-medium">Aucune réservation pour le moment</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {!hoursStatus.hasHours
                                        ? "Configurez d'abord vos horaires pour recevoir des réservations"
                                        : "Les nouvelles réservations apparaîtront ici"
                                    }
                                </p>
                            </div>
                        ) : (
                            recentBookings.map((booking) => (
                                <Link
                                    key={booking.id}
                                    href={`/admin/bookings/${booking.id}`}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#5CD85A]/30 hover:bg-gray-50 transition-all group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <span className="font-semibold text-[#0A0A0A]">
                                                #{booking.id} - {booking.guestName || 'Client'}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : booking.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : booking.status === 'cancelled'
                                                            ? 'bg-red-100 text-red-700'
                                                            : booking.status === 'completed'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {statusLabels[booking.status] || booking.status}
                                            </span>
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${booking.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-700'
                                                    : booking.paymentStatus === 'pending'
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {paymentStatusLabels[booking.paymentStatus] || booking.paymentStatus}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                                            <span className="truncate">{booking.pickupAddress}</span>
                                            <span className="text-gray-400">→</span>
                                            <span className="truncate">{booking.dropoffAddress}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            📅 {new Date(booking.pickupDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {booking.pickupTime}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <div className="font-bold text-[#0A0A0A]">{formatPrice(parseFloat(booking.totalPrice))}</div>
                                        <div className="text-xs text-gray-500 mt-1">{paymentMethodLabels[booking.paymentMethod || 'stripe'] || booking.paymentMethod}</div>
                                        <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-[#5CD85A] transition-colors mt-1 ml-auto" />
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

