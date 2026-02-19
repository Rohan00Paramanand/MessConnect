import mongoose, { Schema } from 'mongoose';

const staffSchema = new Schema(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: 'User', 
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phoneNumber: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['Cook', 'Cleaner', 'Cashier', 'Manager'],
      required: true
    },

    joiningDate: {
      type: Date,
      default: Date.now
    },

    salary: {
      type: Number
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Optional: prevent duplicate phone per vendor
staffSchema.index({ phoneNumber: 1 }, { unique: true });

export default mongoose.model('Staff', staffSchema);
