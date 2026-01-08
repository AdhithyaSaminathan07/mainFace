import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name for this branch.'],
        unique: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide an email for this branch.'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password for this branch.'],
    },
    roles: {
        type: [String],
        default: [],
        required: [true, 'At least one role is required.'], // Optional: enforce at least one role? Let's make it optional but default empty is fine, or enforced. Plan said "roles: [String]". Let's stick to simple array first.
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
