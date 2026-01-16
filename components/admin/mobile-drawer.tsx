'use client';

import React from 'react';
import Link from 'next/link';
import { useMobileNav } from '@/contexts/mobile-nav-context';
import { LayoutDashboard, Calendar, Settings, LogOut, DollarSign, FileText, HelpCircle, Clock, MapPin, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileDrawerProps {
    adminEmail: string;
}

export function MobileDrawer({ adminEmail }: MobileDrawerProps) {
    const { isOpen, close } = useMobileNav();

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
                    onClick={close}
                    aria-hidden="true"
                />
            )}

            {/* Drawer */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 transform transition-transform duration-300 ease-in-out md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex flex-col h-full overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-6 border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">M</span>
                            </div>
                            <div>
                                <div className="text-white font-bold">Mobi Service</div>
                                <div className="text-slate-400 text-xs">Admin Panel</div>
                            </div>
                        </div>
                        <button
                            onClick={close}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors touch-target"
                            aria-label="Fermer le menu"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        <Link
                            href="/admin"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
                        >
                            <LayoutDashboard className="h-5 w-5 mr-3" />
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/bookings"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
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
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
                        >
                            <DollarSign className="h-5 w-5 mr-3" />
                            Tarification
                        </Link>
                        <Link
                            href="/admin/settings/working-hours"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
                        >
                            <Clock className="h-5 w-5 mr-3" />
                            Horaires
                        </Link>
                        <Link
                            href="/admin/settings/depot"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
                        >
                            <MapPin className="h-5 w-5 mr-3" />
                            Dépôt VTC
                        </Link>
                        <Link
                            href="/admin/settings/invoices"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
                        >
                            <FileText className="h-5 w-5 mr-3" />
                            Factures & Devis
                        </Link>
                        <Link
                            href="/admin/settings/password"
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
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
                            onClick={close}
                            className="flex items-center px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors min-h-[48px]"
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
                                className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 min-h-[48px]"
                            >
                                <LogOut className="h-5 w-5 mr-3" />
                                Déconnexion
                            </Button>
                        </form>
                    </div>
                </div>
            </aside>
        </>
    );
}
