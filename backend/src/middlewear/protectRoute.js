import { requireAuth } from "@clerk/express";
import mongoose from "mongoose";
import User from "../models/User.js";

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      // ✅ FIX: req.auth() is a function in newer Clerk versions
      const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
      const clerkId = auth?.userId;

      if (!clerkId) {
        return res.status(401).json({ message: "Unauthorized - invalid token" });
      }

      // Check if MongoDB is connected
      if (mongoose.connection.readyState !== 1) {
        console.error("MongoDB not connected. ReadyState:", mongoose.connection.readyState);
        return res.status(503).json({ 
          message: "Database connection unavailable. Please try again in a moment." 
        });
      }

      // Find user in DB using Clerk ID with timeout
      const user = await User.findOne({ clerkId }).maxTimeMS(5000);

      if (!user) {
        return res.status(404).json({ message: "User not found. Please ensure you're registered." });
      }

      // Attach DB user to request
      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      
      // Handle MongoDB connection errors
      if (error.name === 'MongooseError' || error.name === 'MongoServerError') {
        return res.status(503).json({ 
          message: "Database connection error. Please try again." 
        });
      }
      
      res.status(500).json({ message: "Internal Server Error" });
    }
  },
];
