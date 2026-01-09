import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

// Reuse the same hardcoded ID
const DEFAULT_BRANCH_ID = 'default-branch';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { latitude, longitude, radius } = body;

        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Latitude and Longitude are required' },
                { status: 400 }
            );
        }

        const updatedBranch = await Branch.findOneAndUpdate(
            { branchId: DEFAULT_BRANCH_ID },
            {
                $set: {
                    location: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        radius: parseFloat(radius) || 100
                    },
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({
            success: true,
            message: 'Location updated successfully',
            data: updatedBranch
        });

    } catch (error: any) {
        console.error('Error updating location:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const branch = await Branch.findOne({ branchId: DEFAULT_BRANCH_ID });

        if (!branch) {
            return NextResponse.json({
                success: true,
                data: null
            });
        }

        return NextResponse.json({
            success: true,
            data: branch.location
        });

    } catch (error: any) {
        console.error('Error fetching location:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
