'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    AdminPageHeader,
    AdminPageContainer,
    AdminCard,
    AdminEmptyState,
    AdminFilterButton
} from '@/components/admin/admin-components';
import { Search, Download, Plus, Loader2, Calendar } from 'lucide-react';
import { formatPrice } from '@/lib/pricing';
import type { Booking } from '@/lib/db/schema';

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        filterBookings();
    }, [searchQuery, statusFilter, bookings]);

    const fetchBookings = async () => {
        try {
            const response = await fetch('/api/admin/bookings');
            const data = await response.json();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.guestName?.toLowerCase().includes(query) ||
                    b.guestEmail?.toLowerCase().includes(query) ||
                    b.id.toString().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter((b) => b.status === statusFilter);
        }

        setFilteredBookings(filtered);
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { className: string; label: string }> = {
            pending: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'En attente' },
            verified: { className: 'bg-blue-100 text-blue-700 border-blue-200', label: 'À approuver' },
            confirmed: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Confirmé' },
            in_progress: { className: 'bg-purple-100 text-purple-700 border-purple-200', label: 'En cours' },
            completed: { className: 'bg-slate-100 text-slate-700 border-slate-200', label: 'Terminé' },
            cancelled: { className: 'bg-red-100 text-red-700 border-red-200', label: 'Annulé' },
        };

        const variant = variants[status] || variants.pending;
        return <Badge className={`${variant.className} border`}>{variant.label}</Badge>;
    };

    const statusFilters = [
        { key: 'all', label: 'Tout', activeClass: 'bg-slate-800 text-white' },
        { key: 'verified', label: 'À approuver', activeClass: 'bg-blue-600 text-white' },
        { key: 'pending', label: 'En attente', activeClass: 'bg-amber-500 text-white' },
        { key: 'confirmed', label: 'Confirmé', activeClass: 'bg-emerald-600 text-white' },
        { key: 'completed', label: 'Terminé', activeClass: 'bg-slate-600 text-white' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminPageHeader
                title="Réservations"
                description="Gérez toutes les réservations"
                actions={
                    <>
                        <Link href="/admin/bookings/new">
                            <Button variant="admin-primary" size="admin">
                                <Plus className="h-4 w-4" />
                                Nouvelle réservation
                            </Button>
                        </Link>
                        <Button variant="admin-outline" size="admin">
                            <Download className="h-4 w-4" />
                            Exporter CSV
                        </Button>
                    </>
                }
            />

            <AdminPageContainer>
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Rechercher par nom, email, ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 border-slate-200 focus:border-sky-500 focus:ring-sky-500"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {statusFilters.map((filter) => (
                                    <Button
                                        key={filter.key}
                                        variant={statusFilter === filter.key ? 'default' : 'outline'}
                                        onClick={() => setStatusFilter(filter.key)}
                                        size="sm"
                                        className={statusFilter === filter.key ? filter.activeClass : 'border-slate-200 text-slate-600 hover:bg-slate-50'}
                                    >
                                        {filter.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <AdminEmptyState
                                icon={Calendar}
                                title="Aucune réservation trouvée"
                                description="Ajustez vos filtres ou créez une nouvelle réservation"
                            />
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredBookings.map((booking) => (
                                    <Link
                                        key={booking.id}
                                        href={`/admin/bookings/${booking.id}`}
                                        className={`block p-4 transition-colors ${booking.status === 'verified'
                                            ? 'bg-blue-50/50 hover:bg-blue-50'
                                            : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <span className="font-bold text-slate-900">#{booking.id}</span>
                                                    {getStatusBadge(booking.status)}
                                                    {booking.status === 'verified' && (
                                                        <Badge className="bg-blue-200 text-blue-800 border border-blue-300">
                                                            ⚠️ Action requise
                                                        </Badge>
                                                    )}
                                                    {booking.paymentStatus === 'paid' && (
                                                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">Payé</Badge>
                                                    )}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900 mb-1">
                                                    {booking.guestName} - {booking.guestEmail}
                                                </div>
                                                <div className="text-sm text-slate-600 mb-1">
                                                    📍 {booking.pickupAddress} → {booking.dropoffAddress}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    📅 {new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à {booking.pickupTime} •
                                                    {booking.passengers} passager(s) • {booking.serviceType}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-lg text-slate-900">
                                                    {formatPrice(parseFloat(booking.totalPrice))}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{booking.paymentMethod}</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </AdminPageContainer>
        </div>
    );
}
