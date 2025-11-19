import express, { Router, Request, Response } from 'express';
import {battleRoom, createBattleSession} from '../controllers/battleController.ts';

const router: Router = express.Router();

router.post('/start-session', createBattleSession);
router.get('/rooms/:sessionID', battleRoom);

export default router;