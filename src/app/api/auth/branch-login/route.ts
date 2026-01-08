import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        console.log('Branch login attempt for:', email);
        const branch = await Branch.findOne({ email }).lean();

        if (!branch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // In a real app, compare hashed passwords.
        if (password !== branch.password) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const cookieStore = await cookies();
        const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

        session.user = {
            id: branch._id.toString(),
            email: branch.email,
            isAdmin: false, // Branches are not admins
        };
        await session.save();

        return NextResponse.json({
            message: 'Login successful',
            branchId: branch._id,
            name: branch.name
        }, { status: 200 });

    } catch (error) {
        console.error('Branch login error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
