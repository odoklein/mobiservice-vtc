'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONTACT, BRAND } from '@/lib/constants';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero */}
      <section className="bg-[#0A0A0A] py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-sm font-medium text-[#5CD85A]">Contact</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Parlons de votre
            <span className="text-[#5CD85A]"> projet</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Une question, un devis personnalisé ? Nous sommes à votre écoute
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href={`tel:${CONTACT.phone}`}
              className="group p-6 bg-[#5CD85A]/5 rounded-2xl border border-[#5CD85A]/20 hover:border-[#5CD85A]/40 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-[#5CD85A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-[#0A0A0A] mb-1">Téléphone</h3>
              <p className="text-[#5CD85A] font-medium">{CONTACT.phone}</p>
            </a>

            <a
              href={`mailto:${CONTACT.email}`}
              className="group p-6 bg-blue-50 rounded-2xl border border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-[#0A0A0A] mb-1">Email</h3>
              <p className="text-blue-600 font-medium">{CONTACT.email}</p>
            </a>

            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-emerald-50 rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-all hover:shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg text-[#0A0A0A] mb-1">WhatsApp</h3>
              <p className="text-emerald-600 font-medium">Message direct</p>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-[#5CD85A]/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-8 w-8 text-[#5CD85A]" />
                      </div>
                      <h3 className="text-2xl font-bold text-[#0A0A0A] mb-2">Message envoyé !</h3>
                      <p className="text-gray-600 mb-6">
                        Nous vous répondrons dans les plus brefs délais
                      </p>
                      <Button
                        onClick={() => {
                          setIsSubmitted(false);
                          setFormData({ name: '', email: '', phone: '', message: '' });
                        }}
                        variant="outline"
                      >
                        Envoyer un autre message
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-[#0A0A0A] mb-6">Envoyez-nous un message</h2>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-[#0A0A0A] mb-2 block">Nom complet</Label>
                            <Input
                              placeholder="Jean Dupont"
                              className="h-12"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-[#0A0A0A] mb-2 block">Téléphone</Label>
                            <Input
                              type="tel"
                              placeholder="+33 6 00 00 00 00"
                              className="h-12"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#0A0A0A] mb-2 block">Email</Label>
                          <Input
                            type="email"
                            placeholder="jean@example.com"
                            className="h-12"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-[#0A0A0A] mb-2 block">Message</Label>
                          <textarea
                            placeholder="Décrivez votre demande..."
                            className="w-full min-h-[150px] resize-none px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5CD85A] focus:border-transparent"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-14 bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A] rounded-xl text-base font-semibold"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            'Envoi en cours...'
                          ) : (
                            <>
                              Envoyer le message
                              <Send className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-[#5CD85A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0A0A0A] mb-2">Horaires</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Lundi - Dimanche</p>
                        <p className="font-medium text-[#0A0A0A]">24h/24, 7j/7</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#5CD85A]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-[#5CD85A]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0A0A0A] mb-2">Zone de service</h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Haute-Savoie (Cluses, Annecy, Chamonix...)</p>
                        <p>Aéroports Genève & Lyon</p>
                        <p>Stations de ski</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-[#0A0A0A]">
                <CardContent className="p-6 text-white">
                  <h3 className="font-semibold mb-3">Besoin d'un devis rapide ?</h3>
                  <p className="text-sm text-white/70 mb-4">
                    Utilisez notre calculateur en ligne pour une estimation instantanée
                  </p>
                  <Button asChild className="w-full bg-[#5CD85A] hover:bg-[#4BC449] text-[#0A0A0A]">
                    <Link href="/reservation">
                      Obtenir un devis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
