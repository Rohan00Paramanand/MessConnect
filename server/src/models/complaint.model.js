import mongoose, { Schema } from 'mongoose';

const complaintSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      required: true
    },

    image: String,

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

    status: {
      type: String,
      enum: ["pending", "resolved", "rejected"],
      default: "pending"
    }

  },
  { timestamps: true }
);

export default mongoose.model('Complaint', complaintSchema);
