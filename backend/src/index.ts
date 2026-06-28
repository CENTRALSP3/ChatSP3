import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { SessionManager } from './SessionManager';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const sessions = new SessionManager();

// Health check
app.get('/', (_req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  let currentCode: string | null = null;
  let isAdmin = false;

  // ─── ADMIN ──────────────────────────────────────────
  socket.on('createRoom', (callback: (code: string) => void) => {
    const code = sessions.createSession();
    callback(code);
  });

  socket.on('adminLogin', (code: string, password: string, callback: (ok: boolean) => void) => {
    const session = sessions.get(code);
    if (!session) return callback(false);

    // Default password: "admin" – configurable in env later
    if (password !== (process.env.ADMIN_PASSWORD || 'admin')) return callback(false);

    currentCode = code;
    isAdmin = true;
    socket.join(`room:${code}`);
    socket.join(`admin:${code}`);
    callback(true);
    socket.emit('sessionState', sessions.getPublicState(code));
  });

  // ─── PARTICIPANT ────────────────────────────────────
  socket.on('joinRoom', (code: string, characterId: string, callback: (ok: boolean, reason?: string) => void) => {
    const result = sessions.addParticipant(code, characterId);
    if (!result.success) {
      return callback(false, result.reason);
    }

    currentCode = code;
    socket.join(`room:${code}`);
    socket.emit('sessionState', sessions.getPublicState(code));
    socket.emit('characterList', sessions.getAvailableCharacters(code));

    // Notify others
    io.to(`room:${code}`).emit('participantJoined', result.participant!);
    callback(true);
  });

  // ─── MESSAGES ───────────────────────────────────────
  socket.on('sendMessage', (text: string, emoji?: string) => {
    if (!currentCode) return;
    const participant = sessions.getParticipant(currentCode, socket.id);
    if (!participant) return;

    const msg = sessions.addMessage(currentCode, text, emoji, participant);
    if (!msg) return;

    // Broadcast to room (including sender)
    io.to(`room:${currentCode}`).emit('message', msg);

    // Combo detection
    const combo = sessions.checkCombo(currentCode, emoji);
    if (combo) {
      io.to(`room:${currentCode}`).emit('comboEvent', combo.emoji, combo.count);
    }
  });

  // ─── ADMIN CONTROLS ─────────────────────────────────
  socket.on('clearScreen', () => {
    if (!isAdmin || !currentCode) return;
    sessions.clear(currentCode);
    io.to(`room:${currentCode}`).emit('sessionCleared');
  });

  socket.on('startSession', () => {
    if (!isAdmin || !currentCode) return;
    sessions.setStatus(currentCode, 'active');
    io.to(`room:${currentCode}`).emit('sessionStatus', 'active');
  });

  socket.on('endSession', () => {
    if (!isAdmin || !currentCode) return;
    sessions.setStatus(currentCode, 'ended');
    io.to(`room:${currentCode}`).emit('sessionStatus', 'ended');
  });

  socket.on('resetCharacters', () => {
    if (!isAdmin || !currentCode) return;
    sessions.resetCharacters(currentCode);
    io.to(`room:${currentCode}`).emit('charactersReset');
  });

  socket.on('newRound', () => {
    if (!isAdmin || !currentCode) return;
    sessions.clear(currentCode);
    sessions.resetCharacters(currentCode);
    sessions.setStatus(currentCode, 'active');
    io.to(`room:${currentCode}`).emit('sessionCleared');
    io.to(`room:${currentCode}`).emit('charactersReset');
    io.to(`room:${currentCode}`).emit('sessionStatus', 'active');
  });

  socket.on('kickParticipant', (characterId: string) => {
    if (!isAdmin || !currentCode) return;
    sessions.removeParticipant(currentCode, characterId);
    io.to(`room:${currentCode}`).emit('participantLeft', characterId);
  });

  // ─── DISCONNECT ─────────────────────────────────────
  socket.on('disconnect', () => {
    if (currentCode) {
      const participant = sessions.getParticipantBySocket(currentCode, socket.id);
      if (participant) {
        sessions.removeParticipant(currentCode, participant.characterId);
        io.to(`room:${currentCode}`).emit('participantLeft', participant.characterId);
      }
    }
  });
});

const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, () => console.log(`Server on :${PORT}`));
