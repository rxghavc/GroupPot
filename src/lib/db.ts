import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

function extractDbNameFromMongoUri(uri: string): string {
  const match = uri.match(/^(?:mongodb(?:\+srv)?:\/\/)(?:[^/]+)\/([^?]+)/i);
  return match?.[1]?.trim() ?? '';
}

export function isLikelyProductionMongoUri(uri: string): boolean {
  if (!uri) return false;

  const normalized = uri.toLowerCase();
  const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(normalized);
  if (isLocal) return false;

  const dbName = extractDbNameFromMongoUri(uri);
  const hasTestLikeDbName = /(test|testing|jest|ci|local)/i.test(dbName);

  const looksRemoteCluster =
    normalized.startsWith('mongodb+srv://') ||
    normalized.includes('mongodb.net') ||
    normalized.includes('cosmos.azure.com') ||
    normalized.includes('@');

  return looksRemoteCluster && !hasTestLikeDbName;
}

export function assertSafeMongoUriForTests(uri: string | undefined): void {
  if (process.env.NODE_ENV !== 'test') return;
  if (process.env.ALLOW_PROD_DB_IN_TESTS === 'true') return;
  if (!uri) return;

  if (isLikelyProductionMongoUri(uri)) {
    throw new Error(
      'Unsafe test DB configuration: The MONGODB_URI appears to point to a production/remote MongoDB cluster. I need to use a local/test URI or set ALLOW_PROD_DB_IN_TESTS=true only if I intentionally accept the risk.'
    );
  }
}

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

    assertSafeMongoUriForTests(MONGODB_URI);

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
