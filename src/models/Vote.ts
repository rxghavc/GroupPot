import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  betId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bet',
    required: true
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  stake: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  username: {
    type: String
  }
});

voteSchema.index({ userId: 1 });
voteSchema.index({ betId: 1 });
voteSchema.index({ optionId: 1 });

export default mongoose.models.Vote || mongoose.model('Vote', voteSchema); 