/**
 * Role-based authorization middleware
 * Ensures user has the required role to access a route
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // User should be attached by protectRoute middleware
      if (!req.user) {
        return res.status(401).json({ 
          message: "Unauthorized - user not authenticated" 
        });
      }

      const userRole = req.user.role;

      // Check if user role is in allowed roles array
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          message: `Forbidden - ${userRole} role does not have access to this resource. Required roles: ${allowedRoles.join(", ")}` 
        });
      }

      next();
    } catch (error) {
      console.error("Error in requireRole middleware:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
};

