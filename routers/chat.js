import express from 'express';
import { getMessages,addusechathistory,pastchattings } from '../controller/chat.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.route('/:userId').get(authenticateToken, getMessages);
router.route('/adduserinchat').post(authenticateToken,addusechathistory);
router.route('/chatuserhistory').post(authenticateToken,pastchattings);
router.route('/getsmessages').post(authenticateToken,getMessages);
export default router;
