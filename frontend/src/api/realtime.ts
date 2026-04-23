import { resolveWebSocketBaseUrl } from "./network";
import type { RealtimeEnvelope, RealtimeEnvelopeType } from "../types";

let requestSequence = 0;

function nextRequestId(type: RealtimeEnvelopeType | (string & {})): string {
  requestSequence += 1;
  return `${String(type)}_${Date.now()}_${requestSequence}`;
}

export function buildRealtimeUrl(accessToken: string): URL {
  const url = new URL(
    resolveWebSocketBaseUrl({
      configuredApiBaseUrl: import.meta.env.VITE_API_BASE_URL as string | undefined,
      configuredWsBaseUrl: import.meta.env.VITE_WS_BASE_URL as string | undefined
    })
  );
  url.searchParams.set("token", accessToken);
  return url;
}

export function createChatWebSocket(accessToken: string): WebSocket {
  return new WebSocket(buildRealtimeUrl(accessToken));
}

export function createRealtimeEnvelope<TData>(
  type: RealtimeEnvelopeType | (string & {}),
  data: TData,
  options?: Pick<RealtimeEnvelope<TData>, "requestId" | "timestamp" | "traceId">
): RealtimeEnvelope<TData> {
  return {
    type,
    requestId: options?.requestId ?? nextRequestId(type),
    timestamp: options?.timestamp ?? Date.now(),
    traceId: options?.traceId,
    data
  };
}

export function sendEnvelope(socket: WebSocket, payload: unknown): boolean {
  if (socket.readyState !== WebSocket.OPEN) {
    return false;
  }
  const normalizedPayload =
    payload && typeof payload === "object" && "type" in (payload as Record<string, unknown>)
      ? createRealtimeEnvelope(
          String((payload as Record<string, unknown>).type) as RealtimeEnvelopeType | (string & {}),
          (payload as Record<string, unknown>).data,
          {
            requestId:
              typeof (payload as Record<string, unknown>).requestId === "string"
                ? ((payload as Record<string, unknown>).requestId as string)
                : undefined,
            timestamp:
              typeof (payload as Record<string, unknown>).timestamp === "number"
                ? ((payload as Record<string, unknown>).timestamp as number)
                : undefined,
            traceId:
              typeof (payload as Record<string, unknown>).traceId === "string"
                ? ((payload as Record<string, unknown>).traceId as string)
                : undefined
          }
        )
      : payload;
  socket.send(JSON.stringify(normalizedPayload));
  return true;
}
