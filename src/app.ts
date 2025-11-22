import express, { Request, Response } from 'express';
import path from "path";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {softAuth} from "./middlewares/softAuth.ts";
import {Server, Socket} from 'socket.io';
import db from './configs/database.ts';


//Uncomment when httpsMode is enabled
// import {options} from "./config/ssl";

import {corsEnabled, httpsMode, PORT, domain} from "./configs/settings.ts";

// Import Routes

import analyse from './routes/analyse.ts';
import keyExchange from './routes/keyExchange.ts';
import auth from './routes/auth.ts';
import battle from './routes/battle.ts';
import {startBattle} from "./services/battleService.ts";
import {isNicknameInRoom} from "./utils/sockets.ts";





const app = express();
const server = http.createServer(app);
const port : number = PORT;
app.use(cookieParser());
app.use(softAuth);

// Socket IO

export const io = new Server(server, {
    cors: corsEnabled
        ? {
            origin: domain,
            credentials: true,
        } : undefined,
})

let usersReady = {
    a: false,
    b: false,
}

 const Votes = new Map<string, number>();


function countInRoom(room : string) {
    return io.of("/").adapter.rooms.get(room)?.size || 0;
}

async function voteTimer(sessionID : string) {
    const voteEndTime = Date.now() + 30_000;
    io.to(sessionID).emit('voting');
    const voteInterval = setInterval(async () => {
        const remaining = Math.floor((voteEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
            clearInterval(voteInterval);
            io.to(sessionID).emit('voteEnded');
            const [votingData] = await db.execute('SELECT * FROM battle_voting WHERE sessionID = ?', [sessionID]);
            const data : any = (votingData as any[])[0];
            let winner;
            if (data.A_votings > data.B_votings) {
                winner = 'a';
            } else if (data.B_votings > data.A_votings) {
                winner = 'b';
            } else {
                winner = 'remis';
            }
            io.to(sessionID).emit('voteResult', winner);
        }
    }, 1000);
}

io.on('connection', async (socket) =>  {
    const sessionID : any = socket.handshake.query.sessionID;
    const nickname = socket.handshake.query.nickname;
    const role = socket.handshake.query.role;
    const isUserExisting = isNicknameInRoom(io, sessionID, String(nickname));
    if (isUserExisting) {
        socket.emit('duplicateNickname');
        socket.disconnect();
        return;
    }
    console.log(nickname + " dolaczyl do sesji " + sessionID);
    socket.join(sessionID);
    const count = countInRoom(sessionID);
    socket.to(sessionID).emit('announcement', nickname + ' dołączył do sesji. (' + count + '/2)');
    socket.emit('announcement', 'Pamietaj, ze słowa wulgarne mogą wpłynąć negatywnie na punktacje!');
    if (count === 2) {
        io.to(sessionID).emit('unlockButtons');
    }
    socket.on('ready', async (player) => {
        await db.execute('INSERT INTO battle_voting (sessionID, A_votings, B_votings) VALUES (?, ?, ?)', [sessionID, 0, 0]);
        if (player === 'a') {
            usersReady.a = true;
        } else if (player === 'b') {
            usersReady.b = true;
        }
        if (usersReady.a && usersReady.b) {
            const role = await startBattle(sessionID);
            const endBattleTimer = Date.now() + 180_000;
            io.to(sessionID).emit('startBattle', role)
            usersReady = {a: false, b: false};
            const fightTimer = setInterval(() => {
                const remaining = Math.floor((endBattleTimer! - Date.now()) / 1000);
                io.to(sessionID).emit('timer', remaining);
                if (remaining <= 0) {
                    clearInterval(fightTimer);
                     voteTimer(sessionID);
                }
            }, 1000);
        }
    });

    if (!socket.recovered) {
        try {
            const [messagesData] = await db.execute('SELECT * FROM battle_messages WHERE sessionID = ?', [sessionID]);
            const messages = (messagesData as any[]);
            socket.emit('loadMessages', messages);
        } catch (err) {
            console.error('Error fetching battle messages:', err);
        }
    }





    socket.on('message', async (msg) => {
        await db.execute('INSERT INTO battle_messages (sessionID, user_message, message, nickname) VALUES (?, ?, ?, ?)', [sessionID, role, msg, nickname]);
        socket.to(sessionID).emit('message', {nickname: role + " | " + nickname, message: msg});
    });

    socket.on('vote', async (player)  => {
        if (player === 'a') {
            await db.execute('UPDATE battle_voting SET A_votings = A_votings + 1 WHERE sessionID = ?', [sessionID]);
        } else if (player === 'b') {
            await db.execute('UPDATE battle_voting SET B_votings = B_votings + 1 WHERE sessionID = ?', [sessionID]);
        }
    });





})





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

app.get('/socket', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', '/views' ,'socket.html'));
})


// API endpoints

app.use('/api', analyse);
app.use('/api', keyExchange);
app.use('/api/auth/', auth);
app.use('/api/battle/', battle )


if (httpsMode) {

    // https.createServer(ssl, app).listen(port, "0.0.0.0", () => {
    //
    //     console.log(`App running at ${domain}:${port}`);
    //
    // });

} else {
    server.listen(port, () => {
        console.log(`App running at ${domain}:${port}`);

    });

}



