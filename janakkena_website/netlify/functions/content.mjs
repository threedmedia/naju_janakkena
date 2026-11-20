import { json,error,sameOrigin,requestJSON,hasSession } from './lib/utils.mjs';
import { readCatalog,writeCatalog,validateCatalog } from './lib/catalog.mjs';
export default async (request)=>{
  if(request.method==='GET'){
    try{return json(await readCatalog())}catch(e){return error('컬렉션 데이터를 불러오지 못했습니다.',503)}
  }
  if(request.method!=='POST')return error('지원하지 않는 요청입니다.',405);
  if(!sameOrigin(request)||!hasSession(request))return error('관리자 인증이 필요합니다.',403);
  try{const next=validateCatalog(await requestJSON(request));await writeCatalog(next);return json({ok:true,content:next})}
  catch(e){return error(e.message||'저장에 실패했습니다.',400)}
}
