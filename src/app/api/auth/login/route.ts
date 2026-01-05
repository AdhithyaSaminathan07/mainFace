import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import dbConnect from '@/lib/db';
import Admin from '@/models/Admin';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        console.log('Login attempt for:', email);
        const admin = await Admin.findOne({ email });

        if (!admin) {
            console.log('Admin user not found in DB');
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        console.log('Admin found. Comparing passwords...');
        // In a real app, compare hashed passwords. 
        // For this task, we assume the seed sets a plain password or we compare directly.
        // Ideally use bcrypt.compare(password, admin.password)

        if (password !== admin.password) {
            console.log('Password mismatch. Provided:', password, 'Stored:', admin.password);
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const response = new NextResponse(JSON.stringify({ isAdmin: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

        const session = await getIronSession<SessionData>(request, response, sessionOptions);
        session.user = {
            id: admin._id.toString(),
            email: admin.email,
            isAdmin: true,
        };
        await session.save();

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
