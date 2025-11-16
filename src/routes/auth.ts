import express, { Router, Request, Response } from 'express';
import {register, verify} from '../controllers/authController.ts';

const router: Router = express.Router();

router.post('/register', register);
router.get('/verify', verify);


export default router;