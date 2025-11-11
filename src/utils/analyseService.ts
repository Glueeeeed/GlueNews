import dotenv from 'dotenv'
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
                `Temat lub link: ${input}\n` +
                '\n' +
                '1. Wczytaj treść z linku (jeśli 404 → verdict: "Błąd linku") lub zapoznaj sie z treścią tematu.,\n' +
                '2. Wyodrębnij 3 kluczowe twierdzenia.,\n' +
                '3. Dla każdego: sprawdź via web search, podaj cytację w tekście.,\n' +
                '4. Oceń wiarygodność źródła (WHOIS, Media Bias Chart).,\n' +
                '5. Daj score 0-100 i verdict.,\n' +
                '\n' +
                'Odpowiedz TYLKO  W JSON\n' +
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

