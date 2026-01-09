import Link from 'next/link';
import Image from 'next/image';
import { VALUES, SERVICES, DRIVER, BRAND, CONTACT } from '@/lib/constants';
import { ArrowRight, Star, Shield, Clock, Phone, MapPin, Users, Calendar, CheckCircle2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Creative Design */}
      <section className="relative min-h-screen bg-black overflow-hidden">
        {/* Decorative Elements - Hidden on mobile */}
        <div className="hidden md:block absolute top-0 right-0 w-[400px] lg:w-[600px] xl:w-[800px] h-[400px] lg:h-[600px] xl:h-[800px] opacity-30">
          <div className="absolute top-10 lg:top-20 right-10 lg:right-20 w-48 lg:w-72 xl:w-96 h-48 lg:h-72 xl:h-96 rounded-full border border-[#00FF88]/20"></div>
          <div className="absolute top-16 lg:top-32 right-16 lg:right-32 w-36 lg:w-56 xl:w-72 h-36 lg:h-56 xl:h-72 rounded-full border border-[#00FF88]/10"></div>
          <div className="absolute top-22 lg:top-44 right-22 lg:right-44 w-24 lg:w-36 xl:w-48 h-24 lg:h-36 xl:h-48 rounded-full bg-[#00FF88]/5"></div>
        </div>

        {/* Floating green accent line - Hidden on smaller screens */}
        <div className="hidden xl:block absolute top-1/2 -translate-y-1/2 left-0 w-1 h-32 bg-gradient-to-b from-transparent via-[#00FF88] to-transparent"></div>

        {/* Content */}
        <div className="relative z-10 min-h-screen flex items-center">
          <div className="container mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-20 sm:py-24 lg:py-12">
            <div className="flex flex-col lg:flex-row items-center gap-8 sm:gap-10 lg:gap-6 xl:gap-10">

              {/* Left - Text Content */}
              <div className="w-full lg:w-1/2 xl:w-5/12 space-y-5 sm:space-y-6 lg:space-y-5 xl:space-y-7">
                {/* Location Tag */}
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#00FF88]/10 border border-[#00FF88]/20">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
                  <span className="text-[#00FF88] text-xs sm:text-sm font-medium">Haute-Savoie • France</span>
                </div>

                {/* Headline with creative styling */}
                <div className="space-y-2 sm:space-y-3">
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-4xl xl:text-6xl font-black leading-[0.95] tracking-tight">
                    <span className="text-white block">L'Excellence du</span>
                    <span className="text-white block"><span className="text-[#00FF88] relative inline-block">
                      Transport
                      <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                        <path d="M0 4C50 0 150 8 200 4" stroke="#00FF88" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </span> Privé</span>
                    <span className="text-[#00FF88] block relative inline-block">
                      avec Chauffeur
                      <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                        <path d="M0 4C50 0 150 8 200 4" stroke="#00FF88" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </span>
                  </h1>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base lg:text-sm xl:text-lg text-white/60 leading-relaxed max-w-md">
                  Pour tous vos déplacements professionnels et/ou personnels, votre chauffeur privé en Haute-Savoie saura vous accompagner en répondant à vos attentes. <span className="text-white/80 font-medium">Confort, ponctualité et discrétion</span>, avec MobiService VTC découvrez la mobilité en toute sérénité.
                </p>

                {/* Stats - Responsive cards */}
                <div className="flex gap-2 sm:gap-3 lg:gap-2 xl:gap-4">
                  <div className="flex-1 p-2.5 sm:p-3 lg:p-2.5 xl:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-xl sm:text-2xl lg:text-xl xl:text-3xl font-black text-white">15<span className="text-[#00FF88]">+</span></div>
                    <div className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">ans d'exp.</div>
                  </div>
                  <div className="flex-1 p-2.5 sm:p-3 lg:p-2.5 xl:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                    <div className="text-xl sm:text-2xl lg:text-xl xl:text-3xl font-black text-white flex items-center gap-0.5 sm:gap-1">
                      5.0 <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-3.5 lg:w-3.5 xl:h-5 xl:w-5 text-[#00FF88] fill-[#00FF88]" />
                    </div>
                    <div className="text-[10px] sm:text-xs text-white/40 mt-0.5 sm:mt-1">avis</div>
                  </div>
                  <div className="flex-1 p-2.5 sm:p-3 lg:p-2.5 xl:p-4 rounded-xl sm:rounded-2xl bg-[#00FF88]/10 border border-[#00FF88]/20">
                    <div className="text-xl sm:text-2xl lg:text-xl xl:text-3xl font-black text-[#00FF88]">24/7</div>
                    <div className="text-[10px] sm:text-xs text-[#00FF88]/60 mt-0.5 sm:mt-1">dispo</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <Link
                    href="/reservation"
                    className="group relative inline-flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-5 sm:px-6 lg:px-5 xl:px-8 py-3 sm:py-3.5 lg:py-3 xl:py-4 bg-[#00FF88] text-black font-bold text-sm sm:text-base lg:text-sm xl:text-lg rounded-full overflow-hidden transition-transform hover:scale-105"
                  >
                    <span className="relative z-10">Estimer mon trajet</span>
                    <ArrowRight className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href={`tel:${CONTACT.phone}`}
                    className="inline-flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 text-white font-medium hover:text-[#00FF88] transition-colors"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="text-sm sm:text-base">Appeler :<br></br> <span className="font-bold">{CONTACT.phone}</span></span>
                  </Link>
                </div>
              </div>

              {/* Right - Creative Image Composition */}
              <div className="w-full lg:w-1/2 xl:w-7/12 relative mt-4 sm:mt-6 lg:mt-0">
                {/* Main container */}
                <div className="relative lg:ml-4 xl:ml-8">
                  {/* Glow effect behind image - smaller on mobile */}
                  <div className="absolute inset-0 bg-[#00FF88]/15 sm:bg-[#00FF88]/20 blur-2xl sm:blur-3xl scale-75 translate-x-4 sm:translate-x-8 translate-y-4 sm:translate-y-8"></div>

                  {/* Main Car Image with creative frame */}
                  <div className="relative mx-4 sm:mx-6 lg:mx-0">
                    <div className="relative aspect-[4/3] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl sm:shadow-2xl shadow-black/50 lg:rotate-1 xl:rotate-2 transition-transform hover:rotate-0 duration-500">
                      <Image
                        src="/MG5-Electric-Black-Interior-1024x685 (1).jpg"
                        alt="MG5 Electric Interior"
                        fill
                        className="object-cover"
                        priority
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
                      />

                      {/* Subtle glowing serpentine road effect */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                        <svg
                          viewBox="0 0 400 150"
                          className="w-full h-auto max-h-full opacity-60"
                          preserveAspectRatio="xMidYMid meet"
                        >
                          {/* Glow filter */}
                          <defs>
                            <filter id="roadGlow" x="-50%" y="-50%" width="200%" height="200%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#00FF88" stopOpacity="0" />
                              <stop offset="20%" stopColor="#00FF88" stopOpacity="0.4" />
                              <stop offset="50%" stopColor="#00FF88" stopOpacity="0.6" />
                              <stop offset="80%" stopColor="#00FF88" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Serpentine road path - S-curve */}
                          <path
                            d="M 0 75 
                               C 50 75, 80 30, 130 30 
                               S 200 120, 270 120 
                               S 350 50, 400 75"
                            fill="none"
                            stroke="url(#roadGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            filter="url(#roadGlow)"
                          />

                          {/* Dashed center line */}
                          <path
                            d="M 0 75 
                               C 50 75, 80 30, 130 30 
                               S 200 120, 270 120 
                               S 350 50, 400 75"
                            fill="none"
                            stroke="#00FF88"
                            strokeWidth="1.5"
                            strokeDasharray="8 12"
                            strokeLinecap="round"
                            opacity="0.5"
                          />
                        </svg>
                      </div>

                      {/* Corner accent - smaller on mobile */}
                      <div className="absolute top-0 right-0 w-16 sm:w-20 lg:w-16 xl:w-24 h-16 sm:h-20 lg:h-16 xl:h-24">
                        <div className="absolute top-2 sm:top-3 lg:top-2 xl:top-4 right-2 sm:right-3 lg:right-2 xl:right-4 w-full h-full border-t-2 sm:border-t-3 lg:border-t-2 xl:border-t-4 border-r-2 sm:border-r-3 lg:border-r-2 xl:border-r-4 border-[#00FF88] rounded-tr-2xl sm:rounded-tr-3xl"></div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-16 sm:w-20 lg:w-16 xl:w-24 h-16 sm:h-20 lg:h-16 xl:h-24">
                        <div className="absolute bottom-2 sm:bottom-3 lg:bottom-2 xl:bottom-4 left-2 sm:left-3 lg:left-2 xl:left-4 w-full h-full border-b-2 sm:border-b-3 lg:border-b-2 xl:border-b-4 border-l-2 sm:border-l-3 lg:border-l-2 xl:border-l-4 border-[#00FF88] rounded-bl-2xl sm:rounded-bl-3xl"></div>
                      </div>

                      {/* Driver 1 - Top left ON TOP of border - Using IMG_0047 */}
                      <div className="absolute -top-8 -left-6 sm:-top-10 sm:-left-8 lg:-top-12 lg:-left-10 xl:-top-14 xl:-left-12 z-30">
                        <div className="relative">
                          {/* Image container */}
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 lg:w-22 lg:h-22 xl:w-24 xl:h-24 rounded-full overflow-hidden border-3 sm:border-4 xl:border-[5px] border-[#00FF88] shadow-xl shadow-[#00FF88]/30">
                            <Image
                              src="/IMG_0047 (2).jpeg"
                              alt="Chauffeur professionnel"
                              fill
                              className="object-cover"
                            />
                          </div>
                          {/* Badge */}
                          <div className="absolute -bottom-1.5 sm:-bottom-2 xl:-bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 xl:px-4 py-1 sm:py-1.5 bg-black border-2 border-[#00FF88] rounded-full shadow-xl">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3 xl:h-3.5 xl:w-3.5 text-[#00FF88]" />
                              <span className="text-xs sm:text-sm font-bold text-[#00FF88]">PRO</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Driver Image - Inside bottom right */}
                      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 xl:bottom-10 xl:right-10 z-20">
                        <div className="relative">
                          {/* Image container - Bigger */}
                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 xl:w-40 xl:h-40 rounded-full overflow-hidden border-4 sm:border-[5px] xl:border-[6px] border-[#00FF88] shadow-2xl shadow-[#00FF88]/40">
                            <Image
                              src="/IMG_0046 (2).jpeg"
                              alt="Chauffeur professionnel"
                              fill
                              className="object-cover"
                            />
                          </div>
                          {/* Badge */}
                          <div className="absolute -top-2 sm:-top-3 xl:-top-4 left-1/2 -translate-x-1/2 px-3 sm:px-4 xl:px-5 py-1 sm:py-1.5 xl:py-2 bg-[#00FF88] rounded-full shadow-xl">
                            <div className="flex items-center gap-1 sm:gap-1.5">
                              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-black fill-black" />
                              <span className="text-sm sm:text-base xl:text-lg font-bold text-black">5.0</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Floating info card - Only on larger screens */}
                    <div className="absolute bottom-4 lg:bottom-6 xl:bottom-8 left-2 lg:-left-8 xl:-left-16 z-30 hidden md:block">
                      <div className="p-2.5 sm:p-3 xl:p-4 bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/10 shadow-xl">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-10 xl:h-10 rounded-full bg-[#00FF88]/20 flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 xl:h-5 xl:w-5 text-[#00FF88]" />
                          </div>
                          <div>
                            <div className="text-white font-semibold text-xs sm:text-sm">100% Électrique</div>
                            <div className="text-white/50 text-[10px] sm:text-xs">Véhicule MG5</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Services Section - Bento Grid */}
      <section className="py-20 md:py-32 bg-[#0A0A0A] relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00FF88]/5 rounded-full blur-[150px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#3B82F6]/5 rounded-full blur-[120px]"></div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 xl:px-24 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse"></div>
              <span className="text-sm font-medium text-white/70">Nos prestations</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
              Nos services <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF88] to-[#3B82F6]">sur mesure</span>
            </h2>
            <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto">
              Chaque trajet est une expérience unique, adaptée à vos besoins
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 max-w-6xl mx-auto pb-24 sm:pb-28 md:pb-32">

            {/* Card 1 - Transfert A/S & A/R (Green) */}
            <Link href="/reservation" className="group relative rounded-3xl overflow-visible aspect-[2/3] sm:aspect-[4/3] lg:aspect-[5/4]">
              {/* Image Container with rounded corners */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <Image
                  src="/90 (2).jpg"
                  alt="Transfert Aller Simple et Aller Retour"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Color Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                <div className="absolute inset-0 bg-[#00FF88]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Content - Glassmorphism with Logo - Half centered on bottom edge */}
              <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6 md:px-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 md:p-6 border border-white/20 group-hover:border-[#00FF88]/30 transition-colors duration-500 shadow-xl">
                  <div className="flex flex-row justify-between items-end gap-4">
                    {/* Text Content - Left */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-0.5 mb-3">
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
                          Transfert A/S <span className="text-white/60 font-normal text-sm sm:text-base md:text-lg">(Aller simple)</span>
                        </h3>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight">
                          Transfert A/R <span className="text-white/60 font-normal text-sm sm:text-base md:text-lg">(Aller retour)</span>
                        </h3>
                      </div>
                      <p className="text-white/60 text-xs sm:text-sm md:text-base mb-4 leading-relaxed hidden sm:block">
                        Transfert direct de votre point de départ à votre destination
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">À partir de</span>
                          <div className="text-xl sm:text-2xl font-bold text-[#00FF88]">33€ TTC</div>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-full bg-[#00FF88] text-black font-semibold text-xs sm:text-sm group-hover:shadow-lg group-hover:shadow-[#00FF88]/30 transition-all duration-500">
                          <span className="hidden sm:inline">Demander une estimation</span>
                          <span className="sm:hidden">Estimer</span>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Logo - Right */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center p-1.5 sm:p-2 group-hover:scale-110 group-hover:border-[#00FF88]/50 transition-all duration-500">
                        <Image
                          src="/cardlogogreen.png"
                          alt="Logo vert"
                          width={60}
                          height={60}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            {/* Card 2 - Transfert Forfaitaire (Blue) */}
            <Link href="/reservation" className="group relative rounded-3xl overflow-visible aspect-[2/3] sm:aspect-[4/3] lg:aspect-[5/4]">
              {/* Image Container with rounded corners */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <Image
                  src="/Gemini_Generated_Image_aimpniaimpniaimp.png"
                  alt="Transfert Forfaitaire"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Color Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                <div className="absolute inset-0 bg-[#3B82F6]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Content - Glassmorphism with Logo - Half centered on bottom edge */}
              <div className="absolute inset-x-0 bottom-0 translate-y-1/2 px-4 sm:px-6 md:px-8">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 md:p-6 border border-white/20 group-hover:border-[#3B82F6]/30 transition-colors duration-500 shadow-xl">
                  <div className="flex flex-row justify-between items-end gap-4">
                    {/* Text Content - Left */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
                        Transfert Forfaitaire
                      </h3>
                      <p className="text-white/60 text-xs sm:text-sm md:text-base mb-4 leading-relaxed hidden sm:block">
                        Chauffeur à disposition pour vos déplacements multiples. Forfaits de 2H à 8H disponibles.
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <span className="text-[10px] sm:text-xs text-white/40 uppercase tracking-wider">Demandez votre</span>
                          <div className="text-xl sm:text-2xl font-bold text-[#3B82F6]">Devis</div>
                        </div>
                        <div className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-3 rounded-full bg-[#3B82F6] text-white font-semibold text-xs sm:text-sm group-hover:shadow-lg group-hover:shadow-[#3B82F6]/30 transition-all duration-500">
                          <span className="hidden sm:inline">Demander une estimation</span>
                          <span className="sm:hidden">Estimer</span>
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>

                    {/* Logo - Right */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center p-1.5 sm:p-2 group-hover:scale-110 group-hover:border-[#3B82F6]/50 transition-all duration-500">
                        <Image
                          src="/cardbluelogo.png"
                          alt="Logo bleu"
                          width={60}
                          height={60}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </div>
      </section >

      {/* Values Section */}
      < section className="py-32 bg-[#0A0A0A]" >
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
      </section >

      {/* CTA Section */}
      < section className="py-32 bg-white" >
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
      </section >
    </div >
  );
}
