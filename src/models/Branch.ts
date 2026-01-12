import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
    branchId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
    },
    location: {
        latitude: {
            type: Number,
        },
        longitude: {
            type: Number,
        },
        radius: {
            type: Number,
            default: 100
        }
    },
    ipSettings: {
        address: {
            type: String,
        },
        enabled: {
            type: Boolean,
            default: false
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);
