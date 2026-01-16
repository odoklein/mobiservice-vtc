import { getAdminFromRequest } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { AdminLayoutClient } from '@/components/admin/admin-layout-client';

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
        <AdminLayoutClient adminEmail={admin.email}>
            {children}
        </AdminLayoutClient>
    );
}
