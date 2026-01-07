import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/db';
import Member from '@/models/Member';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        // Ensure user is logged in as a branch
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { fullName, phone, role, employeeId, faceDescriptor, images } = body;

        // Basic validation
        if (!fullName || !employeeId || !faceDescriptor) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newMember = await Member.create({
            fullName,
            phone,
            role,
            employeeId,
            branchId: session.user.id, // Associate with logged-in branch
            faceDescriptor,
            images
        });

        return NextResponse.json({ success: true, member: newMember });

    } catch (error: any) {
        console.error('Error creating member:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const members = await Member.find({ branchId: session.user.id })
            .select('fullName employeeId role faceDescriptor branchId');

        return NextResponse.json({ success: true, members });
    } catch (error: any) {
        console.error('Error fetching members:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
        }

        const deletedMember = await Member.findOneAndDelete({
            _id: id,
            branchId: session.user.id
        });

        if (!deletedMember) {
            return NextResponse.json({ error: 'Member not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Member deleted successfully' });

    } catch (error: any) {
        console.error('Error deleting member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
