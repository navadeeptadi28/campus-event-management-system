import {Router} from 'express'; import {registerStudent,login,me} from '../controllers/authController.js'; import {authenticate} from '../middleware/auth.js';
const r=Router(); r.post('/register',registerStudent); r.post('/login',login); r.get('/me',authenticate,me); export default r;
