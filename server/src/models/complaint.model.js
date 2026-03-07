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
      enum: ["pending", "assigned", "resolved", "rejected"],
      default: "pending"
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }

  },
  { timestamps: true }
);

// Indexes for faster filtering
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedTo: 1 });

export default mongoose.model('Complaint', complaintSchema);
