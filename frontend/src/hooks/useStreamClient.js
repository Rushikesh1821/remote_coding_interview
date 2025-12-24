import { useState, useEffect, useRef } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const hasJoinedRef = useRef(false);

  useEffect(() => {
    let videoCall = null;
    let chatClientInstance = null;

    const initCall = async () => {
      if (!session?.callId) return;
      if (!isHost && !isParticipant) return;
      if (session.status === "completed") return;
      if (hasJoinedRef.current) return; // Prevent duplicate joins

      try {
        hasJoinedRef.current = true;
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken();

        const client = await initializeStreamClient(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );

        setStreamClient(client);

        videoCall = client.call("default", session.callId);
        
        // Always join - Stream.io handles duplicate prevention
        // But check current state first to avoid unnecessary join
        try {
          const callState = await videoCall.get();
          const isAlreadyInCall = callState?.state?.participants?.some(
            (p) => p.userId === userId
          );
          
          if (!isAlreadyInCall) {
            console.log("Joining Stream.io call:", session.callId);
            await videoCall.join({ create: true });
          } else {
            console.log("Already in Stream.io call, reusing connection");
          }
        } catch (error) {
          // If get() fails, try joining anyway
          console.log("Could not get call state, joining:", session.callId);
          await videoCall.join({ create: true });
        }
        
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", session.callId);
        await chatChannel.watch();
        setChannel(chatChannel);
      } catch (error) {
        toast.error("Failed to join video call");
        console.error("Error init call", error);
      } finally {
        setIsInitializingCall(false);
      }
    };

    if (session && !loadingSession) initCall();

    // cleanup - performance reasons
    return () => {
      hasJoinedRef.current = false;
      // iife
      (async () => {
        try {
          if (videoCall) {
            await videoCall.leave();
          }
          if (chatClientInstance) {
            await chatClientInstance.disconnectUser();
          }
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [session?.callId, loadingSession, isHost, isParticipant]);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
  };
}

export default useStreamClient;
