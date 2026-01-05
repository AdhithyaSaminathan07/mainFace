import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email for this admin.'],
        unique: true,
    },
    password: {
        type: String,
    },
});

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
