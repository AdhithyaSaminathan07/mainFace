import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import Member from '@/models/Member';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { memberId, confidence, status } = body;

        if (!memberId || !confidence) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify member belongs to this branch
        const member = await Member.findOne({ _id: memberId, branchId: session.user.id });
        if (!member) {
            return NextResponse.json({ error: 'Member not found or does not belong to this branch' }, { status: 404 });
        }

        // Check if attendance already marked for today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
            memberId,
            branchId: session.user.id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingAttendance) {
            return NextResponse.json({ success: true, message: 'Attendance already marked for today', attendance: existingAttendance });
        }

        const newAttendance = await Attendance.create({
            memberId,
            branchId: session.user.id,
            confidence,
            status: status || 'Present',
            timestamp: new Date()
        });

        return NextResponse.json({ success: true, attendance: newAttendance });

    } catch (error: any) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
