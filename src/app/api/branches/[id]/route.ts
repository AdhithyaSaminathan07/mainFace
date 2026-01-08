import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Branch from '@/models/Branch';

// In Next.js 15+, params is a Promise. 
// However, the user is on Next.js 16.1.1, so we should await params or treat it as a promise if the type demands it.
// Standard signature for modern Next.js routes with dynamic params:
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { name, email, password, roles } = await request.json();

        if (!id) return NextResponse.json({ message: 'Branch ID required' }, { status: 400 });

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (roles) updateData.roles = roles;

        const updatedBranch = await Branch.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedBranch) {
            return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json(updatedBranch);
    } catch (error) {
        console.error('Update branch error:', error);
        return NextResponse.json({ message: 'Error updating branch' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await dbConnect();
        const { id } = await params;

        if (!id) return NextResponse.json({ message: 'Branch ID required' }, { status: 400 });

        const deletedBranch = await Branch.findByIdAndDelete(id);

        if (!deletedBranch) {
            return NextResponse.json({ message: 'Branch not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Branch deleted successfully' });
    } catch (error) {
        console.error('Delete branch error:', error);
        return NextResponse.json({ message: 'Error deleting branch' }, { status: 500 });
    }
}
