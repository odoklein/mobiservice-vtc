'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NAV_ITEMS, BRAND, CONTACT } from '@/lib/constants';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8E8E8]/50 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 shadow-sm">
      <nav className="container mx-auto flex h-18 items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/Mobiservices-logo.png"
            alt={`${BRAND.name} - ${BRAND.tagline}`}
            width={180}
            height={50}
            className="h-10 w-auto object-contain transition-all duration-300 group-hover:scale-105"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:items-center md:gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium transition-all duration-300 hover:text-[#4BC449] text-[#0A0A0A] relative group py-2"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#5CD85A] to-[#4BC449] transition-all duration-300 group-hover:w-full rounded-full"></span>
            </Link>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="hidden md:flex md:items-center md:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            asChild 
            className="border-2 border-[#E8E8E8] hover:border-[#5CD85A] hover:bg-[#5CD85A]/5 text-[#0A0A0A] transition-all duration-300 rounded-xl px-4"
          >
            <a href={`tel:${CONTACT.phone}`}>
              <Phone className="mr-2 h-4 w-4" />
              Appeler
            </a>
          </Button>
          <Button 
            size="sm" 
            asChild 
            className="bg-gradient-to-r from-[#5CD85A] to-[#4BC449] hover:from-[#4BC449] hover:to-[#5CD85A] text-[#0A0A0A] font-semibold shadow-lg shadow-[#5CD85A]/20 hover:shadow-xl hover:shadow-[#5CD85A]/30 transition-all duration-300 rounded-xl px-5 border-0"
          >
            <Link href="/reservation" className="flex items-center gap-2">
              Réserver
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#5CD85A]/10 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-[#0A0A0A]" />
          ) : (
            <Menu className="h-6 w-6 text-[#0A0A0A]" />
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E8E8E8] bg-white/95 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base font-medium transition-all duration-300 hover:text-[#4BC449] text-[#0A0A0A] py-3 px-4 rounded-xl hover:bg-[#5CD85A]/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-[#E8E8E8]">
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="w-full border-2 border-[#E8E8E8] hover:border-[#5CD85A] text-[#0A0A0A] rounded-xl"
              >
                <a href={`tel:${CONTACT.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </a>
              </Button>
              <Button 
                size="lg" 
                asChild 
                className="w-full bg-gradient-to-r from-[#5CD85A] to-[#4BC449] text-[#0A0A0A] font-semibold rounded-xl shadow-lg shadow-[#5CD85A]/20 border-0"
              >
                <Link href="/reservation" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                  Réserver maintenant
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

