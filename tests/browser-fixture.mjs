// Local synthetic browser regression harness. No WhatsApp account or real contacts.
// node tests/browser-fixture.mjs, then http://localhost:3019
import http from 'node:http';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const variants={'source':'src/privacy.js','chrome':'dist/chrome/privacy.js','firefox':'dist/firefox/privacy.js','edge':'dist/edge/privacy.js','obfuscated':'dist/console.obfuscated.js'};
http.createServer((req,res)=>{
 const key=new URL(req.url,'http://localhost').searchParams.get('variant')||'chrome';
 const code=readFileSync(new URL(variants[key]||variants.chrome,root),'utf8');
 res.setHeader('Content-Type','text/html; charset=utf-8');
 res.end(`<!doctype html><html><head><title>Privacy scroll regression fixture</title><style>
 body{font:16px system-ui;margin:20px;background:#f0f4f8;color:#17212b} #main{width:700px;position:relative} #scroller{height:260px;overflow:auto;border:1px solid #ccc;background:white} [role=row]{height:60px;padding:10px;box-sizing:border-box;border-bottom:1px solid #ddd} header{height:40px;display:flex;align-items:center;gap:12px} header span{flex:1} header button{width:32px;height:32px} #marker{position:absolute;top:0;left:0;width:1px;height:1px} #result{white-space:pre-wrap;margin-top:20px} a{color:#17212b}
 </style></head><body><h1>Privacy scroll regression fixture</h1><p>Synthetic messages only. Variant: ${key}</p><button id="run">Run checks</button><div id="main"><header data-testid="conversation-header"><span data-testid="drawer-title-body">Fixture chat</span><button id="wa-menu" aria-label="WhatsApp menu">⋮</button><button aria-label="New chat">+</button></header><div id="scroller"></div><footer>Composer remains visible</footer></div><pre id="result">Ready</pre><script>
 const scroller=document.getElementById('scroller');
 function messages(){scroller.replaceChildren();for(let i=0;i<60;i++){const row=document.createElement('div');row.setAttribute('role','row');const link=document.createElement('a');link.href='#';link.textContent='Synthetic message '+i;row.append(link);if(i===25){const marker=document.createElement('span');marker.id='marker';row.append(marker);}scroller.append(row);}}
 messages();scroller.scrollTop=1500;
 function runRuntime(){(function(location){${code.replaceAll('</script','<\\/script')}
 })({hostname:'web.whatsapp.com',protocol:'https:'});}
 const frame=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 document.getElementById('run').onclick=async()=>{const result=document.getElementById('result');const checks=[];const check=(ok,label)=>{checks.push((ok?'PASS ':'FAIL ')+label);if(!ok)throw Error(label);};try{
 scroller.scrollTop=1500;await frame();const row=scroller.children[25];const before={top:scroller.scrollTop,height:scroller.scrollHeight,offset:row.offsetTop,parent:document.getElementById('marker').offsetParent};runRuntime();await frame();
 const shieldRect=document.getElementById('rs-whatsapp-privacy-toolbar').getBoundingClientRect();const menuRect=document.getElementById('wa-menu').getBoundingClientRect();check(shieldRect.right < menuRect.left,'shield stays clear of WhatsApp menu in flex header');check(scroller.scrollTop===before.top,'initial scroll position unchanged');check(scroller.scrollHeight===before.height,'scroll height unchanged');check(row.offsetTop===before.offset,'row offset unchanged');check(document.getElementById('marker').offsetParent===before.parent,'positioned descendant containing block unchanged');check(getComputedStyle(row).filter==='none','no filter applied to message row');
 const popup=document.getElementById('rs-whatsapp-privacy-popup').shadowRoot;const toggle=popup.querySelector('button');const mode=popup.querySelector('[aria-label="Chat blur mode"]');const layers=()=>[...document.getElementById('rs-whatsapp-privacy-layers').shadowRoot.children].filter(x=>!x.hidden);
 check(layers().length>0,'visible rows have separate blur masks');
 const archive=document.createElement('section');archive.setAttribute('role','grid');archive.style.cssText='position:fixed;right:20px;top:200px;width:300px;background:white';archive.innerHTML='<div role="row">Synthetic archived chat A</div><div role="row">Synthetic archived chat B</div>';document.body.append(archive);await frame();
 const archiveMaskCount=layers().length;check(archiveMaskCount>=3,'archived grid outside side panel receives masks');
 archive.firstChild.tabIndex=0;archive.firstChild.focus({preventScroll:true});await frame();check(layers().length===archiveMaskCount-1,'focused archived chat reveals independently');
 document.getElementById('run').focus({preventScroll:true});archive.remove();await frame();check(layers().length===archiveMaskCount-2,'closing archive removes its masks');
 check(getComputedStyle(layers()[0]).backdropFilter.includes('blur'),'browser renders backdrop blur');
 row.querySelector('a').focus({preventScroll:true});await frame();check(layers().length===0,'entire chat reveals on focus');mode.value='messages';mode.dispatchEvent(new Event('change'));await frame();check(layers().length>0,'individual mode keeps other messages blurred');
 document.getElementById('run').focus({preventScroll:true});await frame();
 for(let i=0;i<10;i++){toggle.click();await frame();toggle.click();await frame();check(scroller.scrollTop===before.top,'toggle cycle '+i+' preserves scroll');}
 for(let i=0;i<5;i++){messages();scroller.scrollTop=1200+i*60;const expected=scroller.scrollTop;await frame();check(scroller.scrollTop===expected,'chat replacement '+i+' preserves restored scroll');}
 runRuntime();await frame();check(document.querySelectorAll('#rs-whatsapp-privacy-layers').length===1,'rerun replaces old layers');
 document.getElementById('rs-whatsapp-privacy-toolbar').dispatchEvent(new Event('rs-whatsapp-privacy-remove'));await frame();check(!document.getElementById('rs-whatsapp-privacy-layers'),'cleanup removes masks');
 result.textContent=checks.join('\\n')+'\\nALL CHECKS PASSED';}catch(error){result.textContent=checks.join('\\n')+'\\nERROR: '+error.message;}};
 </script></body></html>`);
}).listen(3019,'127.0.0.1',()=>console.log('Fixture: http://localhost:3019/?variant=chrome'));
