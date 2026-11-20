import { getStore } from '@netlify/blobs';
import { json,error,sameOrigin,requestJSON,isConfigured,hasSession,safeEqual,makeCookie,clearCookie,keyForClient } from './lib/utils.mjs';

export default async (request)=>{
  if(request.method==='GET')return json({authenticated:hasSession(request)});
  if(!['POST','DELETE'].includes(request.method))return error('지원하지 않는 요청입니다.',405);
  if(!sameOrigin(request))return error('허용되지 않는 요청입니다.',403);
  if(request.method==='DELETE')return json({ok:true},200,{'Set-Cookie':clearCookie(request)});
  if(!isConfigured())return error('서버 관리자 설정이 완료되지 않았습니다. Netlify 환경 변수 ADMIN_PIN 및 SESSION_SECRET을 등록해 주세요.',503);
  try{
    const body=await requestJSON(request);
    const store=getStore('janakkena-login-attempts');
    const key='login-'+keyForClient(request);
    const attempt=await store.get(key,{type:'json',consistency:'strong'}) || {count:0,until:Date.now()+15*60*1000};
    const record=attempt.until>Date.now()?attempt:{count:0,until:Date.now()+15*60*1000};
    if(record.count>=5)return error('로그인 시도 제한에 도달했습니다. 15분 뒤 다시 시도해 주세요.',429);
    if(!safeEqual(body.pin,process.env.ADMIN_PIN)){
      record.count+=1;await store.setJSON(key,record);return error('관리자 비밀번호가 올바르지 않습니다.',401);
    }
    await store.setJSON(key,{count:0,until:Date.now()+15*60*1000});
    return json({ok:true},200,{'Set-Cookie':makeCookie(request)});
  }catch(e){return error(e.message||'로그인 요청을 처리하지 못했습니다.',400)}
}
