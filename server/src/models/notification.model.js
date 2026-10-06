import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'COMPLAINT_STATUS',
        'COMPLAINT_ASSIGNED',
        'SLA_NUDGE',
        'FEEDBACK',
        'VISIT_SCHEDULED',
        'MAINTENANCE_REQUEST',
        'SYSTEM'
      ],
      default: 'SYSTEM'
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Compound index for fast retrieval of unread notifications for a user ordered by date
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
