import mongoose from 'mongoose';

const MemberSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide full name'],
    },
    employeeId: {
        type: String,
        required: [true, 'Please provide employee ID'],
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
    },
    role: {
        type: String,
        default: 'Staff',
    },
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true,
    },
    shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shift',
        required: false, // Optional initially, but recommended
    },
    customStartTime: {
        type: String, // "HH:mm" - overrides shift start time
        required: false,
    },
    customEndTime: {
        type: String, // "HH:mm" - overrides shift end time
        required: false,
    },
    faceDescriptor: {
        type: [Number], // Store the 128 float descriptor
        required: true,
    },
    images: {
        type: [String], // Array of base64 strings or URLs
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Member || mongoose.model('Member', MemberSchema);
