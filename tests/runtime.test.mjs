import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function fixture(hostname='web.whatsapp.com') {
  const nodes=[], observers=[], frames=new Map(), obstacles=[], overlays=[];let seq=0,target=null;
  class Element extends EventTarget {
    constructor(tag){super();Object.assign(this,{tag,children:[],attributes:{},style:{},dataset:{},hidden:false,hover:false,rect:{left:30,top:70,right:430,bottom:120,width:400,height:50}});nodes.push(this);}
    setAttribute(k,v){this.attributes[k]=v;}
    append(...items){items.forEach(item=>this.appendChild(item));}
    appendChild(item){item.remove();this.children.push(item);item.parentNode=this;return item;}
    remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this);this.parentNode=null;}
    attachShadow(){this.shadowRoot=new Element('shadow');return this.shadowRoot;}
    get isConnected(){return this===doc.body||this===doc.head||Boolean(this.parentNode?.isConnected);}
    get parentElement(){return this.parentNode;}
    getBoundingClientRect(){return this.rect;}
    get offsetWidth(){return 250;} get offsetHeight(){return 38;}
    focus(options){this.focusOptions=options;doc.activeElement=this;}
    contains(node){return node===this||this.children.some(c=>c.contains(node));}
    matches(){return this.hover;}
    closest(selector){if(selector==='#main')return this===main||main.contains(this)?main:null;return this.excluded?this:null;}
    querySelector(){return null;}
  }
  const doc=new EventTarget();doc.head=new Element('head');doc.body=new Element('body');
  const main=new Element('main'),row=new Element('row');doc.body.append(main);main.append(row);
  main.rect={left:0,top:0,right:800,bottom:600,width:800,height:600};
  doc.createElement=tag=>new Element(tag);doc.createElementNS=(_,tag)=>new Element(tag);
  doc.getElementById=id=>nodes.find(e=>e.id===id&&e.isConnected)||null;
  doc.querySelector=()=>target?.isConnected?target:null;
  doc.querySelectorAll=selector=>selector.startsWith('#side')?(row.isConnected?[row]:[]):selector.startsWith('[role="menu"]')?overlays:obstacles;
  doc.createTreeWalker=()=>{let done=false;return {nextNode(){if(done)return null;done=true;return {parentElement:target};}};};
  doc.createRange=()=>({selectNodeContents(){},getClientRects(){return [{left:30,right:130,top:20,bottom:50,width:100,height:30}];}});
  doc.elementFromPoint=()=>row;
  const win=new EventTarget();win.innerWidth=1000;win.innerHeight=700;
  const context={document:doc,window:win,location:{hostname,protocol:'https:'},Event,console,NodeFilter:{SHOW_TEXT:4},
    getComputedStyle:()=>({overflowX:'visible',overflowY:'visible'}),
    MutationObserver:class{constructor(cb){this.cb=cb;observers.push(this);}observe(){this.active=true;}disconnect(){this.active=false;}},
    ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},
    requestAnimationFrame:cb=>{frames.set(++seq,cb);return seq;},cancelAnimationFrame:id=>frames.delete(id)};
  return {doc,nodes,observers,context,frames,main,row,obstacles,overlays,
    run(code){vm.runInNewContext(code,context,{timeout:2000});this.flush();},
    flush(){const work=[...frames.values()];frames.clear();work.forEach(cb=>cb());},
    header(){target=new Element('header-title');doc.body.append(target);return target;},
    mutate(){for(const o of observers)if(o.active)o.cb([{target:main}]);this.flush();},
    button(label){return nodes.find(e=>e.attributes['aria-label']===label);},
    mask(){return doc.getElementById('rs-whatsapp-privacy-layers').shadowRoot.children[0];},
  };
}
for (const file of ['src/privacy.js','dist/chrome/privacy.js','dist/edge/privacy.js','dist/firefox/privacy.js','dist/chromium-obfuscated-local-only/privacy.js']) {
 const code=readFileSync(new URL('../'+file,import.meta.url),'utf8');
 test(file+': domain guard',()=>{const f=fixture('example.com');f.run(code);assert.equal(f.observers.length,0);assert.equal(f.doc.getElementById('rs-whatsapp-privacy-toolbar'),null);});
 test(file+': masks preserve rows, hover modes, clipping, remount and cleanup',()=>{
  const f=fixture();f.run(code);
  const mask=f.mask();assert.match(mask.style.cssText,/backdrop-filter:blur\(4px\)/);
  f.overlays.push({getBoundingClientRect:()=>({left:350,right:500,top:80,bottom:130,width:150,height:50})});f.mutate();assert.match(mask.style.cssText,/M320 10V50H400V10Z/);f.overlays.length=0;f.mutate();assert.doesNotMatch(mask.style.cssText,/M320/);
  assert.equal(Object.keys(f.row.style).length,0);assert.equal(f.row.children.length,0);
  const host=f.doc.getElementById('rs-whatsapp-privacy-toolbar');assert.equal(host.parentNode,f.doc.body);
  const title=f.header();f.mutate();assert.equal(host.parentNode,f.doc.body);assert.equal(title.children.length,0);assert.match(host.style.cssText,/left:138px/);
  f.obstacles.push({getBoundingClientRect:()=>({left:138,right:170,top:19,bottom:51,width:32,height:32})});f.mutate();assert.match(host.style.cssText,/left:12px;top:656px/);f.obstacles.length=0;f.mutate();assert.match(host.style.cssText,/left:138px/);
  assert.equal(f.button('Privacy settings').dataset.enabled,'true');
  const mode=f.button('Chat blur mode');assert.equal(mode.value,'chat');
  f.main.hover=true;f.mutate();assert.equal(mask.hidden,true);
  mode.value='messages';mode.dispatchEvent(new Event('change'));f.flush();assert.equal(mask.hidden,false);
  f.row.hover=true;f.mutate();assert.equal(mask.hidden,true);
  f.row.hover=false;f.mutate();assert.equal(mask.hidden,false);
  f.row.excluded=true;f.mutate();assert.equal(mask.parentNode,null);
  f.row.excluded=false;f.mutate();
  const toggle=f.button('Privacy blur');toggle.dispatchEvent(new Event('click'));f.flush();assert.equal(f.doc.getElementById('rs-whatsapp-privacy-layers').shadowRoot.children.length,0);
  assert.equal(f.button('Privacy settings').dataset.enabled,'false');
  toggle.dispatchEvent(new Event('click'));f.flush();
  const strength=f.button('Blur strength');strength.value='7';strength.dispatchEvent(new Event('change'));f.flush();assert.match(f.mask().style.cssText,/blur\(7px\)/);
  f.row.rect.top=-100;f.row.rect.bottom=-50;f.mutate();assert.equal(f.mask().hidden,true);
  f.row.rect.top=70;f.row.rect.bottom=120;f.mutate();assert.equal(f.mask().hidden,false);
  f.button('Privacy settings').dispatchEvent(new Event('click'));assert.equal(toggle.focusOptions.preventScroll,true);
  f.button('Close privacy settings').dispatchEvent(new Event('click'));assert.equal(f.button('Privacy settings').focusOptions.preventScroll,true);
  f.run(code);assert.equal(f.observers.filter(o=>o.active).length,1);
  f.doc.getElementById('rs-whatsapp-privacy-toolbar').dispatchEvent(new Event('rs-whatsapp-privacy-remove'));
  assert.equal(f.observers.filter(o=>o.active).length,0);assert.equal(f.frames.size,0);
  for(const suffix of ['toolbar','popup','layers'])assert.equal(f.doc.getElementById('rs-whatsapp-privacy-'+suffix),null);
 });
 test(file+': no scrolling, networking, storage or dynamic execution APIs',()=>{
  assert.doesNotMatch(code,/\b(fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|eval|scrollTo|scrollIntoView)\s*[.(]/);
  assert.doesNotMatch(code,/\.scrollTop\s*=/);
 });
}
test('store manifests scope access to WhatsApp',()=>{
 for(const browser of ['chrome','edge','firefox']) {
  const m=JSON.parse(readFileSync(new URL('../dist/'+browser+'/manifest.json',import.meta.url)));
  assert.equal(m.manifest_version,3);assert.equal(m.permissions,undefined);assert.equal(m.background,undefined);
  assert.deepEqual(m.content_scripts[0].matches,['https://web.whatsapp.com/*']);
  if(browser==='firefox')assert.deepEqual(m.browser_specific_settings.gecko.data_collection_permissions.required,['none']);
 }
});
