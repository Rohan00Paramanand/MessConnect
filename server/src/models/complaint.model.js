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
      default: ''
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
      enum: ["pending", "assigned", "resolved", "rejected", "vendor_completed"],
      default: "pending"
    },

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    assignedAt: {
      type: Date
    },

    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },

    vendorCompletedAt: {
      type: Date
    },

    resolvedAt: {
      type: Date
    },
    
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },

    resolutionProof: {
      image: {
        type: String
      },
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      submittedAt: {
        type: Date
      },
      remarks: {
        type: String,
        default: ''
      }
    },

    resolutionFeedback: {
      rating: {
        type: String,
        enum: ['satisfied', 'unsatisfied']
      },
      comment: {
        type: String,
        default: ''
      },
      submittedAt: {
        type: Date
      }
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

    upvotes: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],

    rejectionReason: {
      type: String,
      enum: ["duplicate", "wrong_category", "spam", "false_information", "inappropriate", null]
    }

  },
  { timestamps: true }
);

// Indexes for faster filtering
complaintSchema.index({ status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ assignedBy: 1 });
complaintSchema.index({ resolvedBy: 1 });

export default mongoose.model('Complaint', complaintSchema);
