import mongoose, { Schema } from 'mongoose';
const timeTableSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      set: (val) => {
        const d = new Date(val);
        d.setUTCHours(0, 0, 0, 0); // truncate time to ensure unique index works per day
        return d;
      }
    },

    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Evening Snack", "Dinner"],
      required: true
    },

    items: [
      {
        type: String,
        required: true,
        trim: true
      }
    ],

    mess: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true
    },

    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Prevent duplicate meal for same date and mess
timeTableSchema.index({ date: 1, mealType: 1, mess: 1 }, { unique: true });

export default mongoose.model('TimeTable', timeTableSchema);
