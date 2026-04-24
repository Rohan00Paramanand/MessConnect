import mongoose, { Schema } from 'mongoose';

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: false,
      lowercase: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: false
    },
    otp: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300 // Document automatically deleted after 5 minutes (300 seconds)
    }
  }
);

export default mongoose.model('Otp', otpSchema);
