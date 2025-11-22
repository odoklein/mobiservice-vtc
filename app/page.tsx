import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VALUES, SERVICES, DRIVER, VEHICLE } from '@/lib/constants';
import { ArrowRight, Star, Car, Shield, Leaf, Clock, Check, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Two Column Layout */}
      <section className="relative bg-white py-12 md:py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Marketing Content */}
            <div className="order-2 lg:order-1 pt-0 lg:pt-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight tracking-tight text-slate-900">
                Rejoignez 400+ clients satisfaits
                <span className="block text-blue-600 mt-2">avec MobiService</span>
              </h1>
              
              {/* Benefits List */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">Réservation en 30 secondes</p>
                    <p className="text-sm text-slate-600">Processus simple et rapide</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">Chauffeur professionnel dédié</p>
                    <p className="text-sm text-slate-600">Patrice, 15+ ans d'expérience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center mt-0.5">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-slate-900">Véhicule premium hybride</p>
                    <p className="text-sm text-slate-600">Mercedes Classe E, tout confort</p>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="default" variant="outline" asChild className="px-6 py-5 border-slate-300 hover:bg-slate-50 text-slate-900 font-medium">
                  <Link href="/tarifs">
                    En savoir plus
                  </Link>
                </Button>
                <Button size="default" asChild className="px-6 py-5 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all font-medium">
                  <Link href="/reservation">
                    Réserver maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Image with Testimonial Overlay */}
            <div className="order-1 lg:order-2 relative p-4">
              {/* Driver/Vehicle Image */}
              <div className="relative w-full h-[70vh] rounded-xl overflow-hidden shadow-xl">
                <Image
                  src="/Gemini_Generated_Image_v3rrr3v3rrr3v3rr.png"
                  alt={`${DRIVER.name}, chauffeur premium VTC à Lyon`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                {/* Gradient overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                
                {/* Testimonial Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-white/20 shadow-lg">
                  <div className="mb-3">
                    <p className="text-slate-900 font-medium mb-3 leading-relaxed text-sm">
                      "Service exceptionnel ! Patrice est ponctuel, professionnel et très agréable. Le véhicule est impeccable. Je recommande vivement MobiService."
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                        MD
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">Marie Dubois</p>
                        <p className="text-xs text-slate-600">Directrice, TechCorp</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-slate-900 text-slate-900" />
                      ))}
                    </div>
                    <div className="flex gap-1.5">
                      <button className="w-7 h-7 rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center transition-colors">
                        <ChevronLeft className="h-3.5 w-3.5 text-slate-700" />
                      </button>
                      <button className="w-7 h-7 rounded-full bg-white/50 hover:bg-white/70 backdrop-blur-sm flex items-center justify-center transition-colors">
                        <ChevronRight className="h-3.5 w-3.5 text-slate-700" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Driver Showcase */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="/Gemini_Generated_Image_v3rrr3v3rrr3v3rr.png"
                alt={`${DRIVER.name} au volant de son véhicule premium`}
                width={800}
                height={600}
                className="object-cover w-full h-full"
                priority={false}
              />
            </div>
            <div className="space-y-6">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">Professionnalisme</Badge>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
                Un chauffeur expérimenté à votre service
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                {DRIVER.name}, avec plus de {DRIVER.experience}, vous garantit un service de transport premium. 
                Discrétion, ponctualité et confort sont ses priorités pour chaque trajet.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">15+</div>
                  <div className="text-sm text-slate-600">Années d'expérience</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">400+</div>
                  <div className="text-sm text-slate-600">Clients satisfaits</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">5.0</div>
                  <div className="text-sm text-slate-600">Note moyenne</div>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">100%</div>
                  <div className="text-sm text-slate-600">Ponctualité</div>
                </div>
              </div>
              <Button asChild size="lg" className="mt-4 bg-blue-600 hover:bg-blue-700">
                <Link href="/driver">
                  Découvrir {DRIVER.name}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why MobiService - 4 Pillars */}
      <section className="py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">Nos Valeurs</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Pourquoi choisir MobiService ?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Quatre valeurs fondamentales qui guident chacun de nos trajets
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-xl hover:-translate-y-1 bg-white">
                <CardHeader className="pb-4">
                  <div className="text-5xl mb-4">{value.icon}</div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">{value.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Patrice */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">Votre Chauffeur</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
                Rencontrez {DRIVER.name}, {DRIVER.age} ans
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {DRIVER.bio}
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{DRIVER.experience}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Car className="h-5 w-5 text-primary" />
                  <span>{VEHICLE.make} {VEHICLE.model}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Leaf className="h-5 w-5 text-primary" />
                  <span>Véhicule hybride écologique</span>
                </div>
              </div>
              <Button asChild>
                <Link href="/driver">
                  En savoir plus
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 rounded-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                <div className="text-center">
                  <div className="text-7xl mb-6">👨‍💼</div>
                  <p className="text-2xl font-bold text-slate-900">{DRIVER.name}</p>
                  <p className="text-muted-foreground text-lg mt-2">Chauffeur Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">Nos Offres</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Nos Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un service adapté à chaque besoin de transport
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SERVICES.map((service) => (
              <Card key={service.id} className="hover:shadow-xl transition-all hover:-translate-y-1 border-2 bg-white">
                <CardHeader className="pb-4">
                  <div className="text-5xl mb-4">{service.icon}</div>
                  <CardTitle className="text-2xl">{service.name}</CardTitle>
                  <CardDescription className="text-base leading-relaxed mt-2">{service.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-base font-bold text-primary">{service.priceInfo}</span>
                    <Button variant="outline" size="sm" asChild className="font-medium">
                      <Link href="/reservation">Réserver</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link href="/services">
                Voir tous les services
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Vehicle Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-200">Véhicule</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Votre Véhicule Premium</h2>
            <p className="text-xl text-muted-foreground">
              {VEHICLE.make} {VEHICLE.model} {VEHICLE.year}
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {VEHICLE.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
                  <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-2xl text-center text-white shadow-xl">
              <p className="text-lg">
                Capacité : <span className="font-bold">{VEHICLE.seats} passagers</span> • <span className="font-bold">{VEHICLE.luggage} bagages</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMyLjIwOSAwIDQtMS43OTEgNC00cy0xLjc5MS00LTQtNC00IDEuNzkxLTQgNCAxLjc5MSA0IDQgNHoiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à réserver votre trajet ?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Réservez en moins de 30 secondes et profitez d'un service de transport premium
          </p>
          <Button size="lg" asChild className="text-lg px-10 py-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all">
            <Link href="/reservation">
              Réserver maintenant
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
