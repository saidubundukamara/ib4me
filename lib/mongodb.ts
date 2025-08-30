import { MongoClient } from "mongodb";

let uri = process.env.MONGO_URI || process.env.MONGODB_URI || "";

declare global {
   
  var _mongoClientPromise: Promise<MongoClient> | undefined;
   
  var __memoryMongo: { getUri: () => string; stop: () => Promise<boolean> } | undefined;
}

async function ensureUri(): Promise<string> {
  const isTestEnv = process.env.NODE_ENV === "test" || process.env.PLAYWRIGHT === "1";
  if (uri) return uri;
  if (isTestEnv) {
    if (!global.__memoryMongo) {
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      global.__memoryMongo = await MongoMemoryServer.create();
    }
    const mem = global.__memoryMongo!;
    uri = mem.getUri();
    return uri;
  }
  throw new Error("Please define MONGO_URI or MONGODB_URI in environment");
}

const clientPromise: Promise<MongoClient> = (async () => {
  const finalUri = await ensureUri();
  const client = new MongoClient(finalUri);
  const promise = global._mongoClientPromise || client.connect();
  if (process.env.NODE_ENV !== "production") {
    global._mongoClientPromise = promise;
  }
  return promise;
})();

export default clientPromise;
