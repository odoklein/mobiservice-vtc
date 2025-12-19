import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function BookingConfirmedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="max-w-md w-full border-0 shadow-xl">
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-[#0A0A0A] mb-4">
                        Réservation confirmée !
                    </h1>

                    <p className="text-gray-600 mb-8">
                        Votre réservation a été confirmée avec succès. Vous recevrez un email de confirmation avec tous les détails.
                    </p>

                    <div className="space-y-3">
                        <Button asChild className="w-full bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]">
                            <Link href="/">
                                Retour à l'accueil
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/reservation">
                                Nouvelle réservation
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
