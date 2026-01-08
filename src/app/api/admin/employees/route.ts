import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Member from '@/models/Member';
import Attendance from '@/models/Attendance';
import Branch from '@/models/Branch'; // Ensure Branch model is registered

// Ensure DB connection (Next.js route handlers usually need this if not globally handled)
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/face-app');
};

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const branchId = searchParams.get('branchId');

        const query: any = {};
        if (branchId) {
            query.branchId = branchId;
        }

        // Fetch members with filter
        const members = await Member.find(query).populate('branchId', 'name').lean();

        // Get start and end of today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch attendance records for today
        const attendanceRecords = await Attendance.find({
            timestamp: { $gte: startOfDay, $lte: endOfDay }
        }).lean();

        // Map attendance to members
        const membersWithStatus = members.map((member: any) => {
            // Find attendance record for this member
            // We prioritize 'Present' or 'Late' over others if multiple records exist (e.g. IN/OUT)
            // If any record exists for today, they are effectively "Present" or at least "Checked In"
            // Let's look for the first record or specific 'IN' record.

            const records = attendanceRecords.filter(a => a.memberId.toString() === member._id.toString());

            let status = 'Absent';
            let checkInTime = null;
            let checkOutTime = null;

            if (records.length > 0) {
                // If there are records, determine status based on them.
                // Creating a simple logic: if any record says Present/Late, use that.
                const presentRecord = records.find(r => r.status === 'Present' || r.status === 'Late');
                status = presentRecord ? presentRecord.status : 'Absent';

                // Get check-in time (earliest IN)
                const inRecord = records
                    .filter(r => r.type === 'IN')
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())[0];

                if (inRecord) {
                    checkInTime = inRecord.timestamp;
                }
            }

            return {
                _id: member._id,
                fullName: member.fullName,
                employeeId: member.employeeId,
                branchName: member.branchId?.name || 'Unknown Branch',
                status,
                checkInTime,
                avatar: member.images && member.images.length > 0 ? member.images[0] : null
            };
        });

        return NextResponse.json({ success: true, employees: membersWithStatus });

    } catch (error) {
        console.error('Error fetching admin employees:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch employees' }, { status: 500 });
    }
}
