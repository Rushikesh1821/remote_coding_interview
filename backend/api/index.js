import { app } from "../src/server.js";
import { connectDB } from "../src/lib/db.js";

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
