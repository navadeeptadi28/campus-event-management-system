import {query} from '../config/db.js';
export async function deleteProfile(req,res,next){try{
  const userId=req.user.id;
  const student=(await query('SELECT id FROM students WHERE user_id=?',[userId]))[0];
  if(!student)return res.status(404).json({message:'Student profile not found'});
  await query('DELETE FROM users WHERE id=?',[userId]);
  res.json({message:'Student profile and personal account data deleted successfully'});
}catch(e){next(e)}}
