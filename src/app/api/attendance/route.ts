import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Attendance from '@/models/Attendance';
import Member from '@/models/Member';

// Hardcoded branch ID since auth is removed
const DEFAULT_BRANCH_ID = 'default-branch';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const body = await req.json();

        // Handle Member Registration (Add Attendance Page)
        if (body.faceDescriptor || body.fullName) {
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
                branchId: DEFAULT_BRANCH_ID,
                faceDescriptor,
                images
            });

            return NextResponse.json({ success: true, member: newMember });
        }

        // Handle Attendance Marking (Dashboard Page)
        const { memberId, confidence, status } = body;

        if (!memberId || !confidence) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify member belongs to this branch
        const member = await Member.findOne({ _id: memberId, branchId: DEFAULT_BRANCH_ID });

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Check for the last attendance record of the day to determine IN/OUT
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const lastAttendance = await Attendance.findOne({
            memberId,
            branchId: DEFAULT_BRANCH_ID,
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ timestamp: -1 }); // Get the latest one

        // Determine new status
        let newType = 'IN'; // Default to IN if no record exists
        if (lastAttendance && lastAttendance.type === 'IN') {
            newType = 'OUT';
        }

        // Optional: Prevent double scanning (e.g., if scanned again within 10 seconds)
        if (lastAttendance) {
            const timeDiff = new Date().getTime() - new Date(lastAttendance.timestamp).getTime();
            if (timeDiff < 10 * 1000) { // 10 seconds cooldown
                return NextResponse.json({
                    success: false,
                    message: `Already checked ${lastAttendance.type} recently. Please wait a moment.`
                });
            }
        }

        let attendanceStatus = status || 'Present';

        const newAttendance = await Attendance.create({
            memberId,
            branchId: DEFAULT_BRANCH_ID,
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
                ? `Checked IN: Welcome, ${member.fullName}`
                : `Checked OUT: Goodbye, ${member.fullName}`
        });

    } catch (error: any) {
        console.error('Error in attendance API:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const dateParam = searchParams.get('date');

        // Handle Member Listing (Dashboard needs face descriptors)
        if (action === 'members') {
            const members = await Member.find({ branchId: DEFAULT_BRANCH_ID })
                .select('fullName employeeId role faceDescriptor branchId images phone');

            return NextResponse.json({ success: true, members });
        }

        // If date param exists, return detailed list for that date
        if (dateParam) {
            const date = new Date(dateParam);
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            const allRecords = await Attendance.find({
                branchId: DEFAULT_BRANCH_ID,
                timestamp: { $gte: startOfDay, $lte: endOfDay }
            })
                .populate('memberId', 'fullName employeeId')
                .sort({ timestamp: -1 });

            return NextResponse.json({
                success: true,
                records: allRecords
            });
        }

        // Default: Stats for TODAY
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch all IN records for today for this branch
        const attendanceRecords = await Attendance.find({
            branchId: DEFAULT_BRANCH_ID,
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
