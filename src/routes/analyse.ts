import express, { Router, Request, Response } from 'express';
import {analyse, getResults} from '../controllers/analyseController';

const router: Router = express.Router();

router.post('/analiza', analyse);
router.get('/results/:sessionID', getResults);

export default router;