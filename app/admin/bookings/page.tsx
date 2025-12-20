'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Plus } from 'lucide-react';
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
            pending: { className: 'bg-amber-100 text-amber-700', label: 'En attente' },
            verified: { className: 'bg-blue-100 text-blue-700', label: 'À approuver' },
            confirmed: { className: 'bg-green-100 text-green-700', label: 'Confirmé' },
            in_progress: { className: 'bg-purple-100 text-purple-700', label: 'En cours' },
            completed: { className: 'bg-gray-100 text-gray-700', label: 'Terminé' },
            cancelled: { className: 'bg-red-100 text-red-700', label: 'Annulé' },
        };

        const variant = variants[status] || variants.pending;
        return <Badge className={variant.className}>{variant.label}</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#0A0A0A]">Réservations</h1>
                    <p className="text-gray-600 mt-1">Gérez toutes les réservations</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/admin/bookings/new">
                        <Button className="gap-2 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black">
                            <Plus className="h-4 w-4" />
                            Nouvelle réservation
                        </Button>
                    </Link>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exporter CSV
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Rechercher par nom, email, ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('all')}
                                size="sm"
                                className={statusFilter === 'all' ? 'bg-[#0A0A0A] text-white' : ''}
                            >
                                Tout
                            </Button>
                            <Button
                                variant={statusFilter === 'verified' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('verified')}
                                size="sm"
                                className={statusFilter === 'verified' ? 'bg-blue-600 text-white border-blue-600' : ''}
                            >
                                À approuver
                            </Button>
                            <Button
                                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('pending')}
                                size="sm"
                                className={statusFilter === 'pending' ? 'bg-amber-500 text-white' : ''}
                            >
                                En attente
                            </Button>
                            <Button
                                variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('confirmed')}
                                size="sm"
                                className={statusFilter === 'confirmed' ? 'bg-green-500 text-white' : ''}
                            >
                                Confirmé
                            </Button>
                            <Button
                                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                                onClick={() => setStatusFilter('completed')}
                                size="sm"
                                className={statusFilter === 'completed' ? 'bg-gray-600 text-white' : ''}
                            >
                                Terminé
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5CD85A]"></div>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Aucune réservation trouvée
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredBookings.map((booking) => (
                                <Link
                                    key={booking.id}
                                    href={`/admin/bookings/${booking.id}`}
                                    className={`block p-4 rounded-xl border transition-all ${
                                        booking.status === 'verified'
                                            ? 'border-blue-300 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50'
                                            : 'border-gray-100 hover:border-[#5CD85A]/30 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <span className="font-bold text-[#0A0A0A]">#{booking.id}</span>
                                                {getStatusBadge(booking.status)}
                                                {booking.status === 'verified' && (
                                                    <Badge className="bg-blue-200 text-blue-800 border border-blue-300">
                                                        ⚠️ Action requise
                                                    </Badge>
                                                )}
                                                {booking.paymentStatus === 'paid' && (
                                                    <Badge className="bg-green-100 text-green-700">Payé</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm font-semibold text-[#0A0A0A] mb-1">
                                                {booking.guestName} - {booking.guestEmail}
                                            </div>
                                            <div className="text-sm text-gray-600 mb-1">
                                                📍 {booking.pickupAddress} → {booking.dropoffAddress}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                📅 {new Date(booking.pickupDate).toLocaleDateString('fr-FR')} à {booking.pickupTime} •
                                                {booking.passengers} passager(s) • {booking.serviceType}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg text-[#0A0A0A]">
                                                {formatPrice(parseFloat(booking.totalPrice))}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">{booking.paymentMethod}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
