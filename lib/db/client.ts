import { MongoClient, Db } from "mongodb"
import { cache } from "react"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

let client: MongoClient
let clientPromise: Promise<MongoClient>

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient
  _mongoDb?: Db
  _mongoClientPromise?: Promise<MongoClient>
}

if (!globalWithMongo._mongoClient) {
  globalWithMongo._mongoClient = new MongoClient(uri, options)
  globalWithMongo._mongoDb = globalWithMongo._mongoClient.db()

  let connectPromise: Promise<MongoClient> | null = null
  globalWithMongo._mongoClientPromise = new Proxy({} as Promise<MongoClient>, {
    get(target, prop) {
      if (!connectPromise) {
        connectPromise = globalWithMongo._mongoClient!.connect()
      }
      const val = Reflect.get(connectPromise, prop)
      return typeof val === "function" ? val.bind(connectPromise) : val
    },
  })
}

client = globalWithMongo._mongoClient!
const db: Db = globalWithMongo._mongoDb!
clientPromise = globalWithMongo._mongoClientPromise!

export const getDb = cache(async (): Promise<Db> => {
  const connectedClient = await clientPromise
  const database = connectedClient.db()
  const { initDatabase } = await import("./indexes")
  await initDatabase()
  return database
})

export { client, db, clientPromise }
export default clientPromise


