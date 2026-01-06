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

        // Check for the last attendance record of the day to determine IN/OUT
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const lastAttendance = await Attendance.findOne({
            memberId,
            branchId: session.user.id,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ timestamp: -1 }); // Get the latest one

        // Determine new status
        let newType = 'IN'; // Default to IN if no record exists
        if (lastAttendance && lastAttendance.type === 'IN') {
            newType = 'OUT';
        }

        // Optional: Prevent double scanning (e.g., if scanned again within 1 minute)
        if (lastAttendance) {
            const timeDiff = new Date().getTime() - new Date(lastAttendance.timestamp).getTime();
            if (timeDiff < 60 * 1000) { // 1 minute cooldown
                return NextResponse.json({
                    success: false,
                    message: `Already checked ${lastAttendance.type} recently. Please wait a moment.`
                });
            }
        }

        const newAttendance = await Attendance.create({
            memberId,
            branchId: session.user.id,
            confidence,
            status: status || 'Present',
            type: newType,
            timestamp: new Date()
        });

        // Fetch member name for response message
        return NextResponse.json({
            success: true,
            attendance: newAttendance,
            type: newType,
            message: newType === 'IN' ? `Welcome, ${member.fullName}` : `Goodbye, ${member.fullName}`
        });

    } catch (error: any) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
