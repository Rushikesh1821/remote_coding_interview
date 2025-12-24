import {
  Code2Icon,
  CopyIcon,
  CheckIcon,
  CrownIcon,
  UsersIcon,
  LoaderIcon,
  ClockIcon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { getDifficultyBadgeClass } from "../lib/utils";
import toast from "react-hot-toast";

function HostSessionsList({ sessions, isLoading }) {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (sessionIdentifier) => {
    const joinLink = `${window.location.origin}/join-session/${sessionIdentifier}`;
    navigator.clipboard.writeText(joinLink).then(() => {
      setCopiedId(sessionIdentifier);
      toast.success("Join link copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "waiting":
        return (
          <span className="badge badge-warning badge-sm gap-1">
            <ClockIcon className="size-3" />
            Waiting
          </span>
        );
      case "active":
        return (
          <span className="badge badge-success badge-sm gap-1">
            <PlayIcon className="size-3" />
            Active
          </span>
        );
      case "ended":
        return (
          <span className="badge badge-error badge-sm gap-1">
            <XCircleIcon className="size-3" />
            Ended
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="card bg-base-100 border-2 border-primary/20 hover:border-primary/30 h-full">
      <div className="card-body">
        {/* HEADERS SECTION */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <CrownIcon className="size-5" />
            </div>
            <h2 className="text-2xl font-black">Active Sessions</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-2 bg-success rounded-full" />
            <span className="text-sm font-medium text-success">{sessions.filter(s => s.status !== "ended").length} active</span>
          </div>
        </div>

        {/* SESSIONS LIST */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderIcon className="size-10 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => {
              // Use sessionId if available, otherwise fallback to _id
              // sessionId is a UUID, _id is MongoDB ObjectId
              const sessionIdentifier = session.sessionId || session._id;
              
              // Debug: Log if sessionId is missing
              if (!session.sessionId && session._id) {
                console.warn("Session missing sessionId, using _id as fallback:", session._id);
              }
              
              const joinLink = sessionIdentifier 
                ? `${window.location.origin}/join-session/${sessionIdentifier}`
                : "";
              const isCopied = copiedId === sessionIdentifier;

              return (
                <div
                  key={session._id}
                  className="card bg-base-200 border-2 border-base-300 hover:border-primary/50"
                >
                  <div className="card-body p-5">
                    {/* SESSION HEADER */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative size-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                          <Code2Icon className="size-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-lg truncate">{session.problem}</h3>
                            <span
                              className={`badge badge-sm ${getDifficultyBadgeClass(
                                session.difficulty
                              )}`}
                            >
                              {session.difficulty.slice(0, 1).toUpperCase() +
                                session.difficulty.slice(1)}
                            </span>
                            {getStatusBadge(session.status)}
                          </div>
                          <div className="flex items-center gap-4 text-sm opacity-80">
                            <div className="flex items-center gap-1.5">
                              <UsersIcon className="size-4" />
                              <span className="text-xs">
                                {session.participant ? "2/2" : "1/2"} participants
                              </span>
                            </div>
                            {session.participant && (
                              <span className="text-xs">
                                Participant: {session.participant?.name || "Unknown"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* JOIN LINK SECTION */}
                    {session.status !== "ended" && sessionIdentifier && (
                      <div className="bg-base-100 rounded-lg p-4 border border-base-300">
                        <label className="label pb-2">
                          <span className="label-text font-semibold text-sm">
                            Share this link with participant:
                          </span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={joinLink}
                            className="input input-bordered input-sm flex-1 font-mono text-xs bg-base-200"
                            onClick={(e) => {
                              e.target.select();
                              e.target.setSelectionRange(0, 99999); // Select all for mobile
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            className={`btn btn-sm gap-2 ${
                              isCopied ? "btn-success" : "btn-primary"
                            }`}
                            onClick={() => copyToClipboard(sessionIdentifier)}
                            disabled={!sessionIdentifier}
                          >
                            {isCopied ? (
                              <>
                                <CheckIcon className="size-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <CopyIcon className="size-4" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    {session.status !== "ended" && !sessionIdentifier && (
                      <div className="bg-base-100 rounded-lg p-4 border border-warning/50">
                        <p className="text-sm text-warning">
                          ⚠️ Session ID missing. Please refresh the page.
                        </p>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex items-center gap-2 mt-3">
                      {session.status !== "ended" && (
                        <Link
                          to={`/host/session/${session._id}`}
                          className="btn btn-primary btn-sm flex-1 gap-2"
                        >
                          {session.status === "active" ? "Open Session" : "Start Session"}
                        </Link>
                      )}
                      {session.status === "ended" && (
                        <Link
                          to={`/host/session/${session._id}`}
                          className="btn btn-ghost btn-sm flex-1 gap-2"
                        >
                          View Details
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                <Code2Icon className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-lg font-semibold opacity-70 mb-1">No sessions yet</p>
              <p className="text-sm opacity-50">Create your first session to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HostSessionsList;

