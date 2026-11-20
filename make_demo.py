from pathlib import Path
import json,base64,re
root=Path('/mnt/data/janakkena_website')
source=root/'public';assets=source/'assets'
html=(source/'index.html').read_text()
css=(assets/'styles.css').read_text();js=(assets/'app.js').read_text();data=json.loads((source/'catalog.json').read_text())
def uri(name):
    path=assets/name
    t='image/png' if name.endswith('.png') else 'image/webp'
    return f'data:{t};base64,{base64.b64encode(path.read_bytes()).decode()}'
lookup={p['image']:uri(p['image'].split('/')[-1]) for p in data['products']}
for p in data['products']:p['image']=lookup[p['image']]
css=css.replace("url('boat.webp')", "url('"+uri('boat.webp')+"')")
html=html.replace('<link rel="stylesheet" href="assets/styles.css" />', '<style>\n'+css+'\n</style>')
html=html.replace('href="assets/favicon.png"','href="'+uri('favicon.png')+'"')
html=html.replace('src="assets/logo-mark.png"','src="'+uri('logo-mark.png')+'"')
html=html.replace('src="assets/logo.png"','src="'+uri('logo.png')+'"')
html=html.replace('src="assets/cap.webp"','src="'+uri('cap.webp')+'"')
html=html.replace('<script src="assets/catalog.js" defer></script>','<script>window.JANAKKENA_DEFAULT='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';</script>')
html=html.replace('<script src="assets/app.js" defer></script>','')
js=js.replace("/^\\/?assets\\/[a-zA-Z0-9._/-]+$/.test(v)","/^\\/?assets\\/[a-zA-Z0-9._/-]+$/.test(v)||/^data:image\\/webp;base64,[a-zA-Z0-9+/=]+$/.test(v)")
html=html.replace('</body>','<script>\n'+js+'\n</script>\n</body>')
(root.parent/'자나깨나_웹사이트_바로보기.html').write_text(html,encoding='utf-8')
print('standalone bytes',len(html))
