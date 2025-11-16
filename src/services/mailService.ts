import nodemailer from "nodemailer";
import {transporter} from "../configs/nodemailer.ts";

export function sendVerificationMail(email : string, token : string,) : void {
    const verifyLink = `http://localhost:2137/api/auth/verify?token=${token}`;   // CHANGE TO YOUR DOMAIN
    transporter.sendMail({
        from: '"NO REPLY | GlueNews" <encryptorservice@gmail.com>',
        to: email,

        subject: "Weryfikacja konta",
        text: "Witaj!",
        html: `<p>Witaj,</p>
            <p>Dziekujemy za rejestracje. Prosimy o potwierdzenie adresu e-mail, klikając ponizszy link.:</p>
            <p><a href="${verifyLink}"> Kliknij tutaj</a> </p>
            <p>alternatywny link: ${verifyLink}</p>
            <p>Jesli nie rejestrowales się w celu utworzenia tego konta, prosimy zignorowac te wiadomosc e-mail.</p>
            <p>Z powazaniem, <br>Zespol GlueNews</p>`,

    })
}