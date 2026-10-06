import mongoose, { Schema } from 'mongoose';

const messRequestSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a request title'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },

    category: {
      type: String,
      enum: {
        values: ['Equipment_Repair', 'Infrastructure_maintenance', 'Other'],
        message: '{VALUE} is not a valid request category'
      },
      required: [true, 'Please select a category']
    },

    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },

    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },

    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'],
      default: 'PENDING'
    },

    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
      default: null
    },

    image: {
      type: String,
      default: ''
    },

    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    mess: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true
    },

    college: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },

    adminRemarks: {
      type: String,
      default: '',
      trim: true
    },

    actionTakenBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    actionTakenAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup by college, mess, and status
messRequestSchema.index({ college: 1, status: 1 });
messRequestSchema.index({ vendor: 1, createdAt: -1 });
messRequestSchema.index({ mess: 1 });

const MessRequest = mongoose.model('MessRequest', messRequestSchema);

export default MessRequest;
