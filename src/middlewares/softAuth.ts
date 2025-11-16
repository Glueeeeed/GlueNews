import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './src/configs/secrets.env' })

const secret : any = process.env.jwtSecret

export function softAuth(req: Request, _res: Response, next: NextFunction) {
    const token = req.cookies?.token;

    if (!token) {
        (req as any).auth = { isAuthenticated: false, reason: 'no-cookie' };
        return next();
    }

    try {
        const payload : any = jwt.verify(token, secret);
        (req as any).auth = { isAuthenticated: true, userId: payload.uuid };
    } catch (err: any) {
        const expired = err?.name === 'TokenExpiredError';
        console.log(err);
        (req as any).auth = { isAuthenticated: false, reason: expired ? 'expired' : 'invalid' };
    }

    next();
}