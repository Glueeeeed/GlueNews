import express, { Router, Request, Response } from 'express';
import { keyExchange } from '../controllers/keyExchangeController.ts';


const router: Router = express.Router();

router.post('/key-exchange', keyExchange);

export default router;