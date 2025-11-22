/**
 * Key Exchange Controller Module
 *
 * This module implements the Diffie-Hellman key exchange protocol using elliptic curve
 * cryptography (P-256) to establish secure communication channels between clients and server.
 * It manages session secrets and provides encryption of the application base key.
 *
 * @module keyExchangeController
 */


import {Request, Response} from "express";
import crypto from "crypto";
import {computeSharedSecret, generateKeyPair} from "../services/keyExchangeService.ts";

interface KeyExchangeRequest {
    clientPublicKey: string;
}

interface KeyExchangeResponse {
    serverPublicKey: string;
    sessionID: string;
}


// In-memory storage for session secrets
 export const Secrets = new Map<string, string>();

export const  keyExchange = async (req: Request<{}, {}, KeyExchangeRequest>, res: Response<KeyExchangeResponse | { error: string }>): Promise<void> => {
    try {
        const clientPublicKey = req.body.clientPublicKey;
        if (!clientPublicKey) {
            res.status(400).json({ error: 'Invalid client public key' });
            return;
        }
        const uint8ClientPublicKey = Uint8Array.from(Buffer.from(clientPublicKey, 'hex'));
        const serverKeyPair = generateKeyPair();
        const sharedSecret = computeSharedSecret(serverKeyPair.secret, uint8ClientPublicKey);
        const sessionID = crypto.randomBytes(10).toString('base64');
        const serverKeyHex = Buffer.from(serverKeyPair.public).toString('hex');
        Secrets.set(sessionID, sharedSecret.sharedSecret.slice(0, 32));
        res.status(200).json({ serverPublicKey: serverKeyHex, sessionID: sessionID });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}