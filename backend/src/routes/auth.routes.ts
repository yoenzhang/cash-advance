import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/auth.controller';
import { validateRegistration, validateLogin } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validateRegistration, register);
router.post('/login', validateLogin, login);
router.get('/me', authenticate, getCurrentUser);

export const authRouter = router; 