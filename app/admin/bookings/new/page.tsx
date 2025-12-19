'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';

type ServiceType = 'transfer' | 'airport' | 'hourly' | 'business' | 'mda';
type TripType = 'one-way' | 'round-trip';
type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'refunded';
type PaymentMethod = 'stripe' | 'cash' | 'other';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function AdminBookingNewPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [pickupDate, setPickupDate] = useState(''); // yyyy-mm-dd
  const [pickupTime, setPickupTime] = useState(''); // HH:mm

  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>('transfer');
  const [tripType, setTripType] = useState<TripType>('one-way');

  const [status, setStatus] = useState<BookingStatus>('pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');

  const [totalTTC, setTotalTTC] = useState<string>(''); // totalPrice
  const [priceHT, setPriceHT] = useState<string>(''); // basePrice
  const [notes, setNotes] = useState<string>('');

  const inferredHT = useMemo(() => {
    const ttc = Number(totalTTC);
    if (!Number.isFinite(ttc) || ttc <= 0) return '';
    return round2(ttc / 1.1).toString();
  }, [totalTTC]);

  const onAutoFillHT = () => {
    if (!priceHT && inferredHT) setPriceHT(inferredHT);
  };

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      if (!pickupDate || !pickupTime) {
        throw new Error('Date et heure obligatoires');
      }
      if (!pickupAddress || !dropoffAddress) {
        throw new Error('Adresses obligatoires');
      }
      if (!totalTTC) {
        throw new Error('Total TTC obligatoire');
      }

      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
      if (Number.isNaN(pickupDateTime.getTime())) {
        throw new Error('Date/heure invalide');
      }

      const body = {
        guestName: guestName || undefined,
        guestEmail: guestEmail || undefined,
        guestPhone: guestPhone || undefined,

        pickupAddress,
        dropoffAddress,
        pickupDate: pickupDateTime.toISOString(),
        pickupTime,
        passengers,
        luggage,
        serviceType,
        tripType,

        status,
        paymentStatus,
        paymentMethod,

        // Pricing (required by DB)
        totalPrice: totalTTC,
        basePrice: priceHT || inferredHT || totalTTC,

        notes: notes || undefined,
      };

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || 'Erreur lors de la création');
      }

      router.push(`/admin/bookings/${data.booking.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/bookings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#0A0A0A]">Nouvelle réservation</h1>
            <p className="text-gray-600 mt-1">Création manuelle (admin)</p>
          </div>
        </div>

        <Button
          onClick={submit}
          disabled={saving}
          className="gap-2 bg-[#00FF88] hover:bg-[#00FF88]/90 text-black"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle>Trajet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Adresse départ</Label>
                <Input value={pickupAddress} onChange={(e) => setPickupAddress(e.target.value)} placeholder="..." />
              </div>
              <div className="space-y-2">
                <Label>Adresse arrivée</Label>
                <Input value={dropoffAddress} onChange={(e) => setDropoffAddress(e.target.value)} placeholder="..." />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Passagers</Label>
                <Input
                  type="number"
                  min={1}
                  max={4}
                  value={passengers}
                  onChange={(e) => setPassengers(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Bagages</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  value={luggage}
                  onChange={(e) => setLuggage(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Service</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="airport">Aéroport</SelectItem>
                    <SelectItem value="hourly">Horaire</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="mda">MDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type trajet</Label>
                <Select value={tripType} onValueChange={(v) => setTripType(v as TripType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-way">Aller simple</SelectItem>
                    <SelectItem value="round-trip">Aller-retour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optionnel..." />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Optionnel" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="Optionnel" />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="Optionnel" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-[#0A0A0A] text-white">
            <CardHeader>
              <CardTitle>Statuts & Tarifs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Statut réservation</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
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

              <div className="space-y-2">
                <Label className="text-white/80">Paiement</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">stripe</SelectItem>
                      <SelectItem value="cash">cash</SelectItem>
                      <SelectItem value="other">other</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as PaymentStatus)}>
                    <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-white/80">Total TTC (€)</Label>
                  <button
                    type="button"
                    onClick={onAutoFillHT}
                    className="text-xs text-[#00FF88] hover:underline"
                  >
                    Auto-remplir HT
                  </button>
                </div>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  value={totalTTC}
                  onChange={(e) => setTotalTTC(e.target.value)}
                  placeholder="ex: 120"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Prix HT (€)</Label>
                <Input
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  value={priceHT}
                  onChange={(e) => setPriceHT(e.target.value)}
                  placeholder={inferredHT ? `Suggéré: ${inferredHT}` : 'ex: 109.09'}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


