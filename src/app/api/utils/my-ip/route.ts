import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Get IP from headers (standard for Next.js behind proxies/Vercel)
    let ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        '127.0.0.1'; // Fallback

    // If it's IPv6 localhost, convert to IPv4 for clarity
    if (ip === '::1') {
        ip = '127.0.0.1';
    }

    return NextResponse.json({
        success: true,
        ip
    });
}
