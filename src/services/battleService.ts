import db from '../configs/database.ts'
import {extractJsonFromMarkdown} from "./analyseService.ts";
import dotenv from "dotenv";

dotenv.config({path: './src/configs/secrets.env'})

export async function startBattle(sessionID: any) {
    await db.execute('UPDATE battle_sessions SET status = ? WHERE status = ? AND sessionID = ?', ['IN PROGRESS', 'NOT YET STARTED', sessionID]);
    let rola;
    let rolaB;
    if (Math.random() < 0.5) {
        rola = 'OBRONCA';
        rolaB = 'OBALATOR';
    } else {
        rola = 'OBALATOR';
        rolaB = 'OBRONCA';
    }

    await db.execute('UPDATE battle_sessions SET A_role = ?, B_role = ? WHERE sessionID = ?', [rola, rolaB, sessionID]);
    console.log(rola, rolaB);
    return {a: rola, b: rolaB};

}

export async function judgeMessages(sessionID: string) {
    try {
        const [battleMessagesData] = await db.execute('SELECT * FROM battle_messages WHERE sessionID = ?', [sessionID]);
        const messages : any = battleMessagesData as any[]

        const messagesFormatted : string = JSON.stringify(messages);
        console.log(messagesFormatted);





        const {GoogleGenAI} = await import("@google/genai");
        const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: 'Jesteś sędzią w debacie między dwoma graczami: OBRONCĄ i OBALATOREM. Przeanalizuj ich wypowiedzi i zdecyduj, który z nich wygrał debatę na podstawie jakości argumentów, logiki.\n' +
                '\n' +
                'Oto wypowiedzi obu graczy:\n' +
                '\n' +
                `${messagesFormatted} \n` +
                'Oceniaj według następujących kryteriów: (Dla gracza A i B osobno)\n' +
                '1. Siła argumentów: Który gracz przedstawił silniejsze, bardziej przekonujące argumenty?\n' +
                '2. Logika: Który gracz wykazał się lepszym rozumowaniem i spójnością w swoich wypowiedziach?\n' +
                '3. Przekonującość: Który gracz był bardziej przekonujący i potrafił lepiej wpłynąć na odbiorcę?\n' +
                '\n' + 'Oceniaj wedlug takiej punktacji:\n' +
                ' +15pkt bazowo dla obu graczy,\n' +
                ' +20pkt za podane źródła, które są poprawne i zgodne z tematem\n' +
                ' +5pkt za każde dobre pytanie do przeciwnika,\n' +
                ' +10pkt za logiczne argumenty\n' +
                ' +15pkt za przekonujące wypowiedzi,\n' +
                ' -5pkt za wulgaryzmy,\n' +
                ' -5pkt za nie na temat,\n' +
                ' -5pkt za powtarzanie tych samych argumentów.\n' +
                ' -10pkt za brak szacunku wobec przeciwnika.\n' +
                '\n' +
                'Maksymana punktacja jaką możesz wyliczyc to 100pkt a minimalna 0 (zaokraglij do 0 jeżeli jest na minusie):\n' +
                '\n' + 'Odpowiedz TYLKO W JSON według wzoru:\n' +
                '{\n' +
                '  "A": liczba_punktów,\n' +
                '  "B": liczba_punktów,\n' +
                '}\n',

        });
         console.log(response.text);
         return extractJsonFromMarkdown(response.text);

    } catch (error: any) {
        if (error.status === 503 && error.message.includes('overloaded')) {
            console.log('Gemini API is overloaded. Ignoring judging for this round.');
        }
        console.log(error);
    }
}

export async function countVotes(sessionID: string, jugdeData : any, memberCount: number) {
    const [voteData] = await db.execute('SELECT * FROM battle_voting WHERE sessionID = ?', [sessionID]);
    const votes = (voteData as any[])[0];
    let winner: string;
    let loser: string;
    let aVotes: number = votes.A_votings;
    let bVotes: number = votes.B_votings;
    let aScore: number = jugdeData.A || 0;
    let bScore: number = jugdeData.B || 0;
    let winnerScore: number;
    let loserScore: number;
    let isDraw: boolean = false;

    if (memberCount > 1) {
        if (aVotes > bVotes) {
            aScore += 100;
        } else if (bVotes > aVotes) {
            bScore += 100;
        } else {
            aScore += 50;
            bScore += 50;
        }
    } else {
        if (aVotes > bVotes) {
            aScore += 50;
        } else if (bVotes > aVotes) {
            bScore += 50;
        } else {
            aScore += 25;
            bScore += 25;
        }
    }


    if (aScore > bScore) {
        winner = 'A';
        loser = 'B';
        winnerScore = aScore;
        loserScore = bScore;

    } else if (bScore > aScore) {
        winner = 'B';
        loser = 'A';
        winnerScore = bScore;
        loserScore = aScore;
    } else {
        winner = 'REMIS';
        loser = 'REMIS';
        winnerScore = aScore;
        loserScore = bScore;
        isDraw = true;

    }
    const [userUUIDsData] = await db.execute('SELECT A_uuid, B_uuid FROM battle_sessions WHERE sessionID = ?', [sessionID]);
    const userUUIDs = (userUUIDsData as any[])[0];
    let winnerUUID: string;
    let loserUUID: string;
    if (winner === 'A') {
        winnerUUID = userUUIDs.A_uuid;
        loserUUID = userUUIDs.B_uuid;
    } else if (winner === 'B') {
        winnerUUID = userUUIDs.B_uuid;
        loserUUID = userUUIDs.A_uuid;
    } else {
        winnerUUID = userUUIDs.A_uuid;
        loserUUID = userUUIDs.B_uuid;
    }

    await db.execute('UPDATE leaderboard SET score = score + ? WHERE uuid = ? ', [winnerScore, winnerUUID]);
    await db.execute('UPDATE leaderboard SET score = score + ? WHERE uuid = ? ', [loserScore, loserUUID]);
    await db.execute('INSERT INTO battle_result (winner, sessionID, score, loser, loser_score, isDraw) VALUES (?, ?, ?, ?, ?, ?)', [winner, sessionID, winnerScore, loser, loserScore, isDraw]);
    await db.execute('UPDATE battle_sessions SET status = ? WHERE sessionID = ?', ['ENDED', sessionID]);


}



