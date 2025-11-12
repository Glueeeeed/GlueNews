import express, { Request, Response } from 'express';
import path from "path";
import cors from 'cors';
import https from 'https';


//Uncomment when httpsMode is enabled
// import {options} from "./config/ssl";

import {corsEnabled, httpsMode, PORT, domain} from "./configs/settings";

// Import Routes

import analyse from './routes/analyse';


const app = express();
const port : number = PORT;


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

// API endpoints

app.use('/api', analyse);









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



