import express, { Router, Request, Response } from 'express';
import {
    leaderboard
} from '../controllers/battleController.ts';

const router: Router = express.Router();

router.get('/leaderboard', leaderboard)

export default router;