import { useCallback, useContext, useEffect } from "react";
import { WebSocketContext } from "@/contexts/WebSocketContext";

type MessageHandler = (data: any) => void;

interface UseWebSocketResult {
  status: "connecting" | "connected" | "disconnected";
  disconnectedSince: number | null;
  sendMessage: (message: unknown) => void;
}

export function useWebSocket(
  onMessage: MessageHandler,
  deps: any[] = []
): UseWebSocketResult {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }

  const onMessageWrapped = useCallback(onMessage, [deps]);

  useEffect(() => {
    return context.addMessageListener(onMessageWrapped);
  }, [context, onMessageWrapped]);

  return {
    status: context.status,
    disconnectedSince: context.disconnectedSince,
    sendMessage: context.sendMessage,
  };
}
