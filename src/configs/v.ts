// TypeScript
function extractJsonFromMarkdown(text: string): any | null {
    if (!text) return null;
    // Remove code fences like ```json and ``` and trim
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

