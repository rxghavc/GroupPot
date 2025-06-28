import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenExpiry: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// No need to create indexes manually since unique: true already creates them
// userSchema.index({ email: 1 }); // Removed - duplicate of unique: true
// userSchema.index({ username: 1 }); // Removed - duplicate of unique: true

export default mongoose.models.User || mongoose.model('User', userSchema); 