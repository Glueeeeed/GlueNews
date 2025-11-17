import {Response, Request} from 'express';
import db from '../configs/database.ts';
import crypto from 'crypto';

interface getSessionRequest {
    data: string;
}

interface getSessionResponse {
    sessionBattleID: string;
}

export const createBattleSession = async (req: Request<{}, {}, getSessionRequest>, res: Response<getSessionResponse | {error: string}>) : Promise<any> => {
    const input = req.body.data;
    const auth = (req as any).auth;
    if (!auth?.isAuthenticated) {
        return res.status(400).json({ error: "Autoryzacja wymagana" });
    }

    const userID : any = auth?.userId;
    const sessionID = crypto.randomBytes(8).toString('base64');

    await db.execute('INSERT INTO battle_sessions (sessionID, input, A_uuid, B_uuid) VALUES (?,?,?,?)', [sessionID, input, userID, null]);
    res.status(201).json({sessionBattleID: sessionID})



}