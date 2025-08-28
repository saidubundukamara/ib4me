import mongoose from "mongoose";

// Prefer .MONGODB_URI, fallback .MONGO_URI
let MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const g = global as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cached = g.mongoose || { conn: null, promise: null };

// In-memory server holder for tests
let memoryServer: { getUri: () => string; stop: () => Promise<void> } | null =
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

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((m) => m)
      .catch((error) => {
        // Surface connection errors quickly in tests
        console.error("Mongo connection error:", error);
        throw error;
      });
  }
  cached.conn = await cached.promise;
  g.mongoose = cached;
  return cached.conn;
}
