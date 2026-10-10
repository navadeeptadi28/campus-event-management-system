import multer from 'multer';
import path from 'path';
import fs from 'fs';

const dir=path.resolve('uploads');
if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true});
const storage=multer.diskStorage({destination:(_,__,cb)=>cb(null,dir),filename:(_,file,cb)=>{const ext=path.extname(file.originalname).toLowerCase();cb(null,`${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`)}});

export const upload=multer({storage,limits:{fileSize:5*1024*1024},fileFilter:(_,file,cb)=>{
  if(/^image\/(jpeg|png|webp)$/.test(file.mimetype))cb(null,true);
  else cb(new Error('Poster must be JPG, PNG, or WEBP'));
}});

export const eventUpload=multer({storage,limits:{fileSize:10*1024*1024},fileFilter:(_,file,cb)=>{
  if(file.fieldname==='poster' && /^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null,true);
  cb(new Error('Only poster uploads are supported. Use JPG, PNG, or WEBP.'));
}});
