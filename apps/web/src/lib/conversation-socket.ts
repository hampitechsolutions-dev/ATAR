'use client';

import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
const SOCKET_BASE_URL = API_URL.replace(/\/api\/?$/, '');

let activeSocket: Socket | null = null;
let activeToken: string | null = null;

export function getConversationSocket(token: string) {
  if (typeof window === 'undefined') {
    throw new Error('El socket de conversaciones solo se puede usar en el navegador.');
  }

  if (activeSocket && activeToken === token) {
    return activeSocket;
  }

  activeSocket?.disconnect();

  activeSocket = io(`${SOCKET_BASE_URL}/conversations`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  });
  activeToken = token;

  return activeSocket;
}
