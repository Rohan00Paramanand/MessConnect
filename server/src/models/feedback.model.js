import mongoose, { Schema } from 'mongoose';

const feedbackSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    date: {
      type: Date,
      required: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Prevent duplicate feedback per day per user
feedbackSchema.index(
  { user: 1, date: 1 },
  { unique: true }
);

export default mongoose.model('Feedback', feedbackSchema);
