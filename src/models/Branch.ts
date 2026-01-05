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
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
