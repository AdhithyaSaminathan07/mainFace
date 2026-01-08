import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import dbConnect from '@/lib/db';
import Shift from '@/models/Shift';

// PUT update a shift
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const session = await getIronSession<SessionData>(req, await NextResponse.next(), sessionOptions);

        if (!session.user || !session.user.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { name, startTime, endTime } = await req.json();

        const updatedShift = await Shift.findOneAndUpdate(
            { _id: id, branchId: session.user.id },
            { name, startTime, endTime },
            { new: true, runValidators: true }
        );

        if (!updatedShift) {
            return NextResponse.json({ success: false, error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, shift: updatedShift, message: 'Shift updated successfully' });
    } catch (error) {
        console.error('Error updating shift:', error);
        return NextResponse.json({ success: false, error: 'Failed to update shift' }, { status: 500 });
    }
}

// DELETE delete a shift
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const session = await getIronSession<SessionData>(req, await NextResponse.next(), sessionOptions);

        if (!session.user || !session.user.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const deletedShift = await Shift.findOneAndDelete({ _id: id, branchId: session.user.id });

        if (!deletedShift) {
            return NextResponse.json({ success: false, error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete shift' }, { status: 500 });
    }
}
