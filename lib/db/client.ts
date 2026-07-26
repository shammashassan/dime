import { MongoClient, Db } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient
  _mongoDb?: Db
}

if (!globalWithMongo._mongoClient) {
  globalWithMongo._mongoClient = new MongoClient(uri, options)
  globalWithMongo._mongoDb = globalWithMongo._mongoClient.db()
}

const client: MongoClient = globalWithMongo._mongoClient
const db: Db = globalWithMongo._mongoDb as Db

export { client, db }

