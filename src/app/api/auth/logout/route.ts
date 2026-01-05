import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function POST(request: NextRequest) {
    const response = new NextResponse(JSON.stringify({ isLoggedIn: false }));
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    session.destroy();

    return response;
}
