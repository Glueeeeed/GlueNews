import {gcm} from '@noble/ciphers/aes.js';
import {Cipher} from "@noble/ciphers/utils.js";
import argon2 from 'argon2';
import db from "../configs/database.ts";
import validator from 'validator';
import {randomBytes} from "@noble/hashes/utils.js";
import jsonwebtoken from 'jsonwebtoken';
import dotenv from 'dotenv';
import {sendVerificationMail} from "./mailService.ts";
import {ValidationError, AuthenticationError, ConflictError} from "../utils/error.ts";
dotenv.config({ path: './src/configs/secrets.env' });
const secret : any = process.env.jwtSecret;




export function decryptData(cipherTextBase64 : string, keyHex : any) : string {
    const key : Uint8Array = Uint8Array.from(Buffer.from(keyHex, 'hex'));
    const [cipher, iv] = cipherTextBase64.split(':');
    const cipherBytes : Uint8Array = Uint8Array.from(Buffer.from(cipher, 'base64'));
    const ivBytes : Uint8Array = Uint8Array.from(Buffer.from(iv, 'hex'));

    const aes: Cipher = gcm(key, ivBytes);
    const decrypted: Uint8Array  = aes.decrypt(cipherBytes);
    return new TextDecoder().decode(decrypted);


}

export async function hashArgon(password: string): Promise<string> {
    const hashBuffer : any = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 4,
        parallelism: 4,
        hashLength: 32,
    });
    return (hashBuffer as Buffer).toString('hex');
}

export async function verifyHashArgon(hash : string, password : string): Promise<void> {
    const passwordMatch = await argon2.verify(hash, password);
    if (!passwordMatch) {
        throw new AuthenticationError('Invalid email or password');
    }
}

export async function createVerificationMail(uuid: string, email: string) : Promise<void> {
    const token : string   = jsonwebtoken.sign(
        {uuid},
        secret,
        {expiresIn: '1d'}
    );

    sendVerificationMail(email, token);
    console.log('Verification email sent');
}

export async function validate(login: string, password : string, username: any, secret : any) : Promise<void> {

        if (validator.isEmpty(login)) {
            throw new ValidationError('Adres email nie moze byc pusty');
        } else if (!validator.isEmail(login)) {
            throw new ValidationError('Niepoprawny adres email');
        }  else if (validator.isEmpty(decryptData(password,secret)) ) {
            throw new ValidationError('Haslo nie moze byc puste');
        } else if (!validator.isStrongPassword(decryptData(password,secret))) {
            throw new ValidationError('Haslo powinno skladac sie z minimum 8 znakow, conajmniej jednej wielkiej i malej litery oraz  conajmniej jednego znaku specjalnego')
        }

        if (username != null) {
        if (validator.isEmpty(username)) {
            throw new ValidationError('Nazwa uzytkownika nie moze byc pusta');
        }
        if (!validator.isLength(username, { min: 4, max: 25 })) {
            throw new ValidationError('Nazwa uzytkownika powinna miec dlugosc miedzy 4 a 25 znakow');
        }
    }


    if (username != null) {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [login]);
        if ((users as any[]).length > 0) {
            throw new ConflictError('Ten adres email jest juz zarejestrowany')
        }

        const [usernames] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if ((usernames as any[]).length > 0) {
            throw new ConflictError('Nazwa uzytkownika jest juz zajeta')
        }
    } else {
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [login]);
        if ((users as any[]).length <= 0) {
            throw new ValidationError('Nie znaleziono konta powiazanego z tym adresem email')
        }
    }

}

export async function getUserHash(password : string, login : string)  {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [login]);
    const data : any = (users as any[])[0];
    const userHashedPassword = data.password;
    const userUuid = data.uuid;
    return {hashedPass: userHashedPassword, uuid: userUuid};
}



