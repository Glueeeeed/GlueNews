import { x25519 } from '@noble/curves/ed25519.js';
import { Secrets } from '../controllers/keyExchangeController.ts';

interface keyPairOutput {
    public: Uint8Array;
    secret: Uint8Array;
}

interface keyExchangeOutput {
    sharedSecret: string;
}

export function generateKeyPair() : keyPairOutput {
  const serverKeyPair = x25519.keygen()
  return { public: serverKeyPair.publicKey, secret: serverKeyPair.secretKey };
}

export function computeSharedSecret(serverSecretKey: Uint8Array, clientPublicKey: Uint8Array): keyExchangeOutput {
    const sharedSecret = x25519.getSharedSecret(serverSecretKey, clientPublicKey);
    const shared = Buffer.from(sharedSecret).toString('hex');
    return { sharedSecret: shared };
}

export const getSlicedSecret = (sessionID: string): string => {
    const secret : string | undefined = Secrets.get(sessionID);
    if (!secret) {
        throw new Error('Invalid session ID');
    }
    return secret;
};

export const deleteSecret = (sessionID: string) : void => {
    try {
        if (Secrets.delete(sessionID)) {
            console.log(`Secret for session ID ${sessionID} deleted successfully.`);
        } else {
            throw new Error('Invalid session ID');
        }
    } catch (error) {
        console.log(error);
    }
}



console.log()
