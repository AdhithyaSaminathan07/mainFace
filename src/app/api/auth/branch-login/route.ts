import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        console.log('Branch login attempt for:', email);
        const branch = await Branch.findOne({ email });

        if (!branch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // In a real app, compare hashed passwords.
        if (password !== branch.password) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

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
