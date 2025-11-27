import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VALUES, SERVICES, DRIVER, VEHICLE } from '@/lib/constants';
import { ArrowRight, Star, Car, Shield, Leaf, Clock, Check, ChevronLeft, ChevronRight, Sparkles, Award, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] bg-gradient-premium-hero overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        
        {/* Subtle Background Accents */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#5CD85A]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#B8D4E3]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column - Premium Marketing Content */}
            <div className="order-2 lg:order-1 space-y-8">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#5CD85A]/20">
                <Sparkles className="h-4 w-4 text-[#5CD85A]" />
                <span className="text-sm font-medium text-white/90">Service VTC Premium en Haute-Savoie</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                <span className="text-white">L'Excellence du</span>
                <br />
                <span className="text-gradient-emerald">Transport Privé</span>
              </h1>
              
              {/* Location breadcrumb */}
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <span>🌍 Europe</span>
                <span className="text-white/30">›</span>
                <span>🇫🇷 France</span>
                <span className="text-white/30">›</span>
                <span>🏔️ Auvergne-Rhône-Alpes</span>
                <span className="text-white/30">›</span>
                <span className="text-[#5CD85A] font-medium">Haute-Savoie</span>
              </div>
              
              <p className="text-lg md:text-xl text-white/70 max-w-xl leading-relaxed">
                Votre chauffeur privé d'exception en Haute-Savoie. Confort, ponctualité et discrétion pour tous vos déplacements professionnels et personnels.
              </p>
              
              {/* Premium Stats */}
              <div className="flex flex-wrap gap-6 py-4">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[#5CD85A]">400+</div>
                  <div className="text-sm text-white/60">Clients satisfaits</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[#5CD85A]">15+</div>
                  <div className="text-sm text-white/60">Ans d'expérience</div>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-[#5CD85A]">5.0</div>
                  <div className="text-sm text-white/60">Note moyenne</div>
                </div>
              </div>

              {/* Premium CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/reservation" className="btn-premium inline-flex items-center justify-center gap-2 text-base">
                  Réserver maintenant
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/tarifs" className="btn-premium-outline inline-flex items-center justify-center gap-2 text-base">
                  Découvrir nos tarifs
                </Link>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#5CD85A]" />
                  <span className="text-sm text-white/60">Paiement sécurisé</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-[#B8D4E3]" />
                  <span className="text-sm text-white/60">Service Premium</span>
                </div>
              </div>
            </div>

            {/* Right Column - Premium Image with Glass Overlay */}
            <div className="order-1 lg:order-2 relative">
              <div className="relative w-full aspect-[4/5] lg:aspect-[3/4] rounded-3xl overflow-hidden glow-emerald">
                <Image
                  src="/Gemini_Generated_Image_v3rrr3v3rrr3v3rr.png"
                  alt={`${DRIVER.name}, chauffeur premium VTC à Lyon`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-60"></div>
                
                {/* Glass Testimonial Card */}
                <div className="absolute bottom-6 left-6 right-6 glass-dark p-5 rounded-2xl border border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#5CD85A] to-[#4BC449] flex items-center justify-center text-[#0A0A0A] font-bold text-sm flex-shrink-0">
                      MD
                    </div>
                    <div className="flex-1">
                      <p className="text-white/90 text-sm leading-relaxed mb-3">
                        "Service exceptionnel ! Patrice est ponctuel, professionnel et très agréable. Je recommande vivement."
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white text-sm">Marie Dubois</p>
                          <p className="text-xs text-white/50">Directrice, TechCorp</p>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-[#B8D4E3] text-[#B8D4E3]" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute top-6 right-6 glass px-4 py-2 rounded-full border border-[#5CD85A]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#5CD85A] animate-pulse"></div>
                    <span className="text-sm font-medium text-white">Disponible 24/7</span>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border-2 border-[#5CD85A]/20 rounded-2xl -z-10"></div>
              <div className="absolute -top-4 -right-4 w-32 h-32 border-2 border-[#B8D4E3]/10 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
        
        {/* Bottom Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </section>

      {/* Premium Driver Showcase Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(0,255,136,0.03),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image with Premium Frame */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5CD85A]/20 to-[#B8D4E3]/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
              <div className="relative rounded-3xl overflow-hidden border-2 border-[#5CD85A]/10 shadow-2xl">
                <Image
                  src="/Gemini_Generated_Image_v3rrr3v3rrr3v3rr.png"
                  alt={`${DRIVER.name} au volant de son véhicule premium`}
                  width={800}
                  height={600}
                  className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/40 via-transparent to-transparent"></div>
              </div>
              
              {/* Floating Experience Badge */}
              <div className="absolute -bottom-6 -right-6 glass-light p-6 rounded-2xl shadow-xl border border-white/50">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#5CD85A]">15+</div>
                  <div className="text-sm text-gray-600 font-medium">Ans d'expérience</div>
                </div>
              </div>
            </div>
            
            {/* Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5CD85A]/10 border border-[#5CD85A]/20">
                <Award className="h-4 w-4 text-[#5CD85A]" />
                <span className="text-sm font-semibold text-[#0A0A0A]">Chauffeur Certifié</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-bold text-[#0A0A0A] leading-tight">
                Rencontrez votre
                <span className="text-gradient-emerald block">chauffeur d'exception</span>
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {DRIVER.name}, avec plus de {DRIVER.experience}, incarne l'excellence du transport privé. 
                Chaque trajet est une expérience unique où discrétion, ponctualité et confort premium sont garantis.
              </p>
              
              {/* Premium Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '400+', label: 'Clients satisfaits', icon: '👥' },
                  { value: '5.0', label: 'Note moyenne', icon: '⭐' },
                  { value: '100%', label: 'Ponctualité', icon: '⏱️' },
                  { value: '24/7', label: 'Disponibilité', icon: '🌙' },
                ].map((stat, index) => (
                  <div key={index} className="card-premium p-5 group cursor-default">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{stat.icon}</span>
                      <div>
                        <div className="text-2xl font-bold text-[#0A0A0A] group-hover:text-[#4BC449] transition-colors">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link href="/driver" className="btn-premium inline-flex items-center gap-2">
                Découvrir {DRIVER.name}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Values Section - 4 Pillars */}
      <section className="py-24 bg-gradient-premium-hero relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-pattern-dots"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#5CD85A]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#B8D4E3]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#5CD85A]/20 mb-6">
              <Sparkles className="h-4 w-4 text-[#5CD85A]" />
              <span className="text-sm font-medium text-white/90">Nos Engagements</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              L'excellence en <span className="text-gradient-emerald">quatre piliers</span>
            </h2>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Des valeurs fondamentales qui définissent chaque trajet avec MobiService
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value, index) => (
              <div key={index} className="card-premium-dark p-8 group text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#5CD85A]/20 to-[#5CD85A]/5 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#5CD85A] transition-colors">{value.title}</h3>
                <p className="text-white/60 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium Services Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(212,175,55,0.03),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#B8D4E3]/10 border border-[#B8D4E3]/20 mb-6">
              <Zap className="h-4 w-4 text-[#B8D4E3]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">Nos Services Premium</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0A0A0A]">
              Une gamme complète de
              <span className="text-gradient-gold block">services sur mesure</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chaque service est conçu pour répondre à vos besoins spécifiques avec excellence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {SERVICES.map((service, index) => (
              <div key={service.id} className="card-premium p-8 group relative overflow-hidden">
                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#5CD85A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5CD85A]/10 to-[#5CD85A]/5 flex items-center justify-center text-4xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      {service.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#0A0A0A] mb-2 group-hover:text-[#4BC449] transition-colors">{service.name}</h3>
                      <p className="text-gray-600 leading-relaxed mb-4">{service.description}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-lg font-bold text-[#5CD85A]">{service.priceInfo}</span>
                        <Link href="/reservation" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0A0A] hover:text-[#4BC449] transition-colors">
                          Réserver
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/services" className="btn-premium-outline inline-flex items-center gap-2">
              Voir tous les détails
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Vehicle Showcase */}
      <section className="py-24 bg-gradient-premium-hero relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-pattern-grid opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[#5CD85A]/5 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-[#B8D4E3]/20 mb-6">
              <Car className="h-4 w-4 text-[#B8D4E3]" />
              <span className="text-sm font-medium text-white/90">Véhicule d'Exception</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Voyagez en <span className="text-gradient-gold">{VEHICLE.make}</span>
            </h2>
            <p className="text-xl text-white/60">
              {VEHICLE.model} {VEHICLE.year} • Confort et élégance absolus
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {VEHICLE.features.map((feature, index) => (
                <div key={index} className="glass p-5 rounded-xl border border-white/10 group hover:border-[#5CD85A]/30 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-[#5CD85A] rounded-full flex-shrink-0 group-hover:animate-pulse" />
                    <span className="text-sm font-medium text-white/90">{feature}</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Capacity Card */}
            <div className="glass p-8 rounded-2xl border border-[#B8D4E3]/20 text-center">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#B8D4E3] mb-2">{VEHICLE.seats}</div>
                  <div className="text-sm text-white/60">Passagers max</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#B8D4E3] mb-2">{VEHICLE.luggage}</div>
                  <div className="text-sm text-white/60">Bagages</div>
                </div>
                <div className="w-px h-12 bg-white/10 hidden md:block"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#5CD85A] mb-2">Hybride</div>
                  <div className="text-sm text-white/60">Motorisation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,136,0.05),transparent_70%)]"></div>
        <div className="absolute top-10 left-10 w-32 h-32 border-2 border-[#5CD85A]/10 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-[#B8D4E3]/10 rounded-full"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5CD85A]/10 border border-[#5CD85A]/20 mb-8">
              <Sparkles className="h-4 w-4 text-[#5CD85A]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">Réservation Instantanée</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-[#0A0A0A]">
              Prêt pour une expérience
              <span className="text-gradient-emerald block">exceptionnelle ?</span>
            </h2>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Réservez votre trajet en moins de 30 secondes et découvrez le transport privé d'exception
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/reservation" className="btn-premium inline-flex items-center justify-center gap-2 text-lg px-10 py-4">
                Réserver maintenant
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/contact" className="btn-premium-outline inline-flex items-center justify-center gap-2 text-lg px-10 py-4">
                Nous contacter
              </Link>
            </div>
            
            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-8 mt-12 flex-wrap">
              <div className="flex items-center gap-2 text-gray-500">
                <Shield className="h-5 w-5 text-[#5CD85A]" />
                <span className="text-sm">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="h-5 w-5 text-[#5CD85A]" />
                <span className="text-sm">Confirmation instantanée</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Star className="h-5 w-5 text-[#B8D4E3]" />
                <span className="text-sm">5.0 étoiles</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
