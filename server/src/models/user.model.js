import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    role: {
      type: String,
      enum: ["student", "faculty", "vendor", "mess_committee", "admin", "super_admin"],
      required: true
    },

    phoneNumber: {
      type: String,
      required: true
    },

    department: String,
    branch: String,
    year: Number,
    companyName: String,

    messType: {
      type: String,
      enum: ['card', 'per-meal']
    },

    messAssigned: {
      type: String,
      enum: ['Adhik boys mess', 'Samruddhi Girls mess', 'New girls mess', 'None'],
      default: 'None'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isVerified: {
      type: Boolean,
      default: false
    },
    
    isApprovedByAdmin: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
