import { createServer } from "http";
import { Server } from "socket.io";

const PORT = 3003;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/socket.io/",
});

interface RoomState {
  hostId: string;
  playing: boolean;
  currentTime: number;
  updatedAt: number;
  // party meta
  title?: string;
  poster?: string;
  type?: "movie" | "tv" | "anime";
  tmdbId?: number;
  anilistId?: number;
  season?: number;
  episode?: number;
}

const rooms = new Map<string, RoomState>();

function makeRoomCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getState(roomId: string): RoomState | undefined {
  const state = rooms.get(roomId);
  if (!state) return undefined;
  // Compute "effective" currentTime based on time elapsed since last update
  const elapsed = (Date.now() - state.updatedAt) / 1000;
  if (state.playing) {
    state.currentTime += elapsed;
  }
  state.updatedAt = Date.now();
  return state;
}

function broadcastState(roomId: string) {
  const state = getState(roomId);
  if (!state) return;
  io.to(roomId).emit("state:update", {
    roomId,
    playing: state.playing,
    currentTime: state.currentTime,
    title: state.title,
    poster: state.poster,
    type: state.type,
    tmdbId: state.tmdbId,
    anilistId: state.anilistId,
    season: state.season,
    episode: state.episode,
    updatedAt: state.updatedAt,
  });
}

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  socket.emit("hello", { socketId: socket.id });

  // Create a new room
  socket.on("room:create", (payload: { title?: string; poster?: string; type?: string; tmdbId?: number; anilistId?: number; season?: number; episode?: number; currentTime?: number }) => {
    const roomId = makeRoomCode();
    const state: RoomState = {
      hostId: socket.id,
      playing: false,
      currentTime: payload.currentTime || 0,
      updatedAt: Date.now(),
      title: payload.title,
      poster: payload.poster,
      type: payload.type as any,
      tmdbId: payload.tmdbId,
      anilistId: payload.anilistId,
      season: payload.season,
      episode: payload.episode,
    };
    rooms.set(roomId, state);
    socket.join(roomId);
    socket.emit("room:created", { roomId, state });
    console.log(`[room] created ${roomId} by ${socket.id}`);
  });

  // Join an existing room
  socket.on("room:join", (payload: { roomId: string; displayName?: string }) => {
    const roomId = (payload.roomId || "").toUpperCase();
    const state = rooms.get(roomId);
    if (!state) {
      socket.emit("error", { message: `Room ${roomId} not found` });
      return;
    }
    socket.join(roomId);
    socket.emit("room:joined", { roomId, state: getState(roomId), isHost: false });
    io.to(roomId).emit("peer:joined", { socketId: socket.id, displayName: payload.displayName });
    console.log(`[room] ${socket.id} joined ${roomId}`);
    broadcastState(roomId);
  });

  // Leave room
  socket.on("room:leave", (payload: { roomId: string }) => {
    socket.leave(payload.roomId);
    io.to(payload.roomId).emit("peer:left", { socketId: socket.id });
  });

  // Sync state changes (play, pause, seek, episode change)
  socket.on("state:sync", (payload: { roomId: string; playing?: boolean; currentTime?: number; title?: string; poster?: string; type?: string; tmdbId?: number; anilistId?: number; season?: number; episode?: number }) => {
    const roomId = (payload.roomId || "").toUpperCase();
    const state = rooms.get(roomId);
    if (!state) return;
    if (payload.playing !== undefined) state.playing = payload.playing;
    if (payload.currentTime !== undefined) state.currentTime = payload.currentTime;
    if (payload.title !== undefined) state.title = payload.title;
    if (payload.poster !== undefined) state.poster = payload.poster;
    if (payload.type !== undefined) state.type = payload.type as any;
    if (payload.tmdbId !== undefined) state.tmdbId = payload.tmdbId;
    if (payload.anilistId !== undefined) state.anilistId = payload.anilistId;
    if (payload.season !== undefined) state.season = payload.season;
    if (payload.episode !== undefined) state.episode = payload.episode;
    state.updatedAt = Date.now();
    broadcastState(roomId);
  });

  // Chat messages
  socket.on("chat:message", (payload: { roomId: string; text: string; displayName?: string }) => {
    io.to(payload.roomId).emit("chat:message", {
      socketId: socket.id,
      text: payload.text,
      displayName: payload.displayName || "Anon",
      timestamp: Date.now(),
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    // Remove rooms where this user was host
    for (const [roomId, state] of rooms.entries()) {
      if (state.hostId === socket.id) {
        io.to(roomId).emit("room:closed", { roomId, reason: "Host left" });
        rooms.delete(roomId);
      } else {
        // Notify others
        io.to(roomId).emit("peer:left", { socketId: socket.id });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`🎥 Watch Party service listening on port ${PORT}`);
});
