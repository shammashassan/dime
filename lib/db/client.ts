import { MongoClient, Db } from "mongodb"
import { cache } from "react"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

/**
 * Connection pool and timeout settings aligned with MongoDB Serverless (Vercel / Lambda) best practices:
 * - maxPoolSize: 5 (small pool per serverless instance to prevent connection storming when multiple lambdas scale out)
 * - minPoolSize: 0 (prevent keeping open/unused idle connections in frozen lambdas)
 * - maxIdleTimeMS: 30000 (30s: prune idle connections before Atlas/NAT drops them, avoiding stale socket reuse)
 * - serverSelectionTimeoutMS: 15000 (allow sufficient buffer for cold-start DNS SRV resolution and TLS handshakes with multi-node replica set)
 * - connectTimeoutMS: 15000 (fail-safe for initial socket connection)
 * - socketTimeoutMS: 45000 (ensure sockets are closed if server stops responding)
 */
const options = {
  maxPoolSize: 5,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient
  _mongoDb?: Db
  _mongoClientPromise?: Promise<MongoClient>
}

/**
 * Checks whether a given MongoClient has been closed or has its topology destroyed.
 */
export function isClientClosed(client?: MongoClient | null): boolean {
  if (!client) return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((client as any).s?.hasBeenClosed) return true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = (client as any).topology?.s?.state
  if (state === "closed" || state === "destroying") return true
  return false
}

/**
 * Invalidates and removes the current cached MongoClient from memory.
 */
export function invalidateClient() {
  if (globalWithMongo._mongoClient) {
    try {
      globalWithMongo._mongoClient.removeAllListeners("topologyClosed")
    } catch {
      // Ignore listener cleanup errors
    }
  }
  globalWithMongo._mongoClient = undefined
  globalWithMongo._mongoDb = undefined
  globalWithMongo._mongoClientPromise = undefined
}

/**
 * Returns a live, healthy MongoClient, reconnecting if the topology was closed.
 */
export function getClient(): MongoClient {
  if (!globalWithMongo._mongoClient || isClientClosed(globalWithMongo._mongoClient)) {
    invalidateClient()
    const newClient = new MongoClient(uri, options)

    // Automatically invalidate singleton if the topology closes
    newClient.on("topologyClosed", () => {
      if (globalWithMongo._mongoClient === newClient) {
        invalidateClient()
      }
    })

    const connectPromise = newClient.connect()
    // Catch on the background promise to invalidate client on failure and prevent unhandled rejection crashes
    connectPromise.catch(() => {
      if (globalWithMongo._mongoClient === newClient) {
        invalidateClient()
      }
    })

    globalWithMongo._mongoClient = newClient
    globalWithMongo._mongoDb = newClient.db()
    globalWithMongo._mongoClientPromise = connectPromise
  }

  return globalWithMongo._mongoClient
}

/**
 * Returns the underlying Db instance for the current live client.
 */
export function getRawDb(): Db {
  const currentClient = getClient()
  if (!globalWithMongo._mongoDb || isClientClosed(currentClient)) {
    globalWithMongo._mongoDb = currentClient.db()
  }
  return globalWithMongo._mongoDb
}

/**
 * Dynamic Proxy for Db that always dispatches to the healthy, active database instance.
 */
export const db: Db = new Proxy({} as Db, {
  get(target, prop, receiver) {
    const activeDb = getRawDb()
    const val = Reflect.get(activeDb, prop, receiver)
    return typeof val === "function" ? val.bind(activeDb) : val
  },
})

/**
 * Dynamic Proxy for MongoClient that always dispatches to the healthy, active client instance.
 */
export const client: MongoClient = new Proxy({} as MongoClient, {
  get(target, prop, receiver) {
    const activeClient = getClient()
    const val = Reflect.get(activeClient, prop, receiver)
    return typeof val === "function" ? val.bind(activeClient) : val
  },
})

/**
 * Dynamic Proxy for clientPromise that always resolves to the active connection promise.
 */
export const clientPromise: Promise<MongoClient> = new Proxy({} as Promise<MongoClient>, {
  get(target, prop, receiver) {
    getClient()
    const promise = globalWithMongo._mongoClientPromise!
    const val = Reflect.get(promise, prop, receiver)
    return typeof val === "function" ? val.bind(promise) : val
  },
})

export const getDb = cache(async (): Promise<Db> => {
  const connectedClient = await clientPromise
  const database = connectedClient.db()
  const { initDatabase } = await import("./indexes")
  await initDatabase()
  return database
})

export default clientPromise
