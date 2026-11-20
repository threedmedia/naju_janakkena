(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const CATALOG_URL = 'catalog.json';
  const CONTENT_API = '/.netlify/functions/content';
  const AUTH_API = '/.netlify/functions/auth';
  const UPLOAD_API = '/.netlify/functions/upload';
  const AI_API = '/.netlify/functions/interpret';
  const LOCAL_KEY = 'janakkena-demo-content-v3';
  const CAT = {heritage:'NAJU HERITAGE', fashion:'FASHION EDITION', lifestyle:'LIFESTYLE', arttoy:'ART TOY'};
  let current = {brandTitle:'시간을 품은 나주, 오늘의 명작이 되다.',brandSubtitle:'',youtubeUrl:'',products:[]};
  let activeCategory = 'all', activeProduct = null, selectedProductId = null;
  let live = false, authorized = false, editingNew = false, toastTimer;
  const deepCopy = o => JSON.parse(JSON.stringify(o));
  const safeString = (s,max=1000)=>String(s??'').slice(0,max);
  const fmtPrice = price => {
    const p = String(price ?? '').trim();
    if (!p) return '가격 문의';
    if (/^\d{1,10}$/.test(p)) return Number(p).toLocaleString('ko-KR')+'원';
    return p;
  };
  const safeImage = url => {
    if (typeof url!=='string') return 'assets/boat.webp';
    const v=url.trim();
    if (/^\/?assets\/[a-zA-Z0-9._/-]+$/.test(v)||/^\/\.netlify\/functions\/media\?key=[a-zA-Z0-9_-]{1,100}\.(png|jpg|webp)$/.test(v)||/^https:\/\//i.test(v))return v;
    return 'assets/boat.webp';
  };
  function toast(msg){let t=$('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),3000)}
  async function req(url,opts={}){const response=await fetch(url,{credentials:'same-origin',...opts});let value;try{value=await response.json()}catch{value={error:'서버 응답을 확인할 수 없습니다.'}}if(!response.ok)throw Error(value.error||'요청에 실패했습니다.');return value}
  async function boot(){
    let fallback;
    try {const r=await fetch(CATALOG_URL,{cache:'no-store'});if(!r.ok)throw Error('catalog');fallback=await r.json()}catch{fallback=window.JANAKKENA_DEFAULT ? deepCopy(window.JANAKKENA_DEFAULT) : {...current}}
    if(location.protocol!=='file:'){
      try {const data=await req(CONTENT_API);if(data?.products?.length){current=data;live=true}} catch{}
    }
    if(!live){let cached=null;try{cached=localStorage.getItem(LOCAL_KEY)}catch{}try{current=cached?JSON.parse(cached):fallback}catch{current=fallback}}
    if(!current?.products)current=fallback;
    renderAll();wireEvents();
  }
  function localPersist(){try{localStorage.setItem(LOCAL_KEY,JSON.stringify(current))}catch{toast('브라우저 저장소를 사용할 수 없어 이번 화면에만 반영됩니다.')}}
  async function saveChanges(next){
    if(live){const result=await req(CONTENT_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(next)});current=result.content}
    else{current=deepCopy(next);localPersist()}
    renderAll();
  }
  function renderAll(){renderHero();renderProducts();renderVideo();populateProductList()}
  function renderHero(){ $('heroTitle').textContent=safeString(current.brandTitle,100);$('heroSubtitle').textContent=safeString(current.brandSubtitle,250)}
  function renderProducts(){
    const grid=$('productGrid');grid.replaceChildren();let products=current.products.filter(p=>activeCategory==='all'||p.category===activeCategory);
    $('productCounter').textContent=String(products.length).padStart(2,'0')+' OBJECTS';
    products.forEach((p,i)=>{
      const b=document.createElement('button');b.type='button';b.className='product-card';b.setAttribute('aria-label',p.title+' 자세히 보기');
      const wrap=document.createElement('div');wrap.className='product-thumb';
      const img=document.createElement('img');img.src=safeImage(p.image);img.loading='lazy';img.alt=p.title;wrap.append(img);
      const idx=document.createElement('span');idx.className='product-index';idx.textContent='No. '+String(i+1).padStart(2,'0');wrap.append(idx);
      const quick=document.createElement('span');quick.className='product-quick';quick.textContent='+';wrap.append(quick);
      const cat=document.createElement('div');cat.className='product-cat';cat.textContent=CAT[p.category]||'COLLECTION';
      const title=document.createElement('div');title.className='product-title';title.textContent=p.title;
      const en=document.createElement('div');en.className='product-eng';en.textContent=p.english||'JANAKKENA EDITION';
      const price=document.createElement('div');price.className='product-price';const val=document.createElement('span');val.textContent=fmtPrice(p.price);const arrow=document.createElement('span');arrow.textContent='↗';price.append(val,arrow);
      b.append(wrap,cat,title,en,price);b.addEventListener('click',()=>openProduct(p.id));grid.append(b)
    });
    if(!products.length){const empty=document.createElement('p');empty.textContent='해당 분류에 등록된 제품이 없습니다.';grid.append(empty)}
  }
  function youtubeId(url){
    if(!url)return '';
    try{const u=new URL(url);const h=u.hostname.toLowerCase();let id='';
      if(h==='youtu.be'||h==='www.youtu.be')id=u.pathname.slice(1).split('/')[0];
      else if(['www.youtube.com','youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h)){
        id=u.pathname==='/watch'?u.searchParams.get('v'):(u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)||[])[1]||'';
      }
      return /^[a-zA-Z0-9_-]{11}$/.test(id)?id:'';
    }catch{return ''}
  }
  function renderVideo(){
    const mount=$('videoMount');mount.replaceChildren();
    const id=youtubeId(current.youtubeUrl);
    let external=$('videoExternalLink');
    if(!external){
      external=document.createElement('a');external.id='videoExternalLink';
      external.target='_blank';external.rel='noopener noreferrer';
      external.style.cssText='display:block;margin:12px auto 0;text-align:center;color:#8a6b42;font-size:12px;text-decoration:underline;text-underline-offset:4px';
      mount.insertAdjacentElement('afterend',external);
    }
    external.hidden=!id;external.style.display=id?'block':'none';
    if(id){
      external.href='https://www.youtube.com/watch?v='+id;
      external.textContent='영상이 재생되지 않나요? YouTube에서 직접 보기 ↗';
      if(location.protocol==='file:'){
        // A file:// page cannot send the HTTP Referer expected by YouTube (player error 153).
        const placeholder=document.createElement('div');placeholder.className='placeholder';
        const icon=document.createElement('div');icon.className='placeholder-play';icon.textContent='▶';
        const title=document.createElement('div');title.className='video-placeholder-title';title.textContent='JANAKKENA BRAND FILM';
        const note=document.createElement('small');note.textContent='HTML 파일 직접 열기에서는 YouTube 오류 153이 발생할 수 있습니다. Netlify에 배포하면 웹사이트 안에서 재생됩니다.';
        note.style.cssText='max-width:440px;line-height:1.7;text-align:center';
        placeholder.append(icon,title,note);mount.append(placeholder);
      }else{
        const iframe=document.createElement('iframe');
        iframe.src='https://www.youtube.com/embed/'+id+'?rel=0';
        iframe.title='자나깨나 브랜드 영상';
        iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy='strict-origin-when-cross-origin';
        iframe.allowFullscreen=true;iframe.loading='lazy';
        mount.append(iframe);
      }
    }else{
      const placeholder=document.createElement('div');placeholder.className='placeholder';
      const icon=document.createElement('div');icon.className='placeholder-play';icon.textContent='▶';
      const name=document.createElement('div');name.className='video-placeholder-title';name.textContent='THE STORIES WE CARRY';
      const sub=document.createElement('small');sub.textContent='브랜드 필름이 곧 공개됩니다';
      placeholder.append(icon,name,sub);mount.append(placeholder);
    }
  }
  function lockScroll(){document.body.classList.add('modal-open')}
  function unlockScroll(){if($('productModal').hidden&&!$('adminDrawer').classList.contains('is-open'))document.body.classList.remove('modal-open')}
  function openProduct(id){const p=current.products.find(x=>x.id===id);if(!p)return;activeProduct=id;
    $('modalImage').src=safeImage(p.image);$('modalImage').alt=p.title+' 확대 이미지';$('modalImage').classList.remove('zoomed');$('zoomToggle').textContent='＋ 이미지 확대';
    $('modalTitle').textContent=p.title;$('modalEnglish').textContent=p.english||'';$('modalCategory').textContent=CAT[p.category]||'COLLECTION';
    $('modalDescription').textContent=p.description||'제품 설명이 곧 등록됩니다.';$('modalPrice').textContent=fmtPrice(p.price);
    $('modalHeritage').textContent=p.heritage||'이 컬렉션의 창작 배경과 문화 이야기는 준비 중입니다.';
    $('aiOutput').hidden=true;$('aiOutput').replaceChildren();$('aiGenerate').disabled=false;
    $('productModal').hidden=false;lockScroll();$('closeProduct').focus();generateAI();
  }
  function closeProduct(){ $('productModal').hidden=true;activeProduct=null;unlockScroll()}
  async function generateAI(){const p=current.products.find(x=>x.id===activeProduct);if(!p)return;
    const btn=$('aiGenerate'),out=$('aiOutput');btn.disabled=true;out.hidden=false;out.textContent='큐레이터 해설을 준비하고 있습니다…';
    if(!live){out.textContent='[큐레이터 사전 해설 · 체험 모드]\n\n'+p.title+'은(는) '+p.description+'\n\n모티브 이야기: '+(p.heritage||'지역 문화와 현대 디자인의 연결을 생각해 보세요.')+'\n\n실제 생성형 AI 해설은 Netlify 배포 및 OPENAI_API_KEY 서버 설정 후 사용할 수 있습니다.';btn.disabled=false;return}
    try{const d=await req(AI_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:p.id})});out.textContent=(d.ai?'[AI 큐레이터 해설]':'[큐레이터 해설]')+'\n\n'+d.explanation}
    catch(e){out.textContent='[큐레이터 기본 해설]\n\n'+(p.heritage||p.description)+'\n\nAI 연결 안내: '+e.message}
    finally{btn.disabled=false}
  }
  function openAdmin(){ $('adminBackdrop').hidden=false;$('adminDrawer').classList.add('is-open');$('adminDrawer').setAttribute('aria-hidden','false');lockScroll();$('pinInput').value='';$('loginStatus').textContent='';$('adminClose').focus();checkSession()}
  function closeAdmin(){$('adminBackdrop').hidden=true;$('adminDrawer').classList.remove('is-open');$('adminDrawer').setAttribute('aria-hidden','true');unlockScroll()}
  async function checkSession(){if(!live){authorized=false;showLogin();return}try{const d=await req(AUTH_API);authorized=!!d.authenticated}catch{authorized=false}authorized?showEditor():showLogin()}
  function showLogin(){$('loginScreen').hidden=false;$('editorScreen').hidden=true}
  function showEditor(){ $('loginScreen').hidden=true;$('editorScreen').hidden=false;$('modeLabel').textContent=live?'전체 방문자에게 변경 사항이 반영됩니다':'로컬 데모 · 이 브라우저만 변경됩니다';fillSettings();populateProductList();loadSelectedProduct()}
  async function login(){const pin=$('pinInput').value.trim();$('loginStatus').textContent='';
    if(!live){if(pin!=='7777'){$('loginStatus').textContent='비밀번호가 올바르지 않습니다.';return}authorized=true;showEditor();return}
    try{await req(AUTH_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});authorized=true;showEditor()}catch(e){$('loginStatus').textContent=e.message}
  }
  async function logout(){if(live){try{await req(AUTH_API,{method:'DELETE'})}catch{}}authorized=false;showLogin()}
  function fillSettings(){$('editTitle').value=current.brandTitle||'';$('editSubtitle').value=current.brandSubtitle||'';$('editYoutube').value=current.youtubeUrl||''}
  function populateProductList(){const sel=$('editProductSelect');sel.replaceChildren();current.products.forEach(p=>{let o=document.createElement('option');o.value=p.id;o.textContent=p.title;sel.append(o)});if(selectedProductId&&current.products.some(p=>p.id===selectedProductId))sel.value=selectedProductId;else if(current.products[0]){sel.value=current.products[0].id;selectedProductId=sel.value}}
  function loadSelectedProduct(){editingNew=false;const p=current.products.find(x=>x.id===$('editProductSelect').value);if(!p)return;selectedProductId=p.id;$('editProductName').value=p.title||'';$('editProductCategory').value=p.category||'heritage';$('editProductPrice').value=p.price||'';$('editProductDesc').value=p.description||'';$('editProductHeritage').value=p.heritage||'';$('editProductImage').value=p.image||'';$('editImageFile').value='';$('deleteProduct').disabled=false}
  function setEditStatus(msg){$('editorStatus').textContent=msg;toast(msg)}
  async function saveSettings(){if(!authorized)return;const next=deepCopy(current);next.brandTitle=$('editTitle').value.trim();next.brandSubtitle=$('editSubtitle').value.trim();next.youtubeUrl=$('editYoutube').value.trim();if(next.youtubeUrl&&!youtubeId(next.youtubeUrl)){setEditStatus('올바른 YouTube 영상 링크를 입력해주세요.');return}try{await saveChanges(next);setEditStatus('브랜드 정보와 영상 링크를 저장했습니다.')}catch(e){setEditStatus('저장 실패: '+e.message)}}
  async function saveProduct(){if(!authorized)return;const name=$('editProductName').value.trim();if(!name){setEditStatus('제품명을 입력해주세요.');return}
    const next=deepCopy(current);const pid=editingNew?'p-'+Date.now().toString(36):selectedProductId;let prev=next.products.find(x=>x.id===pid);
    let image=$('editProductImage').value.trim();const file=$('editImageFile').files[0];
    if(file){if(!live){setEditStatus('로컬 데모에서는 이미지 파일 업로드를 지원하지 않습니다. 이미지 URL을 사용해 주세요.');return}
      if(file.size>5*1024*1024){setEditStatus('이미지는 5MB 이하로 선택해 주세요.');return}
      try{const form=new FormData();form.append('file',file);const result=await req(UPLOAD_API,{method:'POST',body:form});image=result.url}catch(e){setEditStatus('이미지 업로드 오류: '+e.message);return}
    }
    if(!image)image='assets/boat.webp';if(safeImage(image)!==image){setEditStatus('이미지 경로는 /assets/... 또는 https://... 형식이어야 합니다.');return}
    const p={id:pid,title:name,english:prev?.english||'JANAKKENA EDITION',category:$('editProductCategory').value,price:$('editProductPrice').value.trim(),description:$('editProductDesc').value.trim(),heritage:$('editProductHeritage').value.trim(),image};
    if(editingNew)next.products.unshift(p);else{let index=next.products.findIndex(x=>x.id===pid);if(index<0){setEditStatus('선택된 제품이 없습니다.');return}next.products[index]=p}
    try{await saveChanges(next);selectedProductId=pid;editingNew=false;populateProductList();loadSelectedProduct();setEditStatus('제품 정보를 저장했습니다.')}catch(e){setEditStatus('저장 실패: '+e.message)}
  }
  function newProduct(){editingNew=true;selectedProductId=null;$('editProductSelect').value='';$('editProductName').value='';$('editProductPrice').value='';$('editProductDesc').value='';$('editProductHeritage').value='';$('editProductImage').value='';$('editImageFile').value='';$('editProductCategory').value='heritage';$('deleteProduct').disabled=true;setEditStatus('새 제품 정보를 입력한 다음 저장해 주세요.')}
  async function deleteProduct(){if(!authorized||editingNew)return;if(!confirm('선택한 제품을 목록에서 삭제하시겠습니까?'))return;const next=deepCopy(current);next.products=next.products.filter(x=>x.id!==selectedProductId);if(!next.products.length){setEditStatus('최소 1개 제품은 유지해야 합니다.');return}try{await saveChanges(next);selectedProductId=next.products[0]?.id;populateProductList();loadSelectedProduct();setEditStatus('제품을 삭제했습니다.')}catch(e){setEditStatus('삭제 실패: '+e.message)}}
  function wireEvents(){
    document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{activeCategory=b.dataset.category;document.querySelectorAll('[data-category]').forEach(x=>x.classList.toggle('active',x===b));renderProducts()}));
    $('closeProduct').addEventListener('click',closeProduct);$('productModal').addEventListener('click',e=>{if(e.target===$('productModal'))closeProduct()});
    $('zoomToggle').addEventListener('click',toggleZoom);$('modalImage').addEventListener('click',toggleZoom);
    $('aiGenerate').addEventListener('click',generateAI);$('adminOpen').addEventListener('click',openAdmin);$('adminClose').addEventListener('click',closeAdmin);$('adminBackdrop').addEventListener('click',closeAdmin);
    $('loginButton').addEventListener('click',login);$('pinInput').addEventListener('keydown',e=>{if(e.key==='Enter')login()});$('logoutButton').addEventListener('click',logout);
    $('saveSettings').addEventListener('click',saveSettings);$('editProductSelect').addEventListener('change',loadSelectedProduct);$('saveProduct').addEventListener('click',saveProduct);$('newProduct').addEventListener('click',newProduct);$('deleteProduct').addEventListener('click',deleteProduct);
    window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('productModal').hidden)closeProduct();else if($('adminDrawer').classList.contains('is-open'))closeAdmin()}});
  }
  function toggleZoom(){let img=$('modalImage');const zoom=img.classList.toggle('zoomed');$('zoomToggle').textContent=zoom?'－ 원래 크기로':'＋ 이미지 확대'}
  boot();
})();
