import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { XIcon, LinkIcon, AlertCircleIcon, Link2Icon } from "lucide-react";
import toast from "react-hot-toast";

function JoinSessionModal({ isOpen, onClose }) {
  const [joinLink, setJoinLink] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  const extractSessionId = (link) => {
    if (!link || typeof link !== "string") return null;

    // Remove whitespace
    link = link.trim();

    // If it's just a sessionId (UUID or MongoDB ObjectId), return it
    if (/^[a-f0-9-]{36}$/i.test(link) || /^[a-f0-9]{24}$/i.test(link)) {
      return link;
    }

    // Try to extract from URL pattern: /join-session/{sessionId}
    const urlPattern = /\/join-session\/([a-f0-9-]{36}|[a-f0-9]{24})/i;
    const match = link.match(urlPattern);
    if (match) {
      return match[1];
    }

    // Try to extract from full URL
    try {
      const url = new URL(link);
      const pathParts = url.pathname.split("/");
      const joinIndex = pathParts.indexOf("join-session");
      if (joinIndex !== -1 && pathParts[joinIndex + 1]) {
        return pathParts[joinIndex + 1];
      }
    } catch {
      // Not a valid URL, try to extract sessionId from the string
      const sessionIdPattern = /([a-f0-9-]{36}|[a-f0-9]{24})/i;
      const match = link.match(sessionIdPattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const handleJoin = async () => {
    if (!joinLink.trim()) {
      toast.error("Please enter a join link");
      return;
    }

    setIsProcessing(true);

    try {
      const sessionId = extractSessionId(joinLink);
      
      if (!sessionId) {
        toast.error("Invalid join link. Please check the link and try again.");
        setIsProcessing(false);
        return;
      }

      // Navigate to join session page which will handle the joining
      navigate(`/join-session/${sessionId}`);
      onClose();
      setJoinLink("");
    } catch (error) {
      console.error("Error joining session:", error);
      toast.error("Failed to process join link");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setJoinLink("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card bg-base-100 shadow-2xl w-full max-w-md mx-4">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
                <LinkIcon className="size-5 text-white" />
              </div>
              <h2 className="text-2xl font-black">Join Session with Link</h2>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-ghost btn-sm btn-circle"
              disabled={isProcessing}
            >
              <XIcon className="size-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="size-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-base-content/80">
                <p className="font-semibold mb-1">How to join:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Get the join link from your host</li>
                  <li>Paste the link or session ID below</li>
                  <li>Click "Join Session" to start</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Input Field */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Join Link or Session ID</span>
            </label>
            <input
              type="text"
              placeholder="Paste join link here (e.g., https://.../join-session/abc123)"
              className="input input-bordered w-full font-mono text-sm"
              value={joinLink}
              onChange={(e) => setJoinLink(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing) {
                  handleJoin();
                }
              }}
              disabled={isProcessing}
              autoFocus
            />
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                You can paste the full link or just the session ID
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="btn btn-ghost flex-1"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              className="btn btn-primary flex-1"
              disabled={isProcessing || !joinLink.trim()}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Processing...
                </>
              ) : (
                <>
                  <Link2Icon className="size-4" />
                  Join Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinSessionModal;

