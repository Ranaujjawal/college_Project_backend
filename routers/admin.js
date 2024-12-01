import express from 'express';
import {
  adminlogin,
  adminRegister,
  adminlogout,
  sendSuspiciousReport,
  setWorkerStatus,
  submitDocuments,
  listPendingDocuments,
  listWorkers
} from '../controller/adminauth.js';
import { authenticateToken, AdminauthenticateToken} from '../middleware/auth.js';
import { upload } from '../middleware/multer.js';

const router = express.Router();

router.route('/alogin').post(adminlogin);
router.route('/aregister').post(adminRegister);
router.route('/alogout').post(AdminauthenticateToken, adminlogout);


router.route('/aworkers').get(authenticateToken, listWorkers);  
router.route('/aworkers/status').post(AdminauthenticateToken, setWorkerStatus);  


router.route('/asubmit-documents').post(
  authenticateToken,
  upload.fields([
    { name: 'document1', maxCount: 1 },
    { name: 'document2', maxCount: 1 },
  ]),
  submitDocuments
);

router.route('/apendingdocuments').post(AdminauthenticateToken, listPendingDocuments); 


router.route('/asend-report').post(AdminauthenticateToken, sendSuspiciousReport);

export default router;
