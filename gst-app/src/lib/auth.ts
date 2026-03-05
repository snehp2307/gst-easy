import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';

export interface JwtPayload {
    userId: string;
    role: string;
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function signJwt(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        return null;
    }
}

export function getTokenFromRequest(req: NextRequest): string | null {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Also check cookies for SSR
    const cookieToken = req.cookies.get('token')?.value;
    return cookieToken || null;
}

export function getAuthUser(req: NextRequest): JwtPayload | null {
    const token = getTokenFromRequest(req);
    if (!token) return null;
    return verifyJwt(token);
}

export function jsonResponse(data: unknown, status = 200) {
    return Response.json(data, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
    return Response.json({ error: message, details }, { status });
}
