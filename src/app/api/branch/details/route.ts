import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const branch = await Branch.findById(session.user.id).select('name email roles');

        if (!branch) {
            return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, branch });
    } catch (error: any) {
        console.error('Error fetching branch details:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
