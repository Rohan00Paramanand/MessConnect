import mongoose, { Schema } from 'mongoose';

const invitationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      // Removed unique constraint — uniqueness of pending invitations is
      // enforced at the application level (deleteMany on pending before insert).
      // Keeping unique here would prevent re-inviting someone to a different
      // college after their first (accepted) invitation was cleaned up.
      lowercase: true,
      trim: true
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    isAccepted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// TTL index: MongoDB automatically deletes expired+unaccepted invitation documents.
// Set expireAfterSeconds: 0 means MongoDB uses the expiresAt field value exactly.
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Invitation', invitationSchema);
