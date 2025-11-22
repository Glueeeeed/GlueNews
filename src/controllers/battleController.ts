/**
 * Battle Controller Module
 *
 * This module handles battle session creation and management.
 * It provides endpoints for creating battle sessions and accessing battle rooms.
 *
 * @module authController
 */


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
    try {
        const input : string = req.body.data;
        const auth = (req as any).auth;
        if (!auth?.isAuthenticated) {
            res.status(400).json({ error: "Autoryzacja wymagana" });
            return;
        }

        const userID : any = auth?.userId;
        const sessionID : string = crypto.randomBytes(6).toString('base64url');

        await db.execute('INSERT INTO battle_sessions (sessionID, input, A_uuid, B_uuid, status) VALUES (?,?,?,?, ?)', [sessionID, input, userID, null, 'NOT YET STARTED']);
        res.status(200).json({ sessionBattleID: sessionID, uuid: userID });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }

}


/**
 * Renders the battle room page based on session ID and user role.
 *
 * This function prepares the necessary data and renders the battle room view by:
 * 1. Extracting sessionID from request parameters and user from query parameters.
 * 2. Fetching session data from the database using the sessionID.
 * 3. Determining the user's role (player or spectator) based on their UUID and session data.
 * 4. Rendering the 'battle' view with session and user data.
 *
 * @param req - Express request object containing sessionID and user query parameters.
 * @param res - Express response object used to render the battle room page.
 *
 */

export const battleRoom = async (req: Request<battleRoomParams, {}, {}, battleRoomQuery>, res: Response) : Promise<void> => {
    try {
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
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }


}

/**
 * Initializes a battle room by assigning the second player if necessary.
 *
 * This function checks the battle session status and assigns the second player (B_uuid)
 * if they are not already assigned and the user is authenticated. It then redirects
 * the user to the appropriate battle room URL.
 *
 * Behavior:
 *  - If session not found -> responds 400 and stops.
 *  - If `B_uuid` is null:
 *  - If authenticated -> update DB, redirect to `/api/battle/rooms/:sessionID/?user=<userId>` (200).
 *  - If not authenticated -> respond 400 with a login-required message.
 *  - If `B_uuid` is already set -> redirect to `/api/battle/rooms/:sessionID` (200).
 *
 */

export const initializeBattleRoom = async (req: Request<battleRoomParams, {}, {},{}>,res: Response) : Promise<void> => {
    try {
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
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }

}


