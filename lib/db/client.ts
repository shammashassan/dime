import { MongoClient, Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

let client: MongoClient
let db: Db

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClient?: MongoClient
    _mongoDb?: Db
  }

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = new MongoClient(uri)
    globalWithMongo._mongoDb = globalWithMongo._mongoClient.db()
  }
  client = globalWithMongo._mongoClient
  db = globalWithMongo._mongoDb as Db
} else {
  client = new MongoClient(uri)
  db = client.db()
}

export { client, db }
