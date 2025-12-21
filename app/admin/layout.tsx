import Link from 'next/link';
import { LayoutDashboard, Calendar, Settings, LogOut, Menu, Lock, DollarSign, FileText, HelpCircle, Clock, MapPin } from 'lucide-react';
import { getAdminFromRequest } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { headers } from 'next/headers';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Get current path from headers
    const headersList = await headers();
    const pathname = headersList.get('x-invoke-path') || headersList.get('x-pathname') || '';

    console.log('[ADMIN LAYOUT] Path:', pathname);

    // Skip auth check for login page
    if (pathname.includes('/admin/login')) {
        console.log('[ADMIN LAYOUT] Login page - skipping auth check');
        return <>{children}</>;
    }

    // Check if user is authenticated
    const admin = await getAdminFromRequest();
    if (!admin) {
        console.log('[ADMIN LAYOUT] No admin found - redirecting to login');
        redirect('/admin/login');
    }

    console.log('[ADMIN LAYOUT] Admin authenticated:', admin.email);

    return (
        <div className="min-h-screen bg-slate-50">
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
                                <p className="text-sm font-medium text-white">{admin.email}</p>
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
                <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-slate-900 px-4 py-4 shadow-md md:hidden">
                    <button type="button" className="-m-2.5 p-2.5 text-slate-300">
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 text-sm font-semibold text-white">Admin</div>
                </div>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
