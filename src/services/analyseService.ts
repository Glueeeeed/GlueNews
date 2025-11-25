import dotenv from 'dotenv';
import crypto from 'crypto';
import db from "../configs/database.ts";
dotenv.config({ path: './src/configs/secrets.env' })

// Remove code fences like ```json and ``` and trim

export function extractJsonFromMarkdown(text: any): any | null {
    if (!text) return null;
    const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first === -1 || last === -1 || last <= first) return null;
    const candidate = cleaned.slice(first, last + 1);
    try {
        return JSON.parse(candidate);
    } catch (e) {
        console.warn('JSON.parse failed:', e);
        return null;
    }
}

export async function getAnalysisResult(input: string, key: any , model: string): Promise<any> {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey: key});
    const response = await ai.models.generateContent({
        model: model,
        contents: 'Jesteś detektorem fake newsów dla nastolatków. Analizuj krok po kroku:\n' +
            '\n' +
            `Temat lub link: ${input}\n UWAGA: Sprawdz czy jest merytorycznie (TYLKO W PRZYPADKU TEMATU) poprawny, jezeli nie ma sensu np. to jedno słowo np. "pies" ignoruj i zwroc że to nie ma sensu` +
            '\n' +
            '1. Wczytaj treść z linku (jeśli 404 → verdict: "Błąd linku") lub zapoznaj sie z treścią tematu.,\n' +
            '2. Wyodrębnij 3 kluczowe twierdzenia.,\n' +
            '3. Dla każdego: sprawdź via web search, podaj cytację w tekście.,\n' +
            '4. Oceń wiarygodność źródła (WHOIS, Media Bias Chart). Szukaj zrodel NIE STARSZYCH niz 6 miesiecy,\n' +
            '5. Daj score 0-100 i verdict.,\n' +
            '6. Analizuj czy zrodla działają (nie są martwe).,\n' +
            '\n' +
            'Odpowiedz TYLKO  W JSON wedlug wzoru:\n' +
            '\n' +
            '{\n' +
            '  "truth_score": 0-100,\n' +
            '  "verdict": "Bzdura / Częściowa prawda / Prawda / Błąd linku",\n' +
            '  "reasons": ["Twierdzenie 1: fałsz, bo [cytat z Reuters]", ...],\n' +
            '  "sources": ["https://...", ...],\n' +
            '}',
    });



    return extractJsonFromMarkdown(response.text);

}

export function formatVerdict(verdict: string | number): number | string {
    if (typeof verdict === 'string') {
        switch (verdict) {
            case "Bzdura":
                return 0;
            case "Częściowa prawda":
                return 1;
            case "Prawda":
                return 2;
            case "Błąd linku":
                return 3;
            default:
                return -1;
        }
    } else {
        switch (verdict) {
            case 0:
                return "Bzdura";
            case 1:
                return "Częściowa prawda";
            case 2:
                return "Prawda";
            case 3:
                return "Błąd linku";
            default:
                return "Nieznany werdykt";
        }
    }
}

export async function generateSession(response: any, input: any) : Promise<string> {
    const sessionID = crypto.randomBytes(16).toString('base64url');
    const reasonsJson = JSON.stringify(response.reasons || []);
    const sourcesJson = JSON.stringify(response.sources || []);
    const truthScore = response.truth_score ?? null;
    const verdict = formatVerdict(response.verdict);
    await db.execute('INSERT INTO sessions (sessionID, truthScore, verdict, reason, sources, input) VALUES (?, ?, ?, ? , ?, ?)', [sessionID, truthScore, verdict, reasonsJson, sourcesJson, input]);
    return sessionID;

}

export async function getDataResults(sessionID: string) : Promise<object> {
    const [sessionData] = await db.execute('SELECT * FROM sessions WHERE sessionID = ?', [sessionID]);
    const session = (sessionData as any[])[0];
    if (!session) {
        throw new Error('Session not found');
    }
    const result = {
        session: sessionID,
        truthScore: session.truthScore,
        verdict: formatVerdict(session.verdict),
        reasons: JSON.parse(session.reason),
        sources: JSON.parse(session.sources),
        input: session.input,
    };
    return result;
}

const secret = crypto.randomBytes(32).toString('base64url');
console.log(secret);