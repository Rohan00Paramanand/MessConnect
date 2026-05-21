import mongoose, { Schema } from 'mongoose';

const collegeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    allowedDomains: {
      type: [String],
      required: true,
      validate: {
        validator: function (domains) {
          return domains.length > 0;
        },
        message: 'At least one allowed domain is required'
      }
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('College', collegeSchema);
