import express, { Router, Request, Response } from 'express';
import {register, verify, login, status} from '../controllers/authController.ts';

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verify);
router.get('/status', status);



export default router;