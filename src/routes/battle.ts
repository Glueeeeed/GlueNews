import express, { Router, Request, Response } from 'express';
import {createBattleSession} from '../controllers/battleController.ts';

const router: Router = express.Router();

router.post('/start-session', createBattleSession);

export default router;