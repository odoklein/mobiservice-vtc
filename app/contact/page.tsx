'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONTACT } from '@/lib/constants';
import { Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMyLjIwOSAwIDQtMS43OTEgNC00cy0xLjc5MS00LTQtNC00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Nous Contacter</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Une question ? Un besoin spécifique ? Nous sommes à votre écoute
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Contact Cards */}
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center">
                <Phone className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Téléphone</h3>
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {CONTACT.phone}
                </a>
                <p className="text-sm text-muted-foreground mt-2">Disponible 7j/7</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center">
                <Mail className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Email</h3>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {CONTACT.email}
                </a>
                <p className="text-sm text-muted-foreground mt-2">Réponse sous 24h</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">WhatsApp</h3>
                <a
                  href={`https://wa.me/${CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Envoyer un message
                </a>
                <p className="text-sm text-muted-foreground mt-2">Réponse rapide</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <div className="text-green-600 text-4xl mb-3">✓</div>
                    <h3 className="font-semibold text-green-900 mb-2">Message envoyé !</h3>
                    <p className="text-green-700">Nous vous répondrons dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom complet *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Jean Dupont"
                          required
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="jean.dupont@email.com"
                          required
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Objet de votre demande"
                        required
                        value={formData.subject}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <textarea
                        id="message"
                        name="message"
                        placeholder="Décrivez votre demande..."
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full min-h-[150px] px-3 py-2 border border-input rounded-md bg-background text-foreground resize-none"
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Envoyer le message
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horaires de disponibilité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Lundi - Vendredi</span>
                    <span className="text-muted-foreground">6h00 - 23h00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Samedi</span>
                    <span className="text-muted-foreground">7h00 - 23h00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Dimanche</span>
                    <span className="text-muted-foreground">8h00 - 22h00</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      * Service disponible 24h/24 sur demande préalable pour les transferts aéroport
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Zone de service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Nous couvrons Lyon et toute la région Auvergne-Rhône-Alpes :
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span>Lyon et sa métropole</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span>Transferts aéroports (Lyon, Genève, Grenoble)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span>Stations de ski (sur devis)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2" />
                      <span>Déplacements longue distance (sur devis)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Besoin d'une réservation urgente ?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Pour les réservations de dernière minute, appelez-nous directement
                  </p>
                  <Button asChild className="w-full">
                    <a href={`tel:${CONTACT.phone}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Appeler maintenant
                    </a>
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

