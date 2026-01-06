import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present',
    },
    confidence: {
        type: Number,
        required: true, // Store the match confidence
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
