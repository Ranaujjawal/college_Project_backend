import express from 'express';
import { getProfile, getPeople } from '../controller/user.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', authenticateToken, getProfile);
router.get('/people', authenticateToken, getPeople);

export default router;