import { useEffect, useRef, useCallback } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type MessageHandler = (payload: Record<string, unknown>) => void;

interface UseChannelOptions {
  channelName: string;
  onMessage: Record<string, MessageHandler>;
  enabled?: boolean;
}

export function useChannel({ channelName, onMessage, enabled = true }: UseChannelOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef(onMessage);
  handlersRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !channelName) return;

    const channel = supabase.channel(channelName);

    channel.on("broadcast", { event: "*" }, (msg) => {
      const handler = handlersRef.current[msg.event];
      if (handler) {
        handler(msg.payload as Record<string, unknown>);
      }
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [channelName, enabled]);

  const send = useCallback(async (event: string, payload: Record<string, unknown>) => {
    if (!channelRef.current) return;
    await channelRef.current.send({
      type: "broadcast",
      event,
      payload,
    });
  }, []);

  return { send };
}
