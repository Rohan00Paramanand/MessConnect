import mongoose, { Schema } from 'mongoose';

/**
 * MealPass Schema
 * Maintains a student's active meal credit balance and their biometric face descriptor.
 * 
 * Why store faceDescriptor here?
 * The 128-dimensional float array represents the unique facial embeddings
 * produced by the face-recognition neural network. Storing this vector allows 
 * the vendor scanner to compare face distances directly without processing raw image pixels on every scan.
 */
const mealPassSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true // Each student has one centralized meal pass
    },

    collegeId: {
      type: Schema.Types.ObjectId,
      ref: 'College',
      required: true
    },

    messAssigned: {
      type: Schema.Types.ObjectId,
      ref: 'Mess'
    },

    // Total meals currently remaining to be eaten
    remainingMeals: {
      type: Number,
      default: 0,
      min: [0, 'Remaining meals cannot be negative']
    },

    // Lifetime tally of meals purchased
    totalMealsPurchased: {
      type: Number,
      default: 0
    },

    // 128-d floating-point facial feature vector extracted by face-api
    faceDescriptor: {
      type: [Number],
      default: []
    },

    // Image preview URL / base64 string for vendor visual confirmation
    facePhoto: {
      type: String,
      default: ''
    },

    // Timestamp when face was registered or last updated
    faceRegisteredAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index to quickly fetch all enrolled students for a specific mess and college
mealPassSchema.index({ collegeId: 1, messAssigned: 1 });

export default mongoose.model('MealPass', mealPassSchema);
