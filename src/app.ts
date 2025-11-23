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
// import {options} from "./configs/ssl";

import {corsEnabled, httpsMode, PORT, domain} from "./configs/settings.ts";

// Import Routes

import analyse from './routes/analyse.ts';
import keyExchange from './routes/keyExchange.ts';
import auth from './routes/auth.ts';
import battle from './routes/battle.ts';
import {countVotes, judgeMessages, startBattle} from "./services/battleService.ts";
import {isNicknameInRoom} from "./utils/sockets.ts";
import leaderboard from "./routes/leaderboard.ts";





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

// Extract best-effort client IP address for a Socket.IO connection
function getClientIP(socket: Socket): string {
    const xff = socket.handshake.headers['x-forwarded-for'];
    let ip = '';
    if (typeof xff === 'string' && xff.length > 0) {
        ip = xff.split(',')[0].trim();
    } else if (Array.isArray(xff) && xff.length > 0) {
        ip = xff[0];
    } else {
        ip = socket.handshake.address || '';
    }
    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }
    return ip;
}

 let usersReady = {
    a: false,
    b: false,
}

 const Votes = new Map<string, number>();
 const VotedIPs = new Map<string, Set<string>>();


function countInRoom(room : string) {
    return io.of("/").adapter.rooms.get(room)?.size || 0;
}

async function voteTimer(sessionID : string) {
    const voteEndTime = Date.now() + 30_000;
    VotedIPs.set(sessionID, new Set<string>());
    await db.execute('UPDATE battle_sessions SET status = ? WHERE sessionID = ?', ['VOTING', sessionID]);
    await db.execute('INSERT INTO battle_voting (sessionID, A_votings, B_votings) VALUES (?, ?, ?)', [sessionID, 0, 0]);
    io.to(sessionID).emit('voting');
    const judgeData =  await judgeMessages(sessionID);
    const voteInterval = setInterval(async () => {
        const remaining = Math.floor((voteEndTime - Date.now()) / 1000);
        if (remaining <= 0) {
            await countVotes(sessionID, judgeData, countInRoom(sessionID));
            clearInterval(voteInterval);
            console.log('Voting ended for session:', sessionID);
            io.to(sessionID).emit('votingEnded');
        }
    }, 1000);
}

async function timeoutBattle(sessionID: string) {
    console.log('Deleting session due to timeout:', sessionID);
    io.to(sessionID).emit('timeout');
    await db.execute('DELETE FROM battle_sessions WHERE sessionID = ?', [sessionID]);
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

    } else if (count  <= 1) {
        const sessionTimeout = setTimeout(async () => {
            if (countInRoom(sessionID) < 2) {
                await timeoutBattle(sessionID);
                socket.disconnect();
            } else {
                clearTimeout(sessionTimeout);
            }
        }, 300_000);

    }
    socket.on('ready', async (player) => {
        if (player === 'a') {
            usersReady.a = true;
        } else if (player === 'b') {
            usersReady.b = true;
        }
        if (usersReady.a && usersReady.b) {
            const role = await startBattle(sessionID);
            const endBattleTimer = Date.now() + 40_000;
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

    socket.on('disconnect', () => {
        console.log(nickname + " opuścił sesję " + sessionID);
        const count = countInRoom(sessionID);
        socket.to(sessionID).emit('announcement', nickname + ' opuścił sesję. (' + count + '/2)');
    })

    socket.on('message', async (msg) => {
        await db.execute('INSERT INTO battle_messages (sessionID, user_message, message, nickname, role, topic) VALUES (?, ?, ?, ?, ?, ?)', [sessionID, role, msg.msg, nickname, msg.role, msg.topic]);
        socket.to(sessionID).emit('message', {nickname: role + " | " + nickname, message: msg.msg});
    });

    socket.on('vote', async (player)  => {
        try {
            const ip = getClientIP(socket);
            if (!ip) {
                socket.emit('voteRejected', { reason: 'Brak adresu IP' });
                return;
            }
            let set = VotedIPs.get(sessionID);
            if (!set) {
                set = new Set<string>();
                VotedIPs.set(sessionID, set);
            }
            if (set.has(ip)) {
                socket.emit('voteRejected', { reason: 'Głos z tego adresu IP został już oddany' });
                return;
            }

            if (player === 'A') {
                await db.execute('UPDATE battle_voting SET A_votings = A_votings + 1 WHERE sessionID = ?', [sessionID]);
            } else if (player === 'B') {
                await db.execute('UPDATE battle_voting SET B_votings = B_votings + 1 WHERE sessionID = ?', [sessionID]);
            } else {
                socket.emit('voteRejected', { reason: 'Nieprawidłowy wybór gracza' });
                return;
            }

            set.add(ip);
            socket.emit('voteAccepted');
        } catch (e) {
            console.error('Vote error:', e);
            socket.emit('voteRejected', { reason: 'Błąd serwera' });
        }
    });

});




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
app.use('/api/auth/', auth);
app.use('/api/battle/', battle )
app.use('/battle/', leaderboard )


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



