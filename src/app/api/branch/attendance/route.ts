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
        const member = await Member.findOne({ _id: memberId, branchId: session.user.id })
            .populate('shiftId');

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

        let attendanceStatus = status || 'Present';

        // Calculate Late status if checking IN
        if (newType === 'IN') {
            const now = new Date();
            let expectedStartStr = member.customStartTime;

            if (!expectedStartStr && member.shiftId) {
                expectedStartStr = member.shiftId.startTime;
            }

            if (expectedStartStr) {
                const [targetHour, targetMinute] = expectedStartStr.split(':').map(Number);
                const targetTime = new Date();
                targetTime.setHours(targetHour, targetMinute, 0, 0);

                // Add grace period if needed (e.g., 5 minutes)
                const gracePeriodMinutes = 5;
                targetTime.setMinutes(targetTime.getMinutes() + gracePeriodMinutes);

                if (now > targetTime) {
                    attendanceStatus = 'Late';
                }
            }
        }

        const newAttendance = await Attendance.create({
            memberId,
            branchId: session.user.id,
            confidence,
            status: attendanceStatus,
            type: newType,
            timestamp: new Date()
        });

        // Fetch member name for response message
        return NextResponse.json({
            success: true,
            attendance: newAttendance,
            type: newType,
            message: newType === 'IN'
                ? `Welcome, ${member.fullName}${attendanceStatus === 'Late' ? ' (Late)' : ''}`
                : `Goodbye, ${member.fullName}`
        });

    } catch (error: any) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');

        // If date param exists, return detailed list for that date
        if (dateParam) {
            const date = new Date(dateParam);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const records = await Attendance.find({
                branchId: session.user.id,
                timestamp: { $gte: startOfDay, $lte: endOfDay }
            })
                .populate('memberId', 'fullName employeeId')
                .sort({ timestamp: -1 });

            return NextResponse.json({
                success: true,
                records
            });
        }

        // Default: Stats for TODAY
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all IN records for today for this branch
        const attendanceRecords = await Attendance.find({
            branchId: session.user.id,
            timestamp: { $gte: startOfDay, $lte: endOfDay },
            type: 'IN'
        });

        // Calculate counts
        const presentMemberIds = new Set();
        const lateMemberIds = new Set();

        attendanceRecords.forEach((record: any) => {
            presentMemberIds.add(record.memberId.toString());
            if (record.status === 'Late') {
                lateMemberIds.add(record.memberId.toString());
            }
        });

        return NextResponse.json({
            success: true,
            stats: {
                present: presentMemberIds.size,
                late: lateMemberIds.size
            }
        });

    } catch (error: any) {
        console.error('Error fetching attendance stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
