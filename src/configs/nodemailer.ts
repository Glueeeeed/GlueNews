import nodemailer from "nodemailer";
import dotenv from 'dotenv'
dotenv.config({ path: './src/configs/secrets.env' })

export const transporter = nodemailer.createTransport({
    host: process.env.mailHost,
    port: 587,
    auth: {
        user: process.env.mailUser,
        pass: process.env.mailPass,
    },
});
