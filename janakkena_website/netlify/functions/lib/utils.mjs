import { createHmac, createHash, timingSafeEqual, randomUUID } from 'node:crypto';

export const json = (data,status=200,headers={}) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
export const error = (message,status=400)=>json({error:message},status);
export function sameOrigin(request){
  const origin=request.headers.get('origin');
  if(!origin)return false;
  try{return new URL(origin).host===new URL(request.url).host && new URL(origin).protocol===new URL(request.url).protocol}catch{return false}
}
export async function requestJSON(request){
  const ct=request.headers.get('content-type')||'';
  if(!ct.includes('application/json'))throw Error('JSON 요청 형식이 아닙니다.');
  if(Number(request.headers.get('content-length')||0)>120000)throw Error('요청 크기가 너무 큽니다.');
  return request.json();
}
const COOKIE='janakkena_admin';
const secret=()=>process.env.SESSION_SECRET||'';
const signing=(msg)=>createHmac('sha256',secret()).update(msg).digest('base64url');
export function isConfigured(){return secret().length>=32 && !!process.env.ADMIN_PIN}
export function makeCookie(request){
  const payload=Buffer.from(JSON.stringify({exp:Date.now()+12*60*60*1000,seed:randomUUID()})).toString('base64url');
  const token='v1.'+payload+'.'+signing('v1.'+payload);
  const secure=new URL(request.url).protocol==='https:'?'; Secure':'';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure}`;
}
export function clearCookie(request){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`}
export function hasSession(request){
  if(!isConfigured())return false;
  try{
    const cookie=(request.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(x=>x.startsWith(COOKIE+'='));
    if(!cookie)return false;
    const token=cookie.slice(COOKIE.length+1);const parts=token.split('.');if(parts.length!==3||parts[0]!=='v1')return false;
    const signature=signing('v1.'+parts[1]);const a=Buffer.from(signature),b=Buffer.from(parts[2]);
    if(a.length!==b.length||!timingSafeEqual(a,b))return false;
    const p=JSON.parse(Buffer.from(parts[1],'base64url').toString('utf8'));
    return typeof p.exp==='number' && p.exp>Date.now();
  }catch{return false}
}
export function safeEqual(a,b){const x=createHash('sha256').update(String(a)).digest(),y=createHash('sha256').update(String(b)).digest();return timingSafeEqual(x,y)}
export function keyForClient(request){const ip=request.headers.get('x-nf-client-connection-ip')||request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';return createHash('sha256').update(ip).digest('hex').slice(0,32)}
export function safeImage(src){return typeof src==='string' && ( /^\/?assets\/[A-Za-z0-9._/-]+$/.test(src) || /^\/\.netlify\/functions\/media\?key=[A-Za-z0-9_-]{1,100}\.(png|jpg|webp)$/.test(src) || /^https:\/\/[^\s]{1,1600}$/i.test(src))}
export function validYoutubeUrl(raw){if(raw==='')return true;try{const u=new URL(raw);if(u.protocol!=='https:')return false;const h=u.hostname.toLowerCase();let id='';if(['youtu.be','www.youtu.be'].includes(h))id=u.pathname.slice(1).split('/')[0];else if(['www.youtube.com','youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h))id=u.pathname==='/watch'?u.searchParams.get('v'):(u.pathname.match(/^\/(shorts|embed|live)\/([^/]+)/)||[])[2];return /^[A-Za-z0-9_-]{11}$/.test(id||'')}catch{return false}}
