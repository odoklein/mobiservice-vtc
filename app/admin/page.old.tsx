'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Calendar,
  MapPin,
  Clock,
  User,
  Phone,
  Mail,
  Navigation,
  CheckCircle,
  XCircle,
  Play,
  Flag,
  DollarSign,
  Briefcase,
} from 'lucide-react';

export default function DriverDashboardPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // In a real app, fetch bookings from API with authentication
    // For now, mock data
    setLoading(false);
  }, []);

  const todayBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.pickupDate);
    return (
      bookingDate.toDateString() === selectedDate.toDateString() &&
      b.status !== 'cancelled'
    );
  });

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const inProgressBookings = bookings.filter((b) => b.status === 'in_progress');

  const stats = [
    {
      label: "Aujourd'hui",
      value: todayBookings.length,
      icon: Calendar,
      color: 'text-blue-500',
    },
    {
      label: 'En attente',
      value: pendingBookings.length,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      label: 'Confirmées',
      value: confirmedBookings.length,
      icon: CheckCircle,
      color: 'text-green-500',
    },
    {
      label: 'En cours',
      value: inProgressBookings.length,
      icon: Play,
      color: 'text-purple-500',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmé', className: 'bg-green-100 text-green-800' },
      in_progress: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Annulé', className: 'bg-red-100 text-red-800' },
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    // TODO: Implement API call to update booking status
    console.log(`Update booking ${bookingId} to ${newStatus}`);
  };

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Réservation #{booking.id}</CardTitle>
            <CardDescription>
              {new Date(booking.pickupDate).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}{' '}
              à {booking.pickupTime}
            </CardDescription>
          </div>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Départ</div>
                <div className="text-muted-foreground">{booking.pickupAddress}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium">Arrivée</div>
                <div className="text-muted-foreground">{booking.dropoffAddress}</div>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <div className="font-medium">{booking.guestName}</div>
                <div className="text-muted-foreground">
                  {booking.passengers} passager(s)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              <a
                href={`tel:${booking.guestPhone}`}
                className="text-sm text-primary hover:underline"
              >
                {booking.guestPhone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">
                {parseFloat(booking.totalPrice).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {booking.status === 'pending' && (
            <>
              <Button
                size="sm"
                onClick={() => updateBookingStatus(booking.id, 'confirmed')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => updateBookingStatus(booking.id, 'cancelled')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Annuler
              </Button>
            </>
          )}
          {booking.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, 'in_progress')}
            >
              <Play className="mr-2 h-4 w-4" />
              Démarrer
            </Button>
          )}
          {booking.status === 'in_progress' && (
            <Button
              size="sm"
              onClick={() => updateBookingStatus(booking.id, 'completed')}
            >
              <Flag className="mr-2 h-4 w-4" />
              Terminer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            asChild
          >
            <a
              href={`https://www.mapbox.com/directions/?destination=${encodeURIComponent(
                booking.dropoffAddress
              )}&origin=${encodeURIComponent(booking.pickupAddress)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Itinéraire
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Dashboard Chauffeur
              </h1>
              <p className="text-lg text-gray-300">Bienvenue, Patrice</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-300">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          {loading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="today" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today">
                  Aujourd'hui ({todayBookings.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  En attente ({pendingBookings.length})
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  Confirmées ({confirmedBookings.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Toutes ({bookings.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="today" className="space-y-4">
                {todayBookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">
                        Aucune réservation aujourd'hui
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Profitez de votre journée !
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  todayBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="pending" className="space-y-4">
                {pendingBookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        Aucune réservation en attente
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  pendingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="confirmed" className="space-y-4">
                {confirmedBookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        Aucune réservation confirmée
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  confirmedBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="all" className="space-y-4">
                {bookings.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">
                        Aucune réservation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Les réservations apparaîtront ici
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  );
}
