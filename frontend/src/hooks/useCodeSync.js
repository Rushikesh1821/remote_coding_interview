import { useEffect, useRef, useState } from "react";

/**
 * Hook for real-time code and language synchronization using Stream.io channel
 * - Participant: Sends code and language updates to channel
 * - Host: Receives code and language updates from channel (read-only)
 */
export function useCodeSync(channel, isParticipant, initialCode = "", initialLanguage = "javascript", sessionId) {
  const [syncedCode, setSyncedCode] = useState(initialCode);
  const [syncedLanguage, setSyncedLanguage] = useState(initialLanguage);
  const [isParticipantTyping, setIsParticipantTyping] = useState(false);
  const lastSentCodeRef = useRef(initialCode);
  const lastSentLanguageRef = useRef(initialLanguage);
  const debounceTimerRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Initialize: Get current code from channel state if available
  useEffect(() => {
    if (!channel || isInitializedRef.current) return;

    // Wait for channel to be ready
    if (!channel.state) {
      // Channel not ready yet, wait a bit
      const timer = setTimeout(() => {
        const channelData = channel.state?.custom;
        if (channelData?.code) {
          setSyncedCode(channelData.code);
          lastSentCodeRef.current = channelData.code;
        } else {
          setSyncedCode(initialCode);
          lastSentCodeRef.current = initialCode;
        }
        if (channelData?.language) {
          setSyncedLanguage(channelData.language);
          lastSentLanguageRef.current = channelData.language;
        } else {
          setSyncedLanguage(initialLanguage);
          lastSentLanguageRef.current = initialLanguage;
        }
        isInitializedRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }

    // Try to get code and language from channel's custom data
    const channelData = channel.state?.custom;
    if (channelData?.code) {
      setSyncedCode(channelData.code);
      lastSentCodeRef.current = channelData.code;
    } else {
      // If no code in channel, set initial code
      setSyncedCode(initialCode);
      lastSentCodeRef.current = initialCode;
    }
    
    if (channelData?.language) {
      setSyncedLanguage(channelData.language);
      lastSentLanguageRef.current = channelData.language;
    } else {
      setSyncedLanguage(initialLanguage);
      lastSentLanguageRef.current = initialLanguage;
    }

    isInitializedRef.current = true;
  }, [channel, initialCode, initialLanguage]);

  // Listen for code updates from other users (for HOST)
  useEffect(() => {
    if (!channel || isParticipant) return; // Only hosts listen

    console.log("Host: Setting up code sync listeners on channel:", channel.id);

    const handleCodeUpdate = (event) => {
      try {
        console.log("Host: Received event:", event);
        
        // Stream.io event structure: event.event contains the custom event data
        const eventData = event?.event || event?.data || event;
        
        if (!eventData) {
          console.warn("Host: Received event with no data:", event);
          return;
        }

        console.log("Host: Event data:", eventData);

        // Check if this is a code update event
        if (eventData.type === "code:update") {
          if (eventData.code !== undefined) {
            console.log("Host: Received code update, length:", eventData.code.length);
            setSyncedCode(eventData.code);
            setIsParticipantTyping(false);
          }
          // Also update language if included
          if (eventData.language !== undefined) {
            console.log("Host: Received language update:", eventData.language);
            setSyncedLanguage(eventData.language);
          }
        } else if (eventData.type === "language:update" && eventData.language !== undefined) {
          console.log("Host: Received language update:", eventData.language);
          setSyncedLanguage(eventData.language);
        } else if (eventData.type === "code:typing") {
          console.log("Host: Participant is typing");
          setIsParticipantTyping(true);
          // Reset typing indicator after 2 seconds
          setTimeout(() => setIsParticipantTyping(false), 2000);
        }
      } catch (error) {
        console.error("Host: Error handling code update event:", error, event);
      }
    };

    // Listen to channel events - Stream.io uses event.created for custom events
    channel.on("event.created", handleCodeUpdate);
    channel.on("event.updated", handleCodeUpdate);
    
    // Also listen to channel state changes (for custom data updates)
    const handleStateChange = () => {
      const channelData = channel.state?.custom;
      if (channelData?.code) {
        console.log("Host: Channel state updated with code");
        setSyncedCode(channelData.code);
      }
      if (channelData?.language) {
        console.log("Host: Channel state updated with language:", channelData.language);
        setSyncedLanguage(channelData.language);
      }
    };
    
    channel.on("channel.updated", handleStateChange);

    // Poll channel custom data periodically as a fallback (in case events don't work)
    const pollInterval = setInterval(() => {
      const channelData = channel.state?.custom;
      if (channelData?.code) {
        setSyncedCode((currentCode) => {
          if (currentCode !== channelData.code) {
            console.log("Host: Polling detected code change");
            return channelData.code;
          }
          return currentCode;
        });
      }
      if (channelData?.language) {
        setSyncedLanguage((currentLang) => {
          if (currentLang !== channelData.language) {
            console.log("Host: Polling detected language change:", channelData.language);
            return channelData.language;
          }
          return currentLang;
        });
      }
    }, 500); // Poll every 500ms as fallback

    return () => {
      channel.off("event.created", handleCodeUpdate);
      channel.off("event.updated", handleCodeUpdate);
      channel.off("channel.updated", handleStateChange);
      clearInterval(pollInterval);
    };
  }, [channel, isParticipant]);

  // Send code updates (for PARTICIPANT only)
  // Security: Stream.io channels require authentication, and only channel members can send events.
  // Frontend validation prevents hosts from calling this function (isParticipant check).
  // Backend validation is handled by Stream.io's authentication system.
  const sendCodeUpdate = (newCode) => {
    if (!channel || !isParticipant) return; // Only participants can send - frontend validation

    // Debounce: Only send if code actually changed
    if (newCode === lastSentCodeRef.current) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce updates (send every 300ms max)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Send code update event via Stream.io
        // Stream.io sendEvent expects the event data directly
        const eventData = {
          type: "code:update",
          code: newCode,
          language: lastSentLanguageRef.current, // Include current language
          sessionId: sessionId,
          senderRole: "participant",
          timestamp: Date.now(),
        };
        
        console.log("Participant: Sending code update, length:", newCode.length);
        await channel.sendEvent(eventData);
        console.log("Participant: Code update event sent successfully");

        // Also update channel custom data for persistence (so host can get it on refresh)
        // This is important as it allows the host to see the code even if events fail
        try {
          await channel.updatePartial({
            set: {
              code: newCode,
              language: lastSentLanguageRef.current,
              codeUpdatedAt: Date.now(),
            },
          });
          console.log("Participant: Channel custom data updated");
        } catch (updateError) {
          // updatePartial might fail if user doesn't have permission, that's okay
          console.warn("Participant: Could not update channel custom data:", updateError);
        }

        lastSentCodeRef.current = newCode;
      } catch (error) {
        console.error("Participant: Error sending code update:", error);
      }
    }, 300);
  };

  // Send language update (for PARTICIPANT only)
  const sendLanguageUpdate = async (newLanguage) => {
    if (!channel || !isParticipant) return;
    if (newLanguage === lastSentLanguageRef.current) return; // No change

    try {
      const eventData = {
        type: "language:update",
        language: newLanguage,
        sessionId: sessionId,
        senderRole: "participant",
        timestamp: Date.now(),
      };
      
      console.log("Participant: Sending language update:", newLanguage);
      await channel.sendEvent(eventData);
      
      // Also update channel custom data
      try {
        await channel.updatePartial({
          set: {
            language: newLanguage,
            languageUpdatedAt: Date.now(),
          },
        });
        console.log("Participant: Language updated in channel custom data");
      } catch (updateError) {
        console.warn("Participant: Could not update language in channel custom data:", updateError);
      }
      
      lastSentLanguageRef.current = newLanguage;
    } catch (error) {
      console.error("Participant: Error sending language update:", error);
    }
  };

  // Send typing indicator (for PARTICIPANT only)
  const sendTypingIndicator = async () => {
    if (!channel || !isParticipant) return;

    try {
      await channel.sendEvent({
        type: "code:typing",
        sessionId: sessionId,
        senderRole: "participant",
      });
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    syncedCode,
    syncedLanguage,
    sendCodeUpdate,
    sendLanguageUpdate,
    sendTypingIndicator,
    isParticipantTyping,
    setSyncedCode, // Allow manual updates
    setSyncedLanguage, // Allow manual updates
  };
}

