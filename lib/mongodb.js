import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please add MONGODB_URI to your Environment Variables");
}

const options = {
  maxPoolSize: 10,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 20000,
};

let clientPromise;

// Reuse one client across serverless invocations. On Vercel the module can
// stay warm between requests, so caching the connect() promise on globalThis
// avoids reconnecting every time — a big latency win and fewer Atlas ops.
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export const DB_NAME = "endline2026";

export async function getDb() {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

export default clientPromise;
