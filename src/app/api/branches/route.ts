import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

export async function GET() {
    try {
        await dbConnect();
        const branches = await Branch.find({}).sort({ createdAt: -1 });
        return NextResponse.json(branches);
    } catch (error) {
        console.error('Fetch branches error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { name, email, password, roles } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Name, Email, and Password are required' }, { status: 400 });
        }

        const branch = await Branch.create({ name, email, password, roles: roles || [] });
        return NextResponse.json(branch, { status: 201 });
    } catch (error: any) {
        console.error('Create branch error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ message: 'Branch already exists' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
