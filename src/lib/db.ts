import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    if (cached.conn) {
      return cached.conn.connection;
    }

    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        maxPoolSize: 5,
        minPoolSize: 0,
        maxIdleTimeMS: 10000,
        serverSelectionTimeoutMS: 5000,
      });
    }

    try {
      cached.conn = await cached.promise;
    } catch (error) {
      cached.promise = null;
      throw error;
    }
 
    console.log('Connected to MongoDB Atlas');
    return cached.conn.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default connectDB;
