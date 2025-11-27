import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin, ArrowRight, Shield, Clock, Star } from 'lucide-react';
import { BRAND, CONTACT, NAV_ITEMS } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      {/* Premium Dark Section */}
      <div className="bg-gradient-to-br from-[#0A0A0A] via-[#141414] to-[#1E1E1E] text-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(0,255,136,0.05),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,175,55,0.03),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-6">
              <Link href="/" className="inline-block">
                <Image
                  src="/Mobiservices-logo.png"
                  alt={`${BRAND.name} - ${BRAND.tagline}`}
                  width={200}
                  height={55}
                  className="h-12 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <p className="text-white/60 text-sm leading-relaxed">
                {BRAND.description}
              </p>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Shield className="h-4 w-4 text-[#00FF88]" />
                  <span>Sécurisé</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Clock className="h-4 w-4 text-[#00FF88]" />
                  <span>24/7</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Star className="h-4 w-4 text-[#D4AF37]" />
                  <span>5.0</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-semibold mb-6 text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-[#00FF88] to-transparent rounded-full"></span>
                Navigation
              </h3>
              <ul className="space-y-3">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold mb-6 text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-[#D4AF37] to-transparent rounded-full"></span>
                Services
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/services#transfer" className="text-sm text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    Transfert Point à Point
                  </Link>
                </li>
                <li>
                  <Link href="/services#airport" className="text-sm text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    Transfert Aéroport
                  </Link>
                </li>
                <li>
                  <Link href="/services#hourly" className="text-sm text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    Mise à Disposition
                  </Link>
                </li>
                <li>
                  <Link href="/services#business" className="text-sm text-white/60 hover:text-[#00FF88] transition-colors duration-300 flex items-center gap-2 group">
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    Business & Événements
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold mb-6 text-white flex items-center gap-2">
                <span className="w-8 h-0.5 bg-gradient-to-r from-[#00FF88] to-transparent rounded-full"></span>
                Contact
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href={`tel:${CONTACT.phone}`}
                    className="flex items-center gap-3 text-white/60 hover:text-[#00FF88] transition-colors duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#00FF88]/30 group-hover:bg-[#00FF88]/5 transition-all duration-300">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{CONTACT.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${CONTACT.email}`}
                    className="flex items-center gap-3 text-white/60 hover:text-[#00FF88] transition-colors duration-300 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#00FF88]/30 group-hover:bg-[#00FF88]/5 transition-all duration-300">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="text-sm">{CONTACT.email}</span>
                  </a>
                </li>
                <li className="flex items-center gap-3 text-white/60">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-sm">{CONTACT.address}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright Bar */}
      <div className="bg-[#0A0A0A] border-t border-white/5">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/40">
              © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/mentions-legales" className="text-xs text-white/40 hover:text-[#00FF88] transition-colors">
                Mentions légales
              </Link>
              <Link href="/confidentialite" className="text-xs text-white/40 hover:text-[#00FF88] transition-colors">
                Confidentialité
              </Link>
              <Link href="/cgv" className="text-xs text-white/40 hover:text-[#00FF88] transition-colors">
                CGV
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

