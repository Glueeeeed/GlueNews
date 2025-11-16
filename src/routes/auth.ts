import express, { Router, Request, Response } from 'express';
import {register, verify, login} from '../controllers/authController.ts';

const router: Router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify', verify);


export default router;