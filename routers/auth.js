import express from 'express';

import { login, register, logout,updateUserRating, getWorkers,
    initiateForgotPassword,verifyForgotPasswordOTP,
    resendForgotPasswordOTP,resetPassword
    ,verifyOTPAndRegister,resendOTP} from '../controller/auth.js';

import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';
const router = express.Router();

router.route('/login').post(login);
router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    }]),register);
router.route('/verifyotp').post(verifyOTPAndRegister);
router.route('/resendregisterotp').post(resendOTP);
router.route('/logout').post(logout);
router.route('/forgotPassword').post(initiateForgotPassword);
router.route('/verifyforgototppassword').post(verifyForgotPasswordOTP);
router.route('/resendforgototp').post(resendForgotPasswordOTP);
router.route('/resetpassword').post(resetPassword);
router.patch('/rating/:userId', authenticateToken, updateUserRating);
router.route('/workers').post(authenticateToken,getWorkers);
export default router;