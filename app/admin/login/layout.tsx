export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    console.log('[LOGIN LAYOUT] Rendering - no auth check here');
    return <>{children}</>;
}
