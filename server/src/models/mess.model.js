import mongoose, { Schema } from 'mongoose';

const messSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Mess', messSchema);
