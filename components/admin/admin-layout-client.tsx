'use client';

import Link from 'next/link';
import { LayoutDashboard, Calendar, Settings, LogOut, Menu, Lock, DollarSign, FileText, HelpCircle, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileNavProvider, useMobileNav } from '@/contexts/mobile-nav-context';
import { MobileDrawer } from '@/components/admin/mobile-drawer';

interface AdminLayoutClientProps {
    children: React.ReactNode;
    adminEmail: string;
}

function AdminLayoutContent({ children, adminEmail }: AdminLayoutClientProps) {
    const { toggle } = useMobileNav();

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Drawer */}
            <MobileDrawer adminEmail={adminEmail} />

            {/* Sidebar - Desktop */}
            <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-grow bg-slate-900 overflow-y-auto">
                    {/* Logo */}
                    <div className="flex items-center flex-shrink-0 px-6 py-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <div>
                                <div className="text-white font-bold">Mobi Service</div>
                                <div className="text-slate-400 text-xs">Admin Panel</div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <Link
                            href="/admin"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <LayoutDashboard className="h-5 w-5 mr-3" />
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/bookings"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Calendar className="h-5 w-5 mr-3" />
                            Réservations
                        </Link>

                        {/* Separator */}
                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Paramètres
                            </p>
                        </div>

                        <Link
                            href="/admin/settings/pricing"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <DollarSign className="h-5 w-5 mr-3" />
                            Tarification
                        </Link>
                        <Link
                            href="/admin/settings/working-hours"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Clock className="h-5 w-5 mr-3" />
                            Horaires
                        </Link>
                        <Link
                            href="/admin/settings/depot"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <MapPin className="h-5 w-5 mr-3" />
                            Dépôt VTC
                        </Link>
                        <Link
                            href="/admin/settings/invoices"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <FileText className="h-5 w-5 mr-3" />
                            Factures & Devis
                        </Link>
                        <Link
                            href="/admin/settings/password"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Lock className="h-5 w-5 mr-3" />
                            Mot de passe
                        </Link>

                        {/* Separator */}
                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Support
                            </p>
                        </div>

                        <Link
                            href="/admin/help"
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <HelpCircle className="h-5 w-5 mr-3" />
                            Aide
                        </Link>
                    </nav>

                    {/* User Info */}
                    <div className="flex-shrink-0 border-t border-slate-700 p-4">
                        <div className="flex items-center justify-between mb-3 px-4">
                            <div>
                                <p className="text-sm font-medium text-white truncate max-w-[180px]">{adminEmail}</p>
                                <p className="text-xs text-slate-400">Administrateur</p>
                            </div>
                        </div>
                        <form action="/api/admin/auth/logout" method="POST">
                            <Button
                                type="submit"
                                variant="ghost"
                                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Déconnexion
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="md:pl-64 flex flex-col flex-1">
                {/* Mobile header */}
                <div className="sticky top-0 z-30 flex items-center gap-x-4 bg-slate-900 px-4 py-4 shadow-md md:hidden">
                    <button
                        type="button"
                        onClick={toggle}
                        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors touch-target"
                        aria-label="Ouvrir le menu"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 text-base font-semibold text-white">Admin</div>
                </div>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}

export function AdminLayoutClient({ children, adminEmail }: AdminLayoutClientProps) {
    return (
        <MobileNavProvider>
            <AdminLayoutContent adminEmail={adminEmail}>
                {children}
            </AdminLayoutContent>
        </MobileNavProvider>
    );
}
