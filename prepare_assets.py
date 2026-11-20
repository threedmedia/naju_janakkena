from PIL import Image,ImageFilter
from pathlib import Path
import json
src=Path('/mnt/data'); dest=Path('/mnt/data/janakkena_website/public/assets')
files={
 'horse':'고급 TV 모노그램 플러시 말 쇼룸(3).png',
 'pet':'고급 골드 쇼룸의 디자이너 펫 목걸이 세트(3).png',
 'cleats-brown':'고급스러운 골드 모노그램 축구화 진열장(3).png',
 'boat':'고급스러운 골드 앤 브라운 디자이너 보트 전시관(3).png',
 'cap':'황금빛 왕관 장식 럭셔리 캡(3).png',
 'cleats-gold':'황금빛 토이 비통 축구화 부티크 전시(3).png',
 'clogs':'toy_vuitton_clogs(3).png',
 'sneakers':'toy_vuitton_sneakers(3).png',
}
for label,fn in files.items():
 im=Image.open(src/fn).convert('RGB'); im.thumbnail((1360,1200), Image.Resampling.LANCZOS)
 im.save(dest/(label+'.webp'), 'WEBP', quality=84, method=6)
 print(label,(dest/(label+'.webp')).stat().st_size)
log=Image.open(src/'금빛 JR 문양과 나주 한글 로고(1).png').convert('RGBA')
# Eliminate near-invisible colored fringe introduced by the generated transparent logo
r,g,b,a=log.split()
a=a.point(lambda x: max(0,min(255, round((x-14)*255/241))) if x>14 else 0)
log.putalpha(a)
full=log.crop((280,35,1250,955)); full.thumbnail((880,880),Image.Resampling.LANCZOS)
full.save(dest/'logo.png', optimize=True)
mark=log.crop((440,60,1110,545)); mark.thumbnail((440,360),Image.Resampling.LANCZOS)
mark.save(dest/'logo-mark.png', optimize=True)
# png favicon
ico=mark.copy(); ico.thumbnail((128,128),Image.Resampling.LANCZOS);ico.save(dest/'favicon.png', optimize=True)
