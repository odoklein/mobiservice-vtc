import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-min-32-chars-long'
);

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
    return hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
    password: string,
    hashedPassword: string
): Promise<boolean> {
    return compare(password, hashedPassword);
}

/**
 * Generate a JWT token for an admin user
 */
export async function generateToken(adminId: number, email: string): Promise<string> {
    const token = await new SignJWT({ adminId, email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Token expires in 7 days
        .sign(JWT_SECRET);

    return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<{ adminId: number; email: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return {
            adminId: payload.adminId as number,
            email: payload.email as string,
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get admin user from request cookies
 */
export async function getAdminFromRequest(): Promise<{ adminId: number; email: string } | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
        return null;
    }

    return verifyToken(token);
}

/**
 * Set admin authentication cookie
 */
export async function setAdminCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });
}

/**
 * Clear admin authentication cookie
 */
export async function clearAdminCookie() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
}
