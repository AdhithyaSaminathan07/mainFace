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
        const { shiftId, memberIds } = body;

        if (!shiftId || !Array.isArray(memberIds)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const branchId = session.user.id;

        // 1. Assign shift to selected members
        await Member.updateMany(
            { _id: { $in: memberIds }, branchId },
            { $set: { shiftId: shiftId } }
        );

        // 2. Remove shift from members NOT in the selection but currently assigned to this shift
        // This ensures unchecking a member removes them from the shift
        await Member.updateMany(
            { shiftId: shiftId, _id: { $nin: memberIds }, branchId },
            { $unset: { shiftId: 1 } }
        );

        return NextResponse.json({ success: true, message: 'Shift assignments updated' });

    } catch (error: any) {
        console.error('Error assigning shift:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
