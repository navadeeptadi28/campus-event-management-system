import {Router} from 'express';
import {authenticate,authorize} from '../middleware/auth.js';
import {deleteProfile} from '../controllers/studentController.js';
const r=Router();
r.delete('/profile',authenticate,authorize('student'),deleteProfile);
export default r;
