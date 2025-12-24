import express from "express";
import { protectRoute } from "../middlewear/protectRoute.js";
import { requireRole } from "../middlewear/requireRole.js";
import {
  createSession,
  endSession,
  getActiveSessions,
  getMyRecentSessions,
  getSessionById,
  joinSession,
} from "../controllers/sessionController.js";

const router = express.Router();

// Host-only routes
router.post("/", protectRoute, requireRole(["host"]), createSession);
router.post("/:id/end", protectRoute, requireRole(["host"]), endSession);

// Participant-only routes
router.post("/:id/join", protectRoute, requireRole(["participant"]), joinSession);

// Both roles can access these routes
router.get("/active", protectRoute, getActiveSessions);
router.get("/my-recent", protectRoute, getMyRecentSessions);
router.get("/by-session-id/:sessionId", protectRoute, getSessionById);
router.get("/:id", protectRoute, getSessionById);

export default router;
