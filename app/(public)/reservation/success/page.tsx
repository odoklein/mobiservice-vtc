'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  IconCheck,
  IconMail,
  IconCalendar,
  IconArrowRight,
  IconCreditCard,
  IconCash,
  IconPhone,
  IconCar,
} from '@tabler/icons-react';
import { CONTACT } from '@/lib/constants';

function SuccessContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const paymentMethod = searchParams.get('payment_method') as 'card' | 'cash' | null;
  const status = searchParams.get('status') as 'verified' | 'confirmed' | null;
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5CD85A]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-2 border-[#5CD85A]/30 bg-gradient-to-br from-[#5CD85A]/5 to-emerald-50 shadow-xl overflow-hidden">
        <CardContent className="pt-8 text-center relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#5CD85A]"></div>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[#5CD85A] rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
              <IconCheck className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-[#0A0A0A] mb-3">
            {status === 'verified' ? 'Réservation reçue !' : 'Réservation confirmée !'}
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            {status === 'verified' ? (
              <>Votre réservation a été reçue et sera confirmée par notre équipe sous peu.</>
            ) : paymentMethod === 'card' ? (
              <>Votre paiement a été effectué avec succès</>
            ) : (
              <>Votre réservation est confirmée. Paiement en espèces au chauffeur.</>
            )}
          </p>
          {bookingId && (
            <div className="mt-4 inline-block bg-[#0A0A0A] text-white px-4 py-2 rounded-lg">
              <span className="text-white/60 text-sm">Réservation n°</span>
              <span className="ml-2 font-mono font-bold text-[#5CD85A]">#{bookingId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Indicator */}
      {status === 'verified' ? (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <IconCalendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-blue-900">En attente de confirmation</div>
                <div className="text-sm text-blue-700">Notre équipe examine votre réservation • Vous recevrez un email de confirmation sous peu</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={`border-2 ${paymentMethod === 'card' ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              {paymentMethod === 'card' ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <IconCreditCard className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">Paiement par carte effectué</div>
                    <div className="text-sm text-blue-700">Transaction sécurisée • Confirmation envoyée par email</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <IconCash className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-amber-900">Paiement en espèces</div>
                    <div className="text-sm text-amber-700">Préparez le montant exact • Remis au chauffeur</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
          <CardDescription>
            Voici ce qui va se passer ensuite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5CD85A] text-white font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <IconMail className="h-4 w-4 text-[#5CD85A]" />
                {status === 'verified' ? 'Email de réception' : 'Confirmation par email'}
              </h3>
              <p className="text-sm text-gray-600">
                {status === 'verified' 
                  ? 'Vous avez reçu un email confirmant la réception de votre réservation. Un email de confirmation finale vous sera envoyé une fois approuvée.'
                  : 'Vous allez recevoir un email de confirmation avec tous les détails de votre réservation'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5CD85A] text-white font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <IconPhone className="h-4 w-4 text-[#5CD85A]" />
                {status === 'verified' ? 'Examen de la réservation' : 'Notification au chauffeur'}
              </h3>
              <p className="text-sm text-gray-600">
                {status === 'verified'
                  ? 'Notre équipe examine votre réservation et vous confirmera sous peu. Le chauffeur sera notifié une fois la réservation approuvée.'
                  : 'Votre chauffeur a été notifié de votre réservation et la confirmera sous peu'
                }
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#5CD85A] text-white font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <IconCar className="h-4 w-4 text-[#5CD85A]" />
                Le jour J
              </h3>
              <p className="text-sm text-gray-600">
                Votre chauffeur vous attendra à l'adresse et l'heure convenues
                {paymentMethod === 'cash' && (
                  <span className="block mt-1 text-amber-600 font-medium">
                    💵 N'oubliez pas vos espèces pour le paiement
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-[#0A0A0A] text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <IconMail className="h-5 w-5 text-[#5CD85A]" />
            <h3 className="font-semibold">Vous n'avez pas reçu l'email ?</h3>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Vérifiez votre dossier spam ou contactez-nous directement
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 hover:text-white">
              <Link href="/contact">Nous contacter</Link>
            </Button>
            <a
              href={`tel:${CONTACT.phone}`}
              className="inline-flex items-center justify-center gap-2 text-[#5CD85A] text-sm font-medium hover:underline"
            >
              <IconPhone className="h-4 w-4" />
              {CONTACT.phone}
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]">
          <Link href="/">
            Retour à l'accueil
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/reservation">
            Nouvelle réservation
            <IconArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ReservationSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-[#0A0A0A] text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-[400px] h-[400px] bg-[#5CD85A]/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-[#5CD85A]/10 rounded-full blur-[100px]"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Merci pour votre réservation !</h1>
          <p className="text-xl text-white/70">Nous avons hâte de vous accueillir</p>
        </div>
      </section>

      <section className="flex-1 py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5CD85A]"></div>
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
