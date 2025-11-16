import {Request, Response} from 'express';
import db from "../configs/database.ts";
import {createVerificationMail, decryptData, hashArgon, validate} from "../services/authService.ts";
import {Secrets} from "./keyExchangeController.ts";
import crypto from 'crypto';
import {ValidationError, ConflictError} from "../utils/error.ts";
import jsonwebtoken, {JwtPayload} from 'jsonwebtoken';
import dotenv from "dotenv";
import {sendVerificationMail} from "../services/mailService.ts";
dotenv.config({ path: './src/configs/secrets.env' });
const secret : any = process.env.jwtSecret;

interface registerRequest {
    login: string;
    password: string;
    username: string;
    sessionID: string;
}

interface registerResponse {
    message: string;
}

interface verifyQuery {
    token: string;
}

export const register = async (req: Request<{}, {}, registerRequest>, res: Response<registerResponse | { error: string }>): Promise<void> => {
    try {
        const loginEncrypted : string = req.body.login;
        const passwordEncrypted : string  = req.body.password;
        const usernameEncrypted : string = req.body.username;
        const sessionID : string = req.body.sessionID;


        const sessionKey : string | undefined = Secrets.get(sessionID);

        if (!loginEncrypted || !passwordEncrypted || !usernameEncrypted || !sessionID) {
            res.status(400).json({ error: 'Invalid input' });
            return;
        }

        const login : string = decryptData(loginEncrypted, sessionKey);
        const username : string = decryptData(usernameEncrypted, sessionKey);

        await validate(login, passwordEncrypted, username, sessionKey);

        const hashedPassword : string = await hashArgon(decryptData(passwordEncrypted, sessionKey));

        const uuid = crypto.randomUUID();

        await db.execute('INSERT INTO users (uuid, username, email, password, verified) VALUES (?,?,?,?,?)', [uuid, username, login, hashedPassword, false]);
        await createVerificationMail(uuid, login);

        res.status(201).json({message: 'Pomyslnie zarejestrowano! Sprawdz skrzynke email oraz folder spam!'})
    } catch (error) {
        if (error instanceof ValidationError) {
              res.status(400).json({ error: error.message });
        } else if (error instanceof ConflictError) {
             res.status(409).json({ error: error.message });
        } else {
            console.error('Register error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }



}

export const verify = async (req: Request<{}, {}, {}, verifyQuery>, res: Response) : Promise<void> => {
   const token: string = req.query.token;
   if (!token) {
       res.status(400).send('invalid verify token');
   }
   try {
       const decoded : any  = jsonwebtoken.verify(token, secret)
       const uuid = decoded.uuid;
       await db.execute('UPDATE users SET verified = ? WHERE uuid = ?', [true, uuid]);
       console.log('Pomyslnie zweryfikowano uzytkownika: ', uuid);
       res.status(200).redirect(`http://localhost:2137/login`) // CHANGE TO YOUR DOMAIN
   } catch (err) {
       console.error(err);
       res.status(500).send('verify token expired or invalid');
   }


}