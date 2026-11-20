import { getStore } from '@netlify/blobs';
import { randomUUID } from 'node:crypto';
import { error,json,sameOrigin,hasSession } from './lib/utils.mjs';
export default async (request)=>{
  if(request.method!=='POST')return error('지원하지 않는 요청입니다.',405);
  if(!sameOrigin(request)||!hasSession(request))return error('관리자 인증이 필요합니다.',403);
  try{
    if(Number(request.headers.get('content-length')||0)>6*1024*1024)return error('파일은 최대 5MB입니다.',413);
    const form=await request.formData();const file=form.get('file');
    if(!(file instanceof File))return error('이미지 파일이 없습니다.');
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    if(!ext)return error('JPG, PNG, WebP 형식만 사용할 수 있습니다.');
    if(file.size>5*1024*1024||file.size<50)return error('이미지는 5MB 이하로 선택해 주세요.');
    const key=randomUUID().replace(/-/g,'')+'.'+ext;
    const store=getStore('janakkena-media');
    await store.set(key,await file.arrayBuffer());
    return json({url:'/.netlify/functions/media?key='+key});
  }catch(e){return error('이미지를 저장하지 못했습니다: '+e.message,400)}
}
