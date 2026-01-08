import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import dbConnect from '@/lib/db';
import Shift from '@/models/Shift';

import Member from '@/models/Member';

// GET all shifts for the logged-in branch
export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();
        console.log('Session in GET /shifts:', JSON.stringify(session, null, 2));

        if (!session.user || !session.user.id) {
            console.log('Unauthorized: No user in session');
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const branchId = session.user.id;

        // Check if any shifts exist for this branch
        const existingShiftsCount = await Shift.countDocuments({ branchId });

        if (existingShiftsCount === 0) {
            // Seed default shifts
            const defaultShifts = [
                { name: 'Morning', startTime: '06:00', endTime: '14:00', branchId },
                { name: 'Afternoon', startTime: '14:00', endTime: '22:00', branchId },
                { name: 'Evening', startTime: '16:00', endTime: '00:00', branchId },
                { name: 'Night', startTime: '22:00', endTime: '06:00', branchId },
            ];
            await Shift.insertMany(defaultShifts);
        }

        const shifts = await Shift.find({ branchId });

        // Fetch members for each shift to display on the card
        const shiftsWithMembers = await Promise.all(shifts.map(async (shift) => {
            const members = await Member.find({
                shiftId: shift._id,
                branchId
            }).select('fullName _id images');

            return {
                ...shift.toObject(),
                members
            };
        }));

        return NextResponse.json({ success: true, shifts: shiftsWithMembers });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

// POST create a new shift
export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const session = await getSession();

        if (!session.user || !session.user.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { name, startTime, endTime } = await req.json();

        if (!name || !startTime || !endTime) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const newShift = await Shift.create({
            name,
            startTime,
            endTime,
            branchId: session.user.id,
        });

        return NextResponse.json({ success: true, shift: newShift, message: 'Shift created successfully' });
    } catch (error) {
        console.error('Error creating shift:', error);
        return NextResponse.json({ success: false, error: 'Failed to create shift' }, { status: 500 });
    }
}
