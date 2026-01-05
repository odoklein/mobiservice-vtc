import Link from 'next/link';
import Image from 'next/image';
import { VALUES, SERVICES, DRIVER, BRAND, CONTACT } from '@/lib/constants';
import { ArrowRight, Star, Shield, Clock, Phone, MapPin, Users, Calendar, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Clean Dark with Enhanced Contrast */}
      <section className="relative h-screen bg-black overflow-hidden flex items-center">
        {/* Background gradient overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/70 z-[1]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 z-[1]"></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              {/* Location Breadcrumb */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80">
                  🌍 Europe
                </span>
                <span className="text-white/40">›</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80">
                  🇫🇷 France
                </span>
                <span className="text-white/40">›</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80">
                  🏔️ Auvergne-Rhône-Alpes
                </span>
                <span className="text-white/40">›</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF88]/20 border border-[#00FF88]/40 text-[#00FF88] font-medium">
                  Haute-Savoie
                </span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl font-bold leading-[1.1]">
                  <span className="text-white drop-shadow-lg">L'Excellence du</span>
                  <br />
                  <span className="text-[#00FF88] drop-shadow-lg">Transport Privé avec Chauffeur</span>
                </h1>
                <p className="text-xl md:text-2xl text-white/90 max-w-lg leading-relaxed drop-shadow-md">
                  Pour tous vos déplacements professionnels et/ou personnels, votre chauffeur privé en Haute-Savoie saura vous accompagner en répondant à vos attentes. Confort, ponctualité et discrétion, avec MobiService VTC découvrez la mobilité en toute sérénité.
                </p>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-8 py-4 bg-black/40 backdrop-blur-sm rounded-2xl px-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">15<span className="text-[#00FF88]">+</span></div>
                  <div className="text-sm text-white/70 mt-1">Années</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white flex items-center gap-1">
                    5.0 <Star className="h-5 w-5 text-[#FFD700] fill-[#FFD700]" />
                  </div>
                  <div className="text-sm text-white/70 mt-1">Avis clients</div>
                </div>
                <div className="w-px h-12 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">24<span className="text-[#00FF88]">/7</span></div>
                  <div className="text-sm text-white/70 mt-1">Disponible</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/reservation"
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#00FF88] text-black font-semibold text-lg rounded-2xl hover:bg-[#00CC6A] transition-all shadow-lg shadow-[#00FF88]/30"
                >
                  <span>Estimation de votre trajet</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href={`tel:${CONTACT.phone}`}
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/15 border border-white/30 text-white font-semibold text-lg rounded-2xl hover:bg-white/25 transition-all backdrop-blur-sm"
                >
                  <Phone className="h-5 w-5" />
                  <span>Appeler</span>
                </Link>
              </div>
            </div>

            {/* Right - Driver Image */}
            <div className="hidden lg:block relative">
              <div className="relative aspect-[4/5] max-h-[70vh] rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Image overlay for better card visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[1]"></div>
                <Image
                  src="/Gemini_Generated_Image_v3rrr3v3rrr3v3rr.png"
                  alt={`${DRIVER.name}, votre chauffeur VTC`}
                  fill
                  className="object-cover"
                  priority
                  sizes="50vw"
                />
              </div>

              {/* Driver Info Card */}
              <div className="absolute bottom-8 left-4 right-4 p-6 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 z-[2]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#00FF88]/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#00FF88]" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-lg">{DRIVER.name}</div>
                    <div className="text-white/70 text-sm">{DRIVER.experience}</div>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <Star className="h-4 w-4 text-[#FFD700] fill-[#FFD700]" />
                    <span className="text-white font-medium">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-gradient-to-b from-white via-[#F8FAFB] to-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-[#00FF88]/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-[400px] h-[400px] bg-[#00CC6A]/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-[#00FF88]/5 to-transparent rounded-full"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

        <div className="container mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 backdrop-blur-sm mb-8 hover:border-[#00FF88]/50 transition-colors">
              <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
              <span className="text-sm font-medium text-[#0A0A0A]/80">Nos prestations</span>
            </div>
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#0A0A0A] mb-6 tracking-tight">
              Nos services <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00CC6A] to-[#00FF88]">sur mesure</span>
            </h2>
            <p className="text-xl md:text-2xl text-[#0A0A0A]/50 max-w-2xl mx-auto leading-relaxed">
              Chaque trajet est une expérience unique, adaptée à vos besoins
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {SERVICES.map((service, index) => (
              <Link
                key={service.id}
                href="/reservation"
                className="group relative rounded-[2rem] bg-white shadow-xl shadow-black/5 border border-gray-100 hover:border-[#00FF88]/50 transition-all duration-700 overflow-hidden hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#00FF88]/20"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00FF88]/0 to-[#00FF88]/0 group-hover:from-[#00FF88]/5 group-hover:to-transparent transition-all duration-700 rounded-[2rem]"></div>

                {/* Card number indicator */}
                <div className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-[#0A0A0A]/30 text-sm font-medium group-hover:bg-[#00FF88]/10 group-hover:border-[#00FF88]/40 group-hover:text-[#00CC6A] transition-all duration-500 shadow-lg">
                  0{index + 1}
                </div>

                <div className="flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent z-10"></div>

                    <Image
                      src={service.illustration}
                      alt={service.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    />

                    {/* Icon badge */}
                    <div className="absolute bottom-4 left-4 z-20 w-14 h-14 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-[#00FF88]/20 group-hover:border-[#00FF88]/40 transition-all duration-500 shadow-lg">
                      {service.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 pt-6">
                    <h3 className="text-xl md:text-2xl font-bold text-[#0A0A0A] mb-3 group-hover:text-[#00CC6A] transition-colors duration-500 leading-tight">
                      {service.name}
                    </h3>
                    <p className="text-[#0A0A0A]/60 mb-6 leading-relaxed group-hover:text-[#0A0A0A]/80 transition-colors duration-500">
                      {service.description}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-100 group-hover:border-[#00FF88]/30 transition-colors duration-500">
                      <div className="flex flex-col">
                        <span className="text-xs text-[#0A0A0A]/40 uppercase tracking-wider mb-1">Tarif</span>
                        <span className="text-lg font-bold text-[#00CC6A]">{service.priceInfo}</span>
                      </div>
                      <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-[#0A0A0A]/5 border border-[#0A0A0A]/10 group-hover:bg-[#00FF88] group-hover:border-[#00FF88] transition-all duration-500">
                        <span className="text-sm font-semibold text-[#0A0A0A] group-hover:text-white transition-colors duration-500">Réserver</span>
                        <ArrowRight className="h-4 w-4 text-[#0A0A0A] group-hover:text-white group-hover:translate-x-1 transition-all duration-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-32 bg-[#0A0A0A]">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
                <span className="text-sm font-medium text-[#00FF88]">Nos engagements</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                L'excellence à chaque
                <span className="text-[#00FF88]"> trajet</span>
              </h2>
              <p className="text-xl text-white/70 mb-8 leading-relaxed">
                Nous mettons un point d'honneur à offrir une expérience irréprochable.
              </p>

              <div className="space-y-4">
                {VALUES.map((value, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#00FF88]/20 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#00FF88]/10 flex items-center justify-center text-2xl flex-shrink-0">
                      {value.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{value.title}</h3>
                      <p className="text-white/60 text-sm">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right */}
            <div className="relative">
              <div className="aspect-square rounded-3xl bg-[#00FF88]/10 p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-white mb-4">100%</div>
                  <div className="text-2xl text-[#00FF88] font-medium">Satisfaction client</div>
                  <div className="mt-8 flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-8 w-8 text-[#FFD700] fill-[#FFD700]" />
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -top-4 -left-4 p-4 bg-white rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#00FF88]" />
                  <span className="font-semibold text-[#0A0A0A]">Véhicule premium 100% électrique</span>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 p-4 bg-white rounded-2xl shadow-xl">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-[#00FF88]" />
                  <span className="font-semibold text-[#0A0A0A]">Assurance incluse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-[#0A0A0A] mb-6">
              Prêt pour votre
              <span className="text-[#00FF88]"> prochain trajet</span> ?
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Estimez et Réservez en quelques clics pour profiter d'un service d'exception.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/reservation"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#0A0A0A] text-white font-semibold text-lg rounded-2xl hover:bg-[#1a1a1a] transition-all"
              >
                <Calendar className="h-5 w-5" />
                <span>Estimation de votre trajet</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/tarifs"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gray-100 text-[#0A0A0A] font-semibold text-lg rounded-2xl hover:bg-gray-200 transition-all"
              >
                Voir les tarifs
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#00FF88]" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#00FF88]" />
                <span>Estimation</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#00FF88]" />
                <span>Demande de réservation</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#00FF88]" />
                <span>Confirmation instantanée</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#00FF88]" />
                <span>Haute-Savoie & environs</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
