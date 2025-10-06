import mongoose from "mongoose";

// Prefer .MONGODB_URI, fallback .MONGO_URI
let MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

// Enhanced connection pooling configuration
const connectionOptions = {
  maxPoolSize: 20, // Increased from 10 to handle more concurrent connections
  serverSelectionTimeoutMS: 15000, // Increased from 5000ms to 15000ms for webhook reliability
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferCommands: false, // Disable buffering to fail fast instead of queuing
  family: 4, // Use IPv4, skip trying IPv6
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = global as any;
 
const cached = g.mongoose || { conn: null, promise: null };

// In-memory server holder for tests
let memoryServer: { getUri: () => string; stop: () => Promise<boolean> } | null =
  g.__memoryMongo || null;

async function ensureMemoryServer(): Promise<string> {
  if (memoryServer) return memoryServer.getUri();
  // Dynamically import to avoid bundling in production
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const server = await MongoMemoryServer.create();
  memoryServer = server;
  g.__memoryMongo = server;
  return server.getUri();
}

// Function to check if database is connected
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function connectDB() {
  const isTestEnv =
    process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT === "1";
  if (!MONGODB_URI && isTestEnv) {
    MONGODB_URI = await ensureMemoryServer();
  }
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env.local"
    );
  }

  // Return existing connection if available
  if (cached.conn && isConnected()) {
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('Establishing MongoDB connection...');
    cached.promise = mongoose
      .connect(MONGODB_URI as string, connectionOptions)
      .then((m) => {
        console.log('MongoDB connected successfully');
        return m;
      })
      .catch((error) => {
        // Surface connection errors quickly in tests
        console.error("Mongo connection error:", error);
        cached.promise = null; // Reset promise on error
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    g.mongoose = cached;
    return cached.conn;
  } catch (error) {
    cached.promise = null; // Reset promise on error
    throw error;
  }
}

// Function to ensure connection before operations with retry logic
export async function ensureConnection(retries = 3): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!isConnected()) {
        await connectDB();
      }
      return; // Success
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to establish database connection after ${retries} attempts`);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
