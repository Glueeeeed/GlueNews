import { Server } from 'socket.io';
export function isNicknameInRoom(io: Server, room: string, nickname: string): boolean {
    const roomSet = io.of('/').adapter.rooms.get(room);
    if (!roomSet) return false;
    for (const socketId of roomSet) {
        const sock = io.sockets.sockets.get(socketId);
        if (!sock) continue;
        const sockNick = String((sock.handshake.query as any).nickname ?? '');
        if (sockNick === nickname) return true;
    }
    return false;
}