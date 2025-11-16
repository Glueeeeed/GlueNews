import express, { Request, Response } from 'express';
import path from "path";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {softAuth} from "./middlewares/softAuth.ts";


//Uncomment when httpsMode is enabled
// import {options} from "./config/ssl";

import {corsEnabled, httpsMode, PORT, domain} from "./configs/settings.ts";

// Import Routes

import analyse from './routes/analyse.ts';
import keyExchange from './routes/keyExchange.ts';
import auth from './routes/auth.ts';



const app = express();
const port : number = PORT;
app.use(cookieParser());
app.use(softAuth);


//Uncomment when httpsMode is enabled

// const ssl = options


//Middlewares
app.use(express.json());
if (corsEnabled) {
    const corsOptions = {
        origin: domain,
        credentials: true,
        optionsSuccessStatus: 200,
    };
    app.use(cors());
}
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../src/public/', 'views'));



// Frontend handling

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req: Request, res: Response)  => {
    res.sendFile(path.join(__dirname, 'public', '/views' ,'index.html'));
})

app.get('/register', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', '/views' ,'register.html'));
})

app.get('/login', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', '/views' ,'login.html'));
})

// API endpoints

app.use('/api', analyse);
app.use('/api', keyExchange);
app.use('/api/auth/', auth)









if (httpsMode) {

    // https.createServer(ssl, app).listen(port, "0.0.0.0", () => {
    //
    //     console.log(`App running at ${domain}:${port}`);
    //
    // });

} else {
    app.listen(port, () => {
        console.log(`App running at ${domain}:${port}`);

    });

}



