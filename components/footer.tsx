import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';
import { BRAND, CONTACT, NAV_ITEMS } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-block">
              <Image
                src="/Mobiservices-logo.png"
                alt={`${BRAND.name} - ${BRAND.tagline}`}
                width={200}
                height={55}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {BRAND.description}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/services#transfer" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Transfert Point à Point
                </Link>
              </li>
              <li>
                <Link href="/services#airport" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Transfert Aéroport
                </Link>
              </li>
              <li>
                <Link href="/services#hourly" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Mise à Disposition
                </Link>
              </li>
              <li>
                <Link href="/services#business" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Business & Événements
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <a
                  href={`tel:${CONTACT.phone}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {CONTACT.address}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {BRAND.name}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

