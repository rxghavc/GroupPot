import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }
    
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectDB;
