"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io as ioClient, type Socket } from "socket.io-client";
import { Users, Copy, Check, MessageCircle, Send, LogOut, Play, Pause, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchPartyProps {
  title: string;
  poster?: string;
  type: "movie" | "tv" | "anime";
  tmdbId?: number;
  anilistId?: number;
  season?: number;
  episode?: number;
}

interface ChatMessage {
  socketId: string;
  text: string;
  displayName: string;
  timestamp: number;
}

interface RoomState {
  roomId: string;
  state: any;
  isHost: boolean;
}

export function WatchPartyPanel(props: WatchPartyProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [peers, setPeers] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [connectionFailed, setConnectionFailed] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  // Connect socket
  useEffect(() => {
    // In dev (localhost:3000), connect directly to port 3003.
    // In prod (preview), use same origin with XTransformPort query param
    // which the Caddy gateway routes to port 3003.
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");

    const s = isDev
      ? ioClient("http://localhost:3003", {
          path: "/socket.io/",
          transports: ["websocket", "polling"],
        })
      : ioClient({
          path: "/socket.io/",
          query: { XTransformPort: "3003" },
          transports: ["websocket", "polling"],
        });

    // Defer setState to avoid cascading renders warning
    const handlers: Array<() => void> = [];
    s.on("connect", () => queueMicrotask(() => { setConnected(true); setConnectionFailed(false); }));
    s.on("disconnect", () => queueMicrotask(() => setConnected(false)));
    s.on("hello", (payload: { socketId: string }) => {
      queueMicrotask(() => setPeers([payload.socketId]));
    });
    s.on("room:created", (payload: { roomId: string; state: any }) => {
      queueMicrotask(() => setRoom({ roomId: payload.roomId, state: payload.state, isHost: true }));
    });
    s.on("room:joined", (payload: { roomId: string; state: any; isHost: boolean }) => {
      queueMicrotask(() => {
        setRoom({ roomId: payload.roomId, state: payload.state, isHost: payload.isHost });
        setSyncStatus(`Synced at ${Math.floor(payload.state.currentTime || 0)}s`);
      });
    });
    s.on("peer:joined", (payload: { socketId: string; displayName?: string }) => {
      queueMicrotask(() => setPeers((p) => Array.from(new Set([...p, payload.socketId]))));
    });
    s.on("peer:left", (payload: { socketId: string }) => {
      queueMicrotask(() => setPeers((p) => p.filter((id) => id !== payload.socketId)));
    });
    s.on("state:update", (payload: any) => {
      queueMicrotask(() => {
        setRoom((r) => r ? { ...r, state: payload } : r);
        setSyncStatus(`${payload.playing ? "Playing" : "Paused"} @ ${Math.floor(payload.currentTime || 0)}s`);
      });
    });
    s.on("chat:message", (msg: ChatMessage) => {
      queueMicrotask(() => setChat((c) => [...c, msg]));
    });
    s.on("room:closed", () => {
      queueMicrotask(() => {
        setRoom(null);
        setPeers([]);
        setSyncStatus("Room closed — host left");
      });
    });

    queueMicrotask(() => setSocket(s));

    // Connection timeout — if not connected within 5s, show failure message
    const timeout = setTimeout(() => {
      queueMicrotask(() => {
        setConnectionFailed((prev) => {
          // Only set failed if still not connected
          return !s.connected;
        });
      });
    }, 5000);

    return () => {
      clearTimeout(timeout);
      s.disconnect();
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat]);

  const createRoom = useCallback(() => {
    if (!socket) return;
    socket.emit("room:create", {
      title: props.title,
      poster: props.poster,
      type: props.type,
      tmdbId: props.tmdbId,
      anilistId: props.anilistId,
      season: props.season,
      episode: props.episode,
    });
  }, [socket, props]);

  const joinRoom = useCallback(() => {
    if (!socket || !joinCode.trim()) return;
    socket.emit("room:join", {
      roomId: joinCode.trim().toUpperCase(),
      displayName: displayName || "Anon",
    });
  }, [socket, joinCode, displayName]);

  const leaveRoom = useCallback(() => {
    if (!socket || !room) return;
    socket.emit("room:leave", { roomId: room.roomId });
    setRoom(null);
    setPeers([]);
    setChat([]);
    setSyncStatus("");
  }, [socket, room]);

  const sendChat = useCallback(() => {
    if (!socket || !room || !chatInput.trim()) return;
    socket.emit("chat:message", {
      roomId: room.roomId,
      text: chatInput.trim(),
      displayName: displayName || "Anon",
    });
    setChatInput("");
  }, [socket, room, chatInput, displayName]);

  const copyCode = useCallback(() => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [room]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Watch Party</h3>
          {connected && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {room ? `${peers.length} ${peers.length === 1 ? "viewer" : "viewers"}` : expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-3">
          {/* Status */}
          {connected ? (
            <div className="flex items-center gap-2 text-[11px] text-green-400">
              <Radio className="w-3 h-3 animate-pulse" />
              Connected to party server
            </div>
          ) : connectionFailed ? (
            <div className="text-[11px] text-yellow-400 space-y-1">
              <div>⚠️ Can't reach party server</div>
              <div className="text-[10px] text-muted-foreground">
                Watch Party requires the socket.io service (port 3003). In production, it routes via the gateway.
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-yellow-400">
              Connecting...
            </div>
          )}

          {!room ? (
            <>
              {/* Create / Join UI */}
              <div>
                <button
                  onClick={createRoom}
                  disabled={!connected}
                  className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5" />
                  Create Watch Party
                </button>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  Get a code to share with friends
                </p>
              </div>

              <div className="border-t border-border/40 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Have a code? Join a party
                </p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-sm uppercase font-mono text-center tracking-widest focus:outline-none focus:border-primary/60 mb-2"
                />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name (optional)"
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/60 text-sm focus:outline-none focus:border-primary/60 mb-2"
                />
                <button
                  onClick={joinRoom}
                  disabled={!connected || !joinCode.trim()}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/60 border border-border/60 text-xs font-bold hover:bg-primary/20 hover:border-primary/60 disabled:opacity-50 transition-colors"
                >
                  Join Party
                </button>
              </div>
            </>
          ) : (
            <>
              {/* In-room UI */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Room Code
                </span>
                <span className="font-mono text-base font-black tracking-widest text-primary flex-1">
                  {room.roomId}
                </span>
                <button
                  onClick={copyCode}
                  className="w-7 h-7 rounded-md bg-secondary/60 hover:bg-primary/30 flex items-center justify-center transition-colors"
                  aria-label="Copy room code"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Sync status */}
              {syncStatus && (
                <div className="text-[11px] text-muted-foreground text-center">
                  {syncStatus}
                </div>
              )}

              {/* Peers */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Watching:
                </span>
                <div className="flex -space-x-1.5">
                  {peers.slice(0, 8).map((id, i) => (
                    <div
                      key={id}
                      className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-neon-pink border-2 border-background flex items-center justify-center text-[9px] font-bold text-white"
                      title={id}
                    >
                      {String.fromCharCode(65 + (i % 26))}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {peers.length} {peers.length === 1 ? "viewer" : "viewers"}
                </span>
              </div>

              {/* Chat */}
              <div className="border-t border-border/40 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" />
                  Chat
                </p>
                <div
                  ref={chatRef}
                  className="max-h-32 overflow-y-auto space-y-1.5 mb-2 p-2 rounded-lg bg-secondary/30 border border-border/40"
                >
                  {chat.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/60 text-center py-2">
                      No messages yet. Say hi! 👋
                    </p>
                  ) : (
                    chat.map((msg, i) => (
                      <div key={i} className="text-[11px] flex gap-1.5">
                        <span className="font-bold text-primary shrink-0">
                          {msg.displayName}:
                        </span>
                        <span className="text-foreground/85 break-words">{msg.text}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChat();
                    }}
                    placeholder="Type a message..."
                    maxLength={200}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-secondary/50 border border-border/60 text-xs focus:outline-none focus:border-primary/60"
                  />
                  <button
                    onClick={sendChat}
                    disabled={!chatInput.trim()}
                    className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <button
                onClick={leaveRoom}
                className="w-full px-3 py-2 rounded-lg bg-destructive/15 text-destructive text-xs font-bold border border-destructive/30 hover:bg-destructive/25 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Leave Party
              </button>
            </>
          )}

          <p className="text-[10px] text-muted-foreground/60 text-center">
            Watch with friends in real-time. Sync playback + chat together.
          </p>
        </div>
      )}
    </div>
  );
}
