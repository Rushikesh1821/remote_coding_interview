import {
  Code2Icon,
  CrownIcon,
  UsersIcon,
  LoaderIcon,
  ArrowRightIcon,
  ClockIcon,
  PlayIcon,
  XCircleIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDifficultyBadgeClass } from "../lib/utils";

function ParticipantSessionsList({ sessions, isLoading }) {
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
              <UsersIcon className="size-5" />
            </div>
            <h2 className="text-2xl font-black">My Sessions</h2>
          </div>
        </div>

        {/* SESSIONS LIST */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderIcon className="size-10 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <div
                key={session._id}
                className="card bg-base-200 border-2 border-base-300 hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-4 p-5">
                  {/* LEFT SIDE */}
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
                          <CrownIcon className="size-4" />
                          <span className="font-medium">Host: {session.host?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {session.status !== "ended" ? (
                    <Link
                      to={`/participant/session/${session._id}`}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      {session.status === "active" ? "Open Session" : "View Session"}
                      <ArrowRightIcon className="size-4" />
                    </Link>
                  ) : (
                    <span className="badge badge-ghost badge-lg">Ended</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                <Code2Icon className="w-10 h-10 text-primary/50" />
              </div>
              <p className="text-lg font-semibold opacity-70 mb-1">No sessions yet</p>
              <p className="text-sm opacity-50">
                Join a session using an invite link from your host
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParticipantSessionsList;

