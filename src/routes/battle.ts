import express, { Router, Request, Response } from 'express';
import {battleRoom, createBattleSession, initializeBattleRoom} from '../controllers/battleController.ts';

const router: Router = express.Router();

router.post('/start-session', createBattleSession);
router.get('/rooms/:sessionID', battleRoom);
router.get('/:sessionID', initializeBattleRoom);

export default router;