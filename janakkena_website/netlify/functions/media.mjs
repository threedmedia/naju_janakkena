import { getStore } from '@netlify/blobs';
import { error } from './lib/utils.mjs';
export default async (request)=>{
  if(request.method!=='GET')return error('지원하지 않는 요청입니다.',405);
  const key=new URL(request.url).searchParams.get('key')||'';
  if(!/^[a-f0-9]{32}\.(png|jpg|webp)$/.test(key))return error('이미지 주소가 올바르지 않습니다.',400);
  try{
    const blob=await getStore('janakkena-media').get(key,{type:'blob'});
    if(!blob)return error('이미지가 없습니다.',404);
    const type=key.endsWith('.png')?'image/png':key.endsWith('.jpg')?'image/jpeg':'image/webp';
    return new Response(blob,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=604800, immutable','X-Content-Type-Options':'nosniff'}})
  }catch{return error('이미지를 불러오지 못했습니다.',503)}
}
