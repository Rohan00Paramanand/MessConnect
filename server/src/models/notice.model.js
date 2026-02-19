import mongoose, { Schema } from 'mongoose';

const noticeSchema = new Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
    },

    image: {
        type: String
    },

    targetRole: {
        type: String,
        enum: ['student', 'vendor', 'faculty', 'all'],
        default: 'all'
    },

    isActive: {
        type: Boolean,
        required: true,
        default: true
    },

    expiresAt: {
        type: Date,
    }
},
{timestamps: true});


export default mongoose.model('Notice', noticeSchema);