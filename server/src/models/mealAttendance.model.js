import mongoose, { Schema } from 'mongoose';

/**
 * MealAttendance Schema
 * Stores historical log whenever a student gets marked present at the mess via face scan.
 */
const mealAttendanceSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
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

    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },

    mealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'General'],
      default: 'General'
    },

    remainingMealsAfter: {
      type: Number,
      required: true
    },

    verificationMethod: {
      type: String,
      enum: ['face_biometric', 'manual_override'],
      default: 'face_biometric'
    }
  },
  { timestamps: true }
);

// Indexes for fast attendance querying & daily mess stats
mealAttendanceSchema.index({ mess: 1, createdAt: -1 });
mealAttendanceSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model('MealAttendance', mealAttendanceSchema);
