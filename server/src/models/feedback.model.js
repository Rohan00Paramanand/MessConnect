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
      required: true,
      set: (val) => {
        const d = new Date(val);
        d.setUTCHours(0, 0, 0, 0); // truncate time to ensure unique index works per day
        return d;
      }
    },

    ratings: [
      {
        category: {
          type: String,
          enum: [
            "food",
            "cleanliness",
            "timeliness",
            "taste",
            "staff behaviour",
            "other"
          ],
          required: true
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          required: true
        }
      }
    ],

    comment: {
      type: String
    },
    
    mess: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true
    },
    
    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    }
  },
  { timestamps: true }
);

// Prevent duplicate feedback per day per user per mess
feedbackSchema.index(
  { user: 1, date: 1, mess: 1 },
  { unique: true }
);

export default mongoose.model('Feedback', feedbackSchema);
