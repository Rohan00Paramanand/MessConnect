import mongoose, { Schema } from 'mongoose';

const messVisitSchema = new Schema(
  {
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scheduledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    visitDate: {
      type: Date,
      required: true
    },
    purpose: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      default: '',
      trim: true
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'IN_REVIEW', 'COMPLETED', 'CANCELLED', 'DID_NOT_VISIT'],
      default: 'SCHEDULED',
      index: true
    },
    submission: {
      reportUrl: {
        type: String,
        default: null
      },
      reportType: {
        type: String,
        enum: ['pdf', 'image', null],
        default: null
      },
      messPhotoUrl: {
        type: String,
        default: null
      },
      remarks: {
        type: String,
        default: '',
        trim: true
      },
      submittedAt: {
        type: Date,
        default: null
      }
    },
    adminReview: {
      remarks: {
        type: String,
        default: '',
        trim: true
      },
      reviewedAt: {
        type: Date,
        default: null
      },
      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
      }
    }
  },
  { timestamps: true }
);

export default mongoose.model('MessVisit', messVisitSchema);
