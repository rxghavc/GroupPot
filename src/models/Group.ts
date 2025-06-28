import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  minStake: {
    type: Number,
    required: true,
    min: 0
  },
  maxStake: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Create indexes
groupSchema.index({ ownerId: 1 });
groupSchema.index({ members: 1 });

export default mongoose.models.Group || mongoose.model('Group', groupSchema); 