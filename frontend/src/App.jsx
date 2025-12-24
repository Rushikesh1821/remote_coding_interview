import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import JoinSessionPage from "./pages/JoinSessionPage";
import { useUserRole } from "./hooks/useUserRole";

function App() {
  const { isSignedIn, isLoaded } = useUser();
  const { role, roleQuery } = useUserRole();

  // Show loading only if Clerk is loading OR if signed in and role is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading...</p>
        </div>
      </div>
    );
  }

  // If signed in and role query is still loading (and not errored), show loading state
  // But if it's errored or has been loading for too long, don't block - show the dashboard anyway
  // This prevents the app from being stuck in a loading state if the user doesn't exist in DB
  if (isSignedIn && roleQuery.isLoading && !roleQuery.isError && !roleQuery.isFetched) {
    // Only show loading if we haven't fetched yet (first load)
    // After first fetch (success or error), always render
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading user data...</p>
        </div>
      </div>
    );
  }

  // If there's an error fetching role but user is signed in, still show the app
  // (the dashboard will handle the missing role gracefully)
  // Don't block rendering on role query errors - user might not exist in DB yet

  const getDashboardRedirect = () => {
    if (!isSignedIn) return <Navigate to="/" />;
    // If role query failed or role is null, show generic dashboard
    if (!role || roleQuery.isError) {
      return <DashboardPage />;
    }

    if (role === "host") return <Navigate to="/host/dashboard" />;
    if (role === "participant") return <Navigate to="/participant/dashboard" />;
    return <DashboardPage />;
  };

  const getDashboardElementForRole = (requiredRole) => {
    if (!isSignedIn) return <Navigate to="/" />;
    // If role query failed or role is null, show generic dashboard
    if (!role || roleQuery.isError) {
      return <DashboardPage />;
    }

    if (role !== requiredRole) {
      // Prevent cross-role access
      return <Navigate to={role === "host" ? "/host/dashboard" : "/participant/dashboard"} />;
    }

    return <DashboardPage />;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : getDashboardRedirect()} />

        {/* Legacy generic dashboard route keeps working */}
        <Route path="/dashboard" element={getDashboardRedirect()} />

        {/* Role-specific dashboards */}
        <Route path="/host/dashboard" element={getDashboardElementForRole("host")} />
        <Route path="/participant/dashboard" element={getDashboardElementForRole("participant")} />

        <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to="/" />} />
        <Route path="/problem/:id" element={isSignedIn ? <ProblemPage /> : <Navigate to="/" />} />
        
        {/* Join session route - participant only */}
        <Route 
          path="/join-session/:sessionId" 
          element={isSignedIn ? <JoinSessionPage /> : <Navigate to="/" />} 
        />
        
        {/* Session routes - role-based */}
        <Route 
          path="/session/:id" 
          element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />} 
        />
        <Route 
          path="/host/session/:id" 
          element={isSignedIn && role === "host" ? <SessionPage /> : <Navigate to={"/"} />} 
        />
        <Route 
          path="/participant/session/:id" 
          element={isSignedIn && role === "participant" ? <SessionPage /> : <Navigate to={"/"} />} 
        />
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
