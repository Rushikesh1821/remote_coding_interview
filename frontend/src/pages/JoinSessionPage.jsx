import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useJoinSession, useSessionById } from "../hooks/useSessions";
import { useUserRole } from "../hooks/useUserRole";
import Navbar from "../components/Navbar";
import { Loader2Icon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";
import toast from "react-hot-toast";

function JoinSessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { role } = useUserRole();
  const [isJoining, setIsJoining] = useState(false);

  const { data: sessionData, isLoading: loadingSession, error: sessionError } = useSessionById(sessionId);
  const joinSessionMutation = useJoinSession();

  const session = sessionData?.session;

  // Redirect if not signed in
  useEffect(() => {
    if (!isSignedIn && user === null) {
      navigate("/");
    }
  }, [isSignedIn, user, navigate]);

  // Redirect if not a participant
  useEffect(() => {
    if (role && role !== "participant") {
      toast.error("Only participants can join sessions");
      navigate(role === "host" ? "/host/dashboard" : "/dashboard");
    }
  }, [role, navigate]);

  // Auto-join session if valid
  useEffect(() => {
    if (!session || loadingSession || isJoining) return;
    if (session.status === "ended") {
      toast.error("Session not found or expired");
      setTimeout(() => navigate("/participant/dashboard"), 2000);
      return;
    }

    // Check if user is already the participant
    if (session.participant?.clerkId === user?.id) {
      // Already joined, redirect to session
      navigate(`/participant/session/${sessionId}`);
      return;
    }

    // Check if session is full
    if (session.participant) {
      toast.error("Session is full");
      setTimeout(() => navigate("/participant/dashboard"), 2000);
      return;
    }

    // Auto-join if session is waiting or active
    if (session.status === "waiting" || session.status === "active") {
      setIsJoining(true);
      joinSessionMutation.mutate(sessionId, {
        onSuccess: () => {
          toast.success("Joined session successfully!");
          navigate(`/participant/session/${sessionId}`);
        },
        onError: (error) => {
          toast.error(error.response?.data?.message || "Failed to join session");
          setTimeout(() => navigate("/participant/dashboard"), 2000);
        },
        onSettled: () => {
          setIsJoining(false);
        },
      });
    }
  }, [session, loadingSession, sessionId, user, navigate, joinSessionMutation, isJoining]);

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
            <p className="text-lg">Loading session...</p>
          </div>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="card bg-base-100 shadow-xl max-w-md">
            <div className="card-body items-center text-center">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircleIcon className="w-12 h-12 text-error" />
              </div>
              <h2 className="card-title text-2xl">Session Not Found</h2>
              <p className="text-base-content/70 mb-4">Session not found or expired</p>
              <button className="btn btn-primary" onClick={() => navigate("/participant/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === "ended") {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="card bg-base-100 shadow-xl max-w-md">
            <div className="card-body items-center text-center">
              <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircleIcon className="w-12 h-12 text-error" />
              </div>
              <h2 className="card-title text-2xl">Session Ended</h2>
              <p className="text-base-content/70 mb-4">This session has ended</p>
              <button className="btn btn-primary" onClick={() => navigate("/participant/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
          <p className="text-lg">Joining session...</p>
          <p className="text-sm text-base-content/60 mt-2">Please wait</p>
        </div>
      </div>
    </div>
  );
}

export default JoinSessionPage;

