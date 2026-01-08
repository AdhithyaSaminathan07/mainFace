import mongoose from 'mongoose';

const ShiftSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a shift name (e.g., Morning, Night)'],
    },
    startTime: {
        type: String, // Format: "HH:mm"
        required: [true, 'Please provide start time'],
    },
    endTime: {
        type: String, // Format: "HH:mm"
        required: [true, 'Please provide end time'],
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Shift || mongoose.model('Shift', ShiftSchema);
