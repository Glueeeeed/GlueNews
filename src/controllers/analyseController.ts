import {Request, Response} from "express";
import {generateSession, getAnalysisResult, getDataResults} from '../services/analyseService.ts';

interface InputData {
    input: string;
}

interface OutputData {
    result: string;
}

interface getResultData {
    sessionID: string;
}

interface outputResultData {
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
        const id : string = await generateSession(result, input);
        console.log('Analysis session created with ID:', id);
        res.status(200).json({result: id});


    } catch (error: any) {
        if (error.status === 503 && error.message.includes('overloaded')) {
            console.log('Gemini API is overloaded. Trying another model...');
            try {
                const input = req.body.input;
                const result: object = await getAnalysisResult(input, process.env.GEMINI_API_KEY, 'gemini-2.5-flash-lite');
                const id : string = await generateSession(result, input);
                console.log('Analysis session created with ID:', id);
                res.status(200).json({result: id});
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

export const getResults =  async (req: Request<getResultData, {}, {}, {}>, res: Response<outputResultData | { error: string }>) : Promise<any> => {
    const sessionID = req.params.sessionID;
    try {
        const result : object = await getDataResults(sessionID);
        res.render('results', { data: result });
    } catch (error: any) {
        if (error.message.includes('Session not found')) {
            res.status(404).json({ error: 'Session not found' });
            return;
        } else {
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
    }

}