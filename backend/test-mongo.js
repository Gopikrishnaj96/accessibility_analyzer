const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log("Testing connection with URI:", uri);

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    const db = client.db("accessibility-analyzer");
    const collection = db.collection("tests");
    const result = await collection.insertOne({test: "Connection test", date: new Date()});
    console.log("Inserted document:", result);
  } catch (err) {
    console.error("Connection error:", err);
  } finally {
    await client.close();
  }
}

run();
