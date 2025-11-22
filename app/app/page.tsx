'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, User, Phone, Mail, ArrowRight } from 'lucide-react';

export default function CustomerAppPage() {
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const fetchBookings = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
        setSearched(true);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'completed' && b.status !== 'cancelled'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Mes Réservations</h1>
          <p className="text-lg text-gray-300">Suivez et gérez vos trajets</p>
        </div>
      </section>

      {/* Content */}
      <section className="flex-1 py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          {!searched ? (
            <Card>
              <CardHeader>
                <CardTitle>Accédez à vos réservations</CardTitle>
                <CardDescription>
                  Entrez votre email pour voir vos réservations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="jean.dupont@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
                    />
                  </div>
                  <Button
                    onClick={fetchBookings}
                    disabled={!email || loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Chargement...' : 'Voir mes réservations'}
                  </Button>
                </div>

                <div className="mt-8 pt-8 border-t">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Vous n'avez pas encore de réservation ?
                  </p>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/reservation">
                      Réserver maintenant
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Mes réservations</h2>
                  <p className="text-muted-foreground">{email}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearched(false);
                    setBookings([]);
                    setEmail('');
                  }}
                >
                  Changer de compte
                </Button>
              </div>

              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Aucune réservation trouvée</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Vous n'avez pas encore de réservation avec cette adresse email
                    </p>
                    <Button asChild>
                      <Link href="/reservation">
                        Réserver maintenant
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Tabs defaultValue="upcoming" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upcoming">
                      À venir ({upcomingBookings.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                      Passées ({pastBookings.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upcoming" className="space-y-4">
                    {upcomingBookings.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground">
                            Aucune réservation à venir
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      upcomingBookings.map((booking) => (
                        <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  Réservation #{booking.id}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(booking.pickupDate).toLocaleDateString('fr-FR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </CardDescription>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="text-sm">
                                    <div className="font-medium">Départ</div>
                                    <div className="text-muted-foreground">
                                      {booking.pickupAddress}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
                                  <div className="text-sm">
                                    <div className="font-medium">Arrivée</div>
                                    <div className="text-muted-foreground">
                                      {booking.dropoffAddress}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-5 w-5 text-primary" />
                                  <span className="text-sm">{booking.pickupTime}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-primary" />
                                  <span className="text-sm">
                                    {booking.passengers} passager(s)
                                  </span>
                                </div>
                                <div className="text-sm">
                                  <span className="font-semibold">
                                    {parseFloat(booking.totalPrice).toFixed(2)}€
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="past" className="space-y-4">
                    {pastBookings.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-muted-foreground">
                            Aucune réservation passée
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      pastBookings.map((booking) => (
                        <Card key={booking.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-lg">
                                  Réservation #{booking.id}
                                </CardTitle>
                                <CardDescription>
                                  {new Date(booking.pickupDate).toLocaleDateString('fr-FR')}
                                </CardDescription>
                              </div>
                              {getStatusBadge(booking.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Trajet</span>
                                <span className="font-medium">
                                  {booking.pickupAddress} → {booking.dropoffAddress}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Prix</span>
                                <span className="font-medium">
                                  {parseFloat(booking.totalPrice).toFixed(2)}€
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>
              )}

              <Card className="bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Besoin d'aide ?</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Notre équipe est à votre disposition
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/contact">Nous contacter</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

