import { betterAuth } from "better-auth";
import { MongoClient, Db } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dns from "node:dns";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignore if DNS server configuration is restricted
}

const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  throw new Error("MONGODB_URI is required for Better Auth session validation");
}

const client = new MongoClient(mongoURI);
let dbPromise: Promise<Db> | null = null;

async function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = client.connect().then(() => client.db("EduJira"));
  }
  return dbPromise;
}

// Eager connect so getSession works on first request
getDb().catch((err) => {
  console.error("Failed to connect Better Auth Mongo client:", err);
});

/**
 * Minimal Better Auth instance for validating sessions created by the Next.js app.
 * Must share the same DB name, secret, and user.role field as the client.
 */
export const auth = betterAuth({
  database: mongodbAdapter(client.db("EduJira")),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.CLIENT_URL || "http://localhost:3000",
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});

export async function findAuthUserById(userId: string) {
  const db = await getDb();
  return db.collection("user").findOne({ id: userId });
}

export async function findAuthUserByEmail(email: string) {
  const db = await getDb();
  return db.collection("user").findOne({ email: email.toLowerCase() });
}
