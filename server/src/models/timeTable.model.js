import mongoose, { Schema } from 'mongoose';

const timeTableSchema = new Schema(
  {
    date: {
      type: Date,
      required: true
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

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Prevent duplicate meal for same date
timeTableSchema.index({ date: 1, mealType: 1 }, { unique: true });

export default mongoose.model('TimeTable', timeTableSchema);
