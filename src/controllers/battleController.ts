import {Response, Request} from 'express';
import db from '../configs/database.ts';
import crypto from 'crypto';

interface getSessionRequest {
    data: string;
}

interface getSessionResponse {
    sessionBattleID: string;
    uuid: string;
}


interface battleRoomParams {
    sessionID: string;
}

interface battleRoomQuery {
    user: string;
}

export const createBattleSession = async (req: Request<{}, {}, getSessionRequest>, res: Response<getSessionResponse | {error: string}>) : Promise<void> => {
    const input : string = req.body.data;
    const auth = (req as any).auth;
    if (!auth?.isAuthenticated) {
         res.status(400).json({ error: "Autoryzacja wymagana" });
         return;
    }

    const userID : any = auth?.userId;
    const sessionID : string = crypto.randomBytes(8).toString('base64url');

    await db.execute('INSERT INTO battle_sessions (sessionID, input, A_uuid, B_uuid) VALUES (?,?,?,?)', [sessionID, input, userID, null]);
    res.status(200).json({ sessionBattleID: sessionID, uuid: userID });

}

export const battleRoom = async (req: Request<battleRoomParams, {}, {}, battleRoomQuery>, res: Response) : Promise<void> => {
    const {sessionID} = req.params;
    const {user} = req.query;
    const auth = (req as any).auth;

    const [sessionData] = await db.execute('SELECT * FROM battle_sessions WHERE sessionID = ?', [sessionID]);
    const data : any = (sessionData as any[])[0];
    if ((sessionData as any[]).length <= 0) {
        res.status(404).send('Nie znaleziono sesji walki');
        return;
    }
    const userID : any = auth?.userId;


    const userData = {
        role: '',
        username: '',
        uuid: '',
    }

    if (!user) {
        userData.role = 'spectator';
        userData.username = 'Spectator' + Math.floor(Math.random() * 9999);
        userData.uuid = userID || null;
    } else {
        const [userInfo] = await db.execute('SELECT * FROM users WHERE uuid = ?', [user]);
        const userDataInfo = (userInfo as any[])[0];


        if (!auth?.isAuthenticated || user !== userID) {
            res.status(403).send('Nieautoryzowany dostęp – zły użytkownik');
            return;
        }

        if (data.A_uuid === user || data.B_uuid === user) {
            userData.role = 'player';
            userData.username = userDataInfo.username;
            userData.uuid = user;
        } else {
            userData.role = 'spectator';
            userData.username = userDataInfo.username;
            userData.uuid = user;
        }
    }


    res.render('battle', {
        sessionID: sessionID,
        user: userData,
        sessionData: data,
    })

}

export const initializeBattleRoom = async (req: Request<battleRoomParams, {}, {},{}>,res: Response) : Promise<void> => {
    const {sessionID} = req.params;
    const auth = (req as any).auth;
    const userID : any = auth?.userId;
    const [sessionInfo] = await db.execute('SELECT * FROM battle_sessions WHERE sessionID = ?', [sessionID]);
    if ((sessionInfo as any[]).length <= 0) {
        res.status(400).send('Nie znaleziono sesji walki');
        return
    }
    const data : any = (sessionInfo as any[])[0];
    let isLoggedIn: boolean = false;
    if (auth?.isAuthenticated) {
        isLoggedIn = true;
    }
    if (data.B_uuid === null && isLoggedIn) {
        await db.execute('UPDATE battle_sessions SET B_uuid = ? WHERE sessionID = ?', [userID, sessionID]);
        res.status(200);
        res.redirect(`http://localhost:2137/api/battle/rooms/${sessionID}/?user=${userID}`);
        return;
    } else if (data.B_uuid === null && !isLoggedIn) {
        res.status(400).send('Autoryzacja wymagana. Musisz sie zalogowac aby dołaczyc do walki!');
        return;
    }

    if (data.B_uuid !== null) {
        res.status(200);
        res.redirect(`http://localhost:2137/api/battle/rooms/${sessionID}`);
        return;
    }



}


