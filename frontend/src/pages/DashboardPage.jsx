import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { LinkIcon } from "lucide-react";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";
import { useUserRole } from "../hooks/useUserRole";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";
import JoinSessionModal from "../components/JoinSessionModal";
import HostSessionsList from "../components/HostSessionsList";
import ParticipantSessionsList from "../components/ParticipantSessionsList";

function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { role, roleQuery, updateRoleMutation } = useUserRole();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions, isError: activeSessionsError } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions, isError: recentSessionsError } = useMyRecentSessions();

  // Check if user is on host dashboard route (even if role is null, they might be a host)
  const isOnHostDashboard = location.pathname.includes("/host/dashboard");
  const isOnParticipantDashboard = location.pathname.includes("/participant/dashboard");
  
  // Check localStorage for desired role (set when user clicks "Login as Host")
  const desiredRole = typeof window !== "undefined" ? localStorage.getItem("desiredRole") : null;
  
  // Determine role: use actual role if available, otherwise infer from URL path or localStorage
  // If user is on host dashboard, show host features even if role hasn't been updated yet
  const isHost = role === "host" || (isOnHostDashboard || desiredRole === "host");
  const isParticipant = role === "participant" || (isOnParticipantDashboard && !isOnHostDashboard && desiredRole !== "host");
  
  // Handle errors gracefully - if queries fail, use empty arrays
  // Filter out ended sessions from active sessions - only show waiting and active sessions
  const activeSessions = (activeSessionsData?.sessions || []).filter(
    (session) => session.status !== "ended"
  );
  const recentSessions = recentSessionsData?.sessions || [];

  const handleCreateRoom = () => {
    if (!isHost) return;
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    createSessionMutation.mutate(
      {
        problem: roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          setRoomConfig({ problem: "", difficulty: "" });
          // Refresh sessions list
          if (activeSessionsData) {
            // Query will auto-refetch
          }
        },
      }
    );
  };

  const isUserInSession = (session) => {
    if (!user.id) return false;

    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  // While role is loading, keep simple loading state
  if (roleQuery.isLoading) {
    return (
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="mt-4 text-base-content/70">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error fetching role (e.g., user not in DB yet), still render dashboard
  // The dashboard will show a generic view until the user is created in the database
  if (roleQuery.isError) {
    console.warn("Dashboard - Error fetching role (user may not exist in DB yet):", roleQuery.error?.response?.status);
  }

  // Always render - even if there are errors
  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection
          onCreateSession={() => {
            if (isHost) {
              setShowCreateModal(true);
            }
          }}
          role={role}
          showCreateButton={isHost}
        />

        {/* Grid layout */}
        <div className="container mx-auto px-6 pb-16">
          {isHost ? (
            <>
              {/* HOST DASHBOARD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <StatsCards
                  activeSessionsCount={activeSessions.length}
                  recentSessionsCount={recentSessions.length}
                />
              </div>
              <div className="mb-6">
                <HostSessionsList sessions={activeSessions} isLoading={loadingActiveSessions} />
              </div>
              {recentSessions.length > 0 && (
                <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
              )}
            </>
          ) : isParticipant ? (
            <>
              {/* PARTICIPANT DASHBOARD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <StatsCards
                  activeSessionsCount={activeSessions.length}
                  recentSessionsCount={recentSessions.length}
                />
              </div>
              {/* Join Session Button */}
              <div className="mb-6">
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="btn btn-primary btn-lg w-full mb-4 gap-2"
                >
                  <LinkIcon className="size-5" />
                  Join Session with Link
                </button>
              </div>
              {recentSessions.length > 0 && (
                <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
              )}
            </>
          ) : (
            <>
              {/* FALLBACK - Generic dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <StatsCards
                  activeSessionsCount={activeSessions.length}
                  recentSessionsCount={recentSessions.length}
                />
                <ActiveSessions
                  sessions={activeSessions}
                  isLoading={loadingActiveSessions}
                  isUserInSession={isUserInSession}
                />
              </div>
              <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
            </>
          )}
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />

      <JoinSessionModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  );
}

export default DashboardPage;
