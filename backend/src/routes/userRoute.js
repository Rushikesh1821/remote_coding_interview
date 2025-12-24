import express from "express";
import { requireAuth } from "@clerk/express";
import { protectRoute } from "../middlewear/protectRoute.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// Get current user info including role
// Auto-creates user if they don't exist in DB (for first-time login)
router.get("/me", requireAuth(), async (req, res) => {
  try {
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    const clerkId = auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized - invalid token" });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        message: "Database connection unavailable. Please try again in a moment." 
      });
    }

    // Try to find user in DB
    let user = await User.findOne({ clerkId }).maxTimeMS(5000);

    // If user doesn't exist, create them (auto-registration)
    // This handles the case when user signs in but webhook hasn't created them yet
    if (!user) {
      // Create user with minimal data - the webhook will update it later with full details
      // Use a temporary email based on clerkId, webhook will update it
      const tempEmail = `user_${clerkId}@temp.local`;
      
      try {
        user = await User.create({
          clerkId,
          email: tempEmail,
          name: "User", // Will be updated by webhook
          profileImage: "",
          role: "participant", // Default role, will be updated by frontend if needed
        });
        
        console.log("Auto-created user in database with clerkId:", clerkId);
      } catch (createError) {
        // If creation fails (e.g., duplicate), try to find again
        if (createError.code === 11000) {
          user = await User.findOne({ clerkId }).maxTimeMS(5000);
        } else {
          throw createError;
        }
      }
    }

    res.status(200).json({ user: user.toObject({ transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }}) });
  } catch (error) {
    console.error("Error in getMe:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update user role (for role selection during login)
router.patch("/role", protectRoute, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["host", "participant"].includes(role)) {
      return res.status(400).json({ 
        message: "Invalid role. Must be 'host' or 'participant'" 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      message: "Role updated successfully",
      user 
    });
  } catch (error) {
    console.error("Error in updateRole:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;

