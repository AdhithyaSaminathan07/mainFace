import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (session.user) {
        return NextResponse.json({
            isLoggedIn: true,
            ...session.user,
        });
    } else {
        return NextResponse.json({
            isLoggedIn: false,
        });
    }
}
