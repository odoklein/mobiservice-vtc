'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Mail, Calendar, ArrowRight } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // In a real app, fetch booking details from API
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl">
        <CardContent className="pt-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-green-900 mb-3">
            Réservation confirmée !
          </h2>
          <p className="text-lg text-green-700 font-medium">
            Votre paiement a été effectué avec succès
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prochaines étapes</CardTitle>
          <CardDescription>
            Voici ce qui va se passer ensuite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Confirmation par email</h3>
              <p className="text-sm text-muted-foreground">
                Vous allez recevoir un email de confirmation avec tous les détails de votre réservation
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Notification au chauffeur</h3>
              <p className="text-sm text-muted-foreground">
                Patrice a été notifié de votre réservation et la confirmera sous peu
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Le jour J</h3>
              <p className="text-sm text-muted-foreground">
                Patrice vous attendra à l'adresse et l'heure convenues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Vous n'avez pas reçu l'email ?</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Vérifiez votre dossier spam ou contactez-nous directement
          </p>
          <Button variant="outline" asChild>
            <Link href="/contact">Nous contacter</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild className="flex-1">
          <Link href="/">
            Retour à l'accueil
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/reservation">
            Nouvelle réservation
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function ReservationSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMyLjIwOSAwIDQtMS43OTEgNC00cy0xLjc5MS00LTQtNC00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Merci pour votre réservation !</h1>
          <p className="text-xl text-green-50">Nous avons hâte de vous accueillir</p>
        </div>
      </section>

      <section className="flex-1 py-12 bg-gray-50">
        <div className="container mx-auto px-4 max-w-2xl">
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          }>
            <SuccessContent />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

