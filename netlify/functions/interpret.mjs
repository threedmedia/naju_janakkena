import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { error,json,sameOrigin,requestJSON,keyForClient } from './lib/utils.mjs';
import { readCatalog } from './lib/catalog.mjs';
export default async (request)=>{
  if(request.method!=='POST')return error('지원하지 않는 요청입니다.',405);
  if(!sameOrigin(request))return error('허용되지 않은 요청입니다.',403);
  try{
    const body=await requestJSON(request);
    const content=await readCatalog();const p=content.products.find(x=>x.id===body.id);
    if(!p)return error('해당 제품을 찾을 수 없습니다.',404);
    const fallback=`${p.title}은(는) ${p.description}\n\n문화유산과 창작의 연결: ${p.heritage}\n\n이 이미지는 나주의 문화적 이야기에서 영감을 받은 창작 콘셉트입니다. 실제 유물의 정밀한 복제품이나 특정 브랜드의 공식 제품은 아닙니다.`;
    if(!process.env.OPENAI_API_KEY)return json({ai:false,explanation:fallback});
    const key='review-'+createHash('sha256').update(p.id+p.title+p.description+p.heritage).digest('hex');
    const cache=getStore('janakkena-ai-cache');
    const cached=await cache.get(key,{type:'json',consistency:'strong'});
    if(cached?.text)return json({ai:true,explanation:cached.text,cached:true});
    const limits=getStore('janakkena-ai-limits');const limitKey='visitor-'+keyForClient(request);
    const old=await limits.get(limitKey,{type:'json',consistency:'strong'})||{count:0,until:Date.now()+60*60*1000};
    const limit=old.until>Date.now()?old:{count:0,until:Date.now()+60*60*1000};
    if(limit.count>=8)return json({ai:false,explanation:fallback+'\n\n※ AI 해설 요청 한도에 도달하여 기본 해설을 표시합니다.'});
    limit.count++;await limits.setJSON(limitKey,limit);
    const instructions='당신은 나주 문화유산 디지털 전시관의 친절하고 품위 있는 한국어 큐레이터입니다. 제공된 제품과 역사 모티브 설명만을 사실적 근거로 사용하세요. 역사적 사실과 AI 창작 상상물을 명확히 구분하고, 확인되지 않은 유래, 연도, 인물, 문화재 지정 여부를 지어내지 마세요. 공식 명품 브랜드의 제품이나 제휴라고 표현하지 마세요. 관객이 이해하기 쉽게 3개의 짧은 단락, 총 220~360자 분량으로 설명하세요. 마크다운 기호는 사용하지 마세요.';
    const payload={model:process.env.OPENAI_MODEL||'gpt-5.4-mini',instructions,input:`제품명: ${p.title}\n제품 소개: ${p.description}\n역사적 모티브 정보: ${p.heritage}\n이 제품을 방문객에게 해설해 주세요.`,max_output_tokens:550};
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(19000)});
    if(!r.ok)return json({ai:false,explanation:fallback+'\n\n※ AI 응답을 불러오지 못해 사전 해설을 표시합니다.'});
    const data=await r.json();
    const text=(data.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim();
    if(!text)return json({ai:false,explanation:fallback});
    await cache.setJSON(key,{text});return json({ai:true,explanation:text});
  }catch(e){return error('해설을 준비하지 못했습니다: '+e.message,500)}
}
