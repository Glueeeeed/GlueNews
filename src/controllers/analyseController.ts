import {Request, Response} from "express";
import { getAnalysisResult } from '../utils/analyseService';

interface InputData {
    input: string;
}

interface OutputData {
    result: object;
}

 export  const  analyse = async (req: Request<{}, {}, InputData>, res: Response<OutputData | { error: string }>): Promise<void> => {
    try {
        const input = req.body.input;
        if (!input) {
            res.status(400).json({ error: 'Invalid input' });
            return;
        }

        const result : object =  await getAnalysisResult(input, process.env.GEMINI_API_KEY, 'gemini-2.5-flash');
        console.log(result);


    } catch (error: any) {
        if (error.status === 503 && error.message.includes('overloaded')) {
            console.log('Gemini API is overloaded. Trying another model...');
            try {
                const input = req.body.input;
                const result: object = await getAnalysisResult(input, process.env.GEMINI_API_KEY, 'gemini-2.5-flash-lite');
                console.log(result);
            } catch (innerError) {
                console.error(innerError);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }

}