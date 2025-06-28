import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: {
      type: String,
      required: true,
      trim: true
    },
    stake: {
      type: Number,
      required: true,
      min: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

const betSchema = new mongoose.Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  options: [optionSchema],
  deadline: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'settled'],
    default: 'open'
  },
  minStake: {
    type: Number,
    required: true,
    min: 0
  },
  maxStake: {
    type: Number,
    required: true,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  winningOption: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes
betSchema.index({ groupId: 1 });
betSchema.index({ status: 1 });
betSchema.index({ deadline: 1 });
betSchema.index({ createdBy: 1 });

export default mongoose.models.Bet || mongoose.model('Bet', betSchema); 