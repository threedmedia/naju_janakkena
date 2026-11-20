import { getStore } from '@netlify/blobs';
import { safeImage,validYoutubeUrl } from './utils.mjs';

const defaultCatalog = {
  "brandTitle": "시간을 품은 나주, 오늘의 명작이 되다.",
  "brandSubtitle": "자랑스런 나주알기 · 나주의 보물과 이야기를 현대적인 오브제로 재창작하는 디지털 럭셔리 컬렉션",
  "youtubeUrl": "https://youtu.be/N840CKxs1XA",
  "products": [
    {
      "id": "golden-boat",
      "title": "영산강 황포돛배 오브제",
      "english": "YEONGSAN RIVER EDITION",
      "category": "heritage",
      "price": "₩15,000,000",
      "image": "assets/boat.webp",
      "description": "영산강을 오가던 황포돛배에서 영감을 얻어, 나주의 물길과 교류의 기억을 화려한 오브제로 다시 표현했습니다.",
      "heritage": "황포돛배는 영산강의 역사적인 수운 문화를 떠올리게 합니다. 이 작품은 실제 문화재의 복제품이 아닌 창작 콘셉트입니다."
    },
    {
      "id": "royal-cap",
      "title": "금동관 모티브 헤리티지 캡",
      "english": "GILT-BRONZE CROWN EDITION",
      "category": "heritage",
      "price": "₩8,900,000",
      "image": "assets/cap.webp",
      "description": "나주의 금동관을 현대 패션 아이템으로 재해석한 크라운 장식 캡. 역사와 일상의 경계를 새롭게 디자인했습니다.",
      "heritage": "나주 신촌리 금동관과 같이 나주 지역의 고대 문화유산이 주는 장엄한 인상에서 착안했습니다. 실제 유물의 정확한 복원 제품은 아닙니다."
    },
    {
      "id": "horse-toy",
      "title": "모노그램 말 아트토이",
      "english": "HERITAGE HORSE ART TOY",
      "category": "arttoy",
      "price": "₩4,900,000",
      "image": "assets/horse.webp",
      "description": "익숙한 말 인형에 클래식한 패턴과 금빛 장식을 더한 소장용 아트토이 컬렉션.",
      "heritage": "전통과 현대 장식의 조합을 실험하는 창작 오브제로, 특정 역사 유물을 직접 재현한 상품은 아닙니다."
    },
    {
      "id": "pet-set",
      "title": "프리미엄 펫 목걸이 세트",
      "english": "COMPANION SIGNATURE",
      "category": "lifestyle",
      "price": "₩3,900,000",
      "image": "assets/pet.webp",
      "description": "가죽 질감과 골드 하드웨어를 조합해 반려동물의 일상에 특별함을 더한 콘셉트 세트.",
      "heritage": "나주의 문화유산을 일상의 다양한 물건으로 확장하는 프로젝트의 라이프스타일 재창작 사례입니다."
    },
    {
      "id": "cleats-classic",
      "title": "브라운 모노그램 축구화",
      "english": "THE CLASSIC CLEATS",
      "category": "fashion",
      "price": "₩6,900,000",
      "image": "assets/cleats-brown.webp",
      "description": "전통적 브라운과 골드 디테일을 스포츠 슈즈 디자인에 대담하게 결합한 아트 풋웨어.",
      "heritage": "역사적 물건을 직접 복원한 것이 아닌, 지역 문화 기반 브랜드의 현대적 확장 가능성을 보여주는 디자인 시안입니다."
    },
    {
      "id": "cleats-gold",
      "title": "골드 에디션 축구화",
      "english": "GOLDEN LEGACY CLEATS",
      "category": "fashion",
      "price": "₩7,900,000",
      "image": "assets/cleats-gold.webp",
      "description": "빛의 각도에 따라 달라지는 금빛 소재감과 섬세한 장식으로 완성한 럭셔리 스포츠 콘셉트.",
      "heritage": "나주의 문화유산이 주는 금속 공예의 인상을 현대 패션으로 옮긴 창작 시안입니다."
    },
    {
      "id": "clogs",
      "title": "헤리티지 모노그램 crocs",
      "english": "THE EVERYDAY ICON",
      "category": "lifestyle",
      "price": "₩1,900,000",
      "image": "assets/clogs.webp",
      "description": "편안한 데일리 슈즈에 금빛 장식과 브라운 패턴을 더해 새롭게 상상한 캐주얼 컬렉션.",
      "heritage": "지역 스토리텔링을 데일리 굿즈로 전개하는 창작 제안이며 특정 문화재 복원물은 아닙니다."
    },
    {
      "id": "sneakers",
      "title": "모노그램 프리미엄 스니커즈",
      "english": "NAJU ATELIER SNEAKERS",
      "category": "fashion",
      "price": "₩3,900,000",
      "image": "assets/sneakers.webp",
      "description": "고전적인 모노그램과 현대적 스니커즈 실루엣을 접목한 프리미엄 컨셉 슈즈.",
      "heritage": "지역 브랜딩을 일상 패션으로 확장한 시각화 작업입니다. 소개 이미지는 AI 제작 콘셉트 시안입니다."
    }
  ]
};
export async function readCatalog(){
  const store=getStore('janakkena-content');
  const content=await store.get('catalog-v1',{type:'json',consistency:'strong'});
  return content || structuredClone(defaultCatalog);
}
export async function writeCatalog(content){
  const store=getStore('janakkena-content');
  await store.setJSON('catalog-v1',content);
}
export function validateCatalog(obj){
  if(!obj||typeof obj!=='object')throw Error('잘못된 콘텐츠입니다.');
  if(typeof obj.brandTitle!=='string'||obj.brandTitle.length>100)throw Error('메인 문구가 너무 깁니다.');
  if(typeof obj.brandSubtitle!=='string'||obj.brandSubtitle.length>250)throw Error('브랜드 설명이 너무 깁니다.');
  if(typeof obj.youtubeUrl!=='string'||obj.youtubeUrl.length>1000||!validYoutubeUrl(obj.youtubeUrl))throw Error('YouTube 영상 주소를 확인해 주세요.');
  if(!Array.isArray(obj.products)||obj.products.length<1||obj.products.length>100)throw Error('제품은 1~100개까지 등록할 수 있습니다.');
  const ids=new Set();
  const products=obj.products.map(p=>{
    if(!p||typeof p!=='object')throw Error('제품 정보가 잘못되었습니다.');
    const {id,title,english,category,price,image,description,heritage}=p;
    if(typeof id!=='string'||!/^[-a-z0-9]{3,65}$/.test(id)||ids.has(id))throw Error('제품 ID가 올바르지 않습니다.');ids.add(id);
    if(typeof title!=='string'||title.length<1||title.length>70)throw Error('제품명을 확인해 주세요.');
    if(typeof english!=='string'||english.length>100)throw Error('영문명이 너무 깁니다.');
    if(!['heritage','fashion','lifestyle','arttoy'].includes(category))throw Error('제품 분류가 올바르지 않습니다.');
    if(typeof price!=='string'||price.length>35)throw Error('제품 가격을 확인해 주세요.');
    if(!safeImage(image))throw Error('제품 이미지 주소가 올바르지 않습니다.');
    if(typeof description!=='string'||description.length>500)throw Error('제품 설명이 너무 깁니다.');
    if(typeof heritage!=='string'||heritage.length>800)throw Error('역사 설명이 너무 깁니다.');
    return {id,title,english,category,price,image,description,heritage};
  });
  return {brandTitle:obj.brandTitle,brandSubtitle:obj.brandSubtitle,youtubeUrl:obj.youtubeUrl,products};
}
