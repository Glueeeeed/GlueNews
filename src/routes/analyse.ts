import express, { Router, Request, Response } from 'express';
import {analyse} from '../controllers/analyseController';

const router: Router = express.Router();

router.post('/analiza', analyse);

export default router;