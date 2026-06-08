"use strict";

const svgData=svg=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);

const LOGOS={pagesmith:{u:PS_ICON,w:423,h:413},ro:{u:RO_LOGO,w:2400,h:1319},tactag:{u:TACTAG_LOGO,w:3181,h:924}};
document.getElementById('brandLogo').src = PS_WORD;
document.querySelectorAll('[data-logo-preview]').forEach(img=>{const m=LOGOS[img.dataset.logoPreview];if(m)img.src=m.u;});

/* ---------- theme variables ---------- */
const VARMAP={bandBg:'--band-bg',bandFg:'--band-fg',bandSub:'--band-sub',bandBB:'--band-bb',bandBBP:'--band-bbp',accent:'--accent',hColor:'--h-color',calloutBg:'--callout-bg',calloutBd:'--callout-bd',statNum:'--stat-num',statLab:'--stat-lab',statTxt:'--stat-txt',theadBg:'--thead-bg',theadFg:'--thead-fg',font:'--font',h3tt:'--h3-tt'};
const THEMES={
 ro:{name:'Odyssey',vars:{bandBg:'#15243f',bandFg:'#ffffff',bandSub:'#a9c4e3',bandBB:'none',bandBBP:'0',accent:'#2f6fb0',hColor:'#15243f',calloutBg:'#eaf1f8',calloutBd:'#cdddee',statNum:'#15243f',statLab:'#2f6fb0',statTxt:'#36465f',theadBg:'#eaf1f8',theadFg:'#15243f',font:"'Calibri','Carlito','Segoe UI',system-ui,sans-serif",h3tt:'uppercase',ringNow:'#2f6fb0'}},
 tactag:{name:'TACTAG',vars:{bandBg:'#161616',bandFg:'#ffffff',bandSub:'#ee4a1c',bandBB:'none',bandBBP:'0',accent:'#ee4a1c',hColor:'#161616',calloutBg:'#fdf0ea',calloutBd:'#f3c3ad',statNum:'#161616',statLab:'#ee4a1c',statTxt:'#3a3a3a',theadBg:'#161616',theadFg:'#ffffff',font:"'Segoe UI',system-ui,sans-serif",h3tt:'uppercase',ringNow:'#ee4a1c'}},
 plain:{name:'Plain',vars:{bandBg:'#ffffff',bandFg:'#1a1a1a',bandSub:'#5f5e5a',bandBB:'3px solid #888888',bandBBP:'8px',accent:'#888888',hColor:'#222222',calloutBg:'#f4f4f2',calloutBd:'#e0e0da',statNum:'#222222',statLab:'#555555',statTxt:'#333333',theadBg:'#efefec',theadFg:'#222222',font:"Georgia,'Times New Roman',serif",h3tt:'none',ringNow:'#666666'}},
 custom:{name:'Custom',vars:null}
};
THEMES.custom.vars=Object.assign({},THEMES.ro.vars,{name:'Custom'});

let doc={theme:'ro',customVars:{},logo:'',logoW:0,logoH:0,logoOpts:{size:48,pos:'left',x:0,y:0,gap:16},title:'Untitled document',subtitle:'',blocks:[]};
let sel=null;
const $=s=>document.querySelector(s);
const canvas=$('#canvas');
const uid=()=>'b'+Math.random().toString(36).slice(2,9);
const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const hx=c=>(c||'#000000').replace('#','').toUpperCase();
function activeVars(){ return doc.theme==='custom'?Object.assign({},THEMES.custom.vars,doc.customVars):THEMES[doc.theme].vars; }
function ringNow(){ const v=activeVars(); return v.ringNow||v.accent; }

const DOC_CSS=`
.doc{font-family:var(--font);color:#2b2b2b;font-size:15px;line-height:1.5;}
.doc .inner{padding:8px 30px 30px;}
.doc .band{background:var(--band-bg);color:var(--band-fg);padding:18px 30px;display:flex;align-items:center;gap:16px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc .band .logo{max-height:48px;max-width:210px;flex:0 0 auto;}
.doc .band .txt{flex:1;min-width:0;}
.doc .band .dt{font-size:24px;font-weight:700;border-bottom:var(--band-bb);padding-bottom:var(--band-bbp);display:inline-block;}
.doc .band .ds{font-size:13px;color:var(--band-sub);margin-top:4px;}
.doc h1.b{font-size:21px;color:var(--h-color);font-weight:700;margin:20px 0 8px;}
.doc h2.b{font-size:16px;color:var(--h-color);font-weight:700;border-bottom:2px solid var(--accent);padding-bottom:4px;margin:20px 0 9px;}
.doc h3.b{font-size:14px;color:var(--accent);font-weight:700;margin:16px 0 5px;text-transform:var(--h3-tt);letter-spacing:.4px;}
.doc p.b{margin:8px 0;}
.doc ul.b{margin:8px 0;padding-left:20px;}
.doc ul.b li{margin-bottom:4px;}
.doc hr.b{border:0;border-top:1px solid #d3d1c7;margin:16px 0;}
.doc .img-b{margin:12px 0;text-align:center;}
.doc .img-b img{max-width:100%;border-radius:4px;}
.doc .img-b .cap{font-size:12px;color:#888780;margin-top:4px;}
.doc .callout-b{background:var(--callout-bg);border:1px solid var(--callout-bd);border-radius:6px;padding:13px 16px;margin:12px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc .stat-b{display:flex;align-items:center;gap:16px;background:var(--callout-bg);border:1px solid var(--callout-bd);border-radius:6px;padding:13px 18px;margin:10px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc .stat-b .num{font-size:30px;font-weight:700;color:var(--stat-num);line-height:1;white-space:nowrap;}
.doc .stat-b .body .lab{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:var(--stat-lab);margin-bottom:2px;}
.doc .stat-b .body .txt{font-size:14px;color:var(--stat-txt);}
.doc .rings-b{margin:18px 0 6px;}
.doc .rings-b .wrap{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;}
.doc .rings-b .col{text-align:center;}
.doc .rings-b .col .lab{font-size:13px;color:#5f5e5a;margin-top:2px;}
.doc .rings-b .delta{text-align:center;padding:0 10px;}
.doc .rings-b .delta .dl{font-size:12px;color:#5f5e5a;}
.doc .rings-b .delta .dn{font-size:30px;font-weight:700;color:var(--accent);line-height:1.15;}
.doc .rings-b .delta .da{font-size:22px;color:#b8bcc4;}
.doc table.data-b{width:100%;border-collapse:collapse;font-size:13.5px;margin:10px 0;}
.doc table.data-b th{background:var(--thead-bg);color:var(--thead-fg);text-align:left;padding:6px 10px;border-bottom:2px solid var(--accent);font-size:11.5px;text-transform:uppercase;letter-spacing:.4px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc table.data-b td{padding:5px 10px;border-bottom:.5px solid #e6e6e0;}
.doc table.data-b tr:nth-child(even) td{background:#f7f9fb;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc .art-b{margin:14px 0;}
.doc .art-stage{position:relative;width:100%;height:420px;background:#fff;border:1px solid #d8dde3;border-radius:6px;overflow:hidden;background-image:linear-gradient(45deg,#f7f8fa 25%,transparent 25%),linear-gradient(-45deg,#f7f8fa 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#f7f8fa 75%),linear-gradient(-45deg,transparent 75%,#f7f8fa 75%);background-size:22px 22px;background-position:0 0,0 11px,11px -11px,-11px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
.doc .art-obj{position:absolute;touch-action:none;transform-origin:center center;cursor:move;}
.doc .art-obj.on{outline:2px solid var(--accent);outline-offset:2px;}
.doc .art-obj svg{display:block;width:100%;height:100%;overflow:visible;}
.doc .art-shape{width:100%;height:100%;}
.doc .art-word{width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:28px;line-height:1.05;text-transform:uppercase;letter-spacing:.6px;color:#fff;background:linear-gradient(135deg,var(--accent),#111);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 2px 0 rgba(0,0,0,.25),0 8px 18px rgba(0,0,0,.25);}
.doc .art-img{width:100%;height:100%;overflow:hidden;border-radius:4px;background:#eef1f4;}
.doc .art-img img{width:100%;height:100%;display:block;object-fit:cover;object-position:50% 50%;}
.doc .art-handle{position:absolute;background:#fff;border:1px solid var(--accent);width:10px;height:10px;border-radius:50%;z-index:2;display:none;}
.doc .art-obj.on .art-handle{display:block;}
.doc .art-handle.se{right:-7px;bottom:-7px;cursor:nwse-resize;}
.doc .art-handle.rot{left:50%;top:-24px;transform:translateX(-50%);cursor:grab;}
@media print{.art-tools,.art-handle{display:none!important;}.doc .art-obj{cursor:default;}.doc .art-obj.on{outline:0;}}
.doc.export .art-tools,.doc.export .art-handle{display:none!important;}
.doc.export .art-obj{cursor:default;}
.doc.export .art-obj.on{outline:0;}
`;
$('#doccss').textContent=DOC_CSS;

/* ---------- blocks ---------- */
function newBlock(type){const b={id:uid(),type};
 if(['h1','h2','h3','p','callout'].includes(type))b.html='';
 if(type==='ul')b.html='<li></li>';
 if(type==='image'){b.src='';b.cap='';b.w=0;b.h=0;}
 if(type==='art'){b.h=420;b.tool='select';b.color='#ee4a1c';b.items=[];b.active='';}
 if(type==='stat'){b.num='0';b.lab='Key number';b.txt='Add a short explanation.';}
 if(type==='rings'){b.title='Progress';b.a={label:'Planned',value:0,max:10};b.two=true;b.bb={label:'Done',value:3,max:10};b.delta='progress';}
 if(type==='table'){b.headers=['Item','Reference','Notes'];b.rows=[['','','']];}
 return b;}

function ringSVG(r,color){const C=326.726,pct=r.max>0?Math.max(0,Math.min(1,r.value/r.max)):0,dash=(pct*C).toFixed(1),p=Math.round(pct*100);
 return `<svg class="ringimg" width="150" height="150" viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="#e3e6ea" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash} ${C}" transform="rotate(-90 60 60)"/><text x="60" y="57" text-anchor="middle" style="fill:#15243f;font:700 27px Calibri,sans-serif;">${esc(String(r.value))}</text><text x="60" y="75" text-anchor="middle" style="fill:#5f5e5a;font:11px Calibri,sans-serif;">of ${esc(String(r.max))} &#183; ${p}%</text></svg>`;}
function ringsInner(b){const acc=ringNow();let h=`<div class="wrap"><div class="col">${ringSVG(b.a,b.two?'#888780':acc)}<div class="lab">${esc(b.a.label)}</div></div>`;
 if(b.two){h+=`<div class="delta"><div class="dl">${esc(b.delta)}</div><div class="dn">+${b.bb.value-b.a.value}</div><div class="da">&#8594;</div></div><div class="col">${ringSVG(b.bb,acc)}<div class="lab">${esc(b.bb.label)}</div></div>`;}
 return h+`</div>`;}

function artPath(points){if(!points||!points.length)return '';return 'M '+points.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' L ');}
function artLine(o,arrow){const sw=o.strokeW||4,id='ah'+o.id;return `<svg viewBox="0 0 ${Math.max(1,o.w)} ${Math.max(1,o.h)}" preserveAspectRatio="none">${arrow?`<defs><marker id="${id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="${o.stroke||'#111'}"/></marker></defs>`:''}<line x1="${o.x1??0}" y1="${o.y1??0}" x2="${o.x2??o.w}" y2="${o.y2??o.h}" stroke="${o.stroke||'#111'}" stroke-width="${sw}" stroke-linecap="round" marker-end="${arrow?`url(#${id})`:''}"/></svg>`;}
function artObjHTML(o,active){const r=o.r||0,skx=o.skewX||0,sky=o.skewY||0,op=o.opacity==null?1:o.opacity;let inner='';
 if(o.kind==='rect')inner=`<div class="art-shape" style="border-radius:${o.radius||0}px;background:${o.fill||'transparent'};border:${o.strokeW||3}px solid ${o.stroke||'#111'};"></div>`;
 else if(o.kind==='ellipse')inner=`<div class="art-shape" style="border-radius:999px;background:${o.fill||'transparent'};border:${o.strokeW||3}px solid ${o.stroke||'#111'};"></div>`;
 else if(o.kind==='line')inner=artLine(o,false);
 else if(o.kind==='arrow')inner=artLine(o,true);
 else if(o.kind==='free'||o.kind==='highlight')inner=`<svg viewBox="0 0 ${Math.max(1,o.w)} ${Math.max(1,o.h)}" preserveAspectRatio="none"><path d="${artPath(o.points)}" fill="none" stroke="${o.stroke||'#111'}" stroke-width="${o.strokeW||4}" stroke-linecap="round" stroke-linejoin="round" opacity="${o.kind==='highlight'?0.45:1}"/></svg>`;
 else if(o.kind==='text')inner=`<div class="art-word" style="font-size:${o.size||28}px;background:${o.fill||'linear-gradient(135deg,#ee4a1c,#111)'};-webkit-background-clip:text;background-clip:text;color:transparent;">${esc(o.text||'WordArt')}</div>`;
 else if(o.kind==='image')inner=`<div class="art-img"><img src="${o.src||''}" style="object-fit:${o.fit||'cover'};object-position:${o.posX||50}% ${o.posY||50}%;transform:scale(${o.zoom||1});"></div>`;
 return `<div class="art-obj${active?' on':''}" data-art-obj="${o.id}" style="left:${o.x}px;top:${o.y}px;width:${Math.max(8,o.w)}px;height:${Math.max(8,o.h)}px;opacity:${op};transform:rotate(${r}deg) skew(${skx}deg,${sky}deg);">${inner}<span class="art-handle rot" data-art-handle="rot"></span><span class="art-handle se" data-art-handle="se"></span></div>`;}
function artHTML(b){const tools=['select','text','rect','ellipse','line','arrow','free','highlight'];return `<div class="art-b" data-art="${b.id}"><div class="art-tools">${tools.map(t=>`<button data-art-tool="${t}" class="${(b.tool||'select')===t?'on':''}">${({select:'Select',text:'WordArt',rect:'Rect',ellipse:'Oval',line:'Line',arrow:'Arrow',free:'Draw',highlight:'Highlight'})[t]}</button>`).join('')}<span class="sep"></span><label>Color <input type="color" data-art-color value="${b.color||'#ee4a1c'}"></label><button data-art-act="image">Image</button><span class="sep"></span><button data-art-act="front">Front</button><button data-art-act="back">Back</button><button data-art-act="rotl">Rotate -</button><button data-art-act="rotr">Rotate +</button><button data-art-act="scaleup">Scale +</button><button data-art-act="scaledown">Scale -</button><button data-art-act="cropin">Crop +</button><button data-art-act="cropout">Crop -</button><button data-art-act="fit">Fit/Cover</button><button data-art-act="skewl">Perspective -</button><button data-art-act="skewr">Perspective +</button><button data-art-act="delete">Delete</button></div><div class="art-stage" data-art-stage style="height:${b.h||420}px;">${(b.items||[]).map(o=>artObjHTML(o,o.id===b.active)).join('')}</div></div>`;}
function artBlock(id){return doc.blocks.find(b=>b.id===id&&b.type==='art');}
function artActive(b){return b&&b.items?b.items.find(o=>o.id===b.active):null;}
function artPt(e,stage){const r=stage.getBoundingClientRect();return {x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top))};}
function artNormalize(o,sx,sy,ex,ey){o.x=Math.min(sx,ex);o.y=Math.min(sy,ey);o.w=Math.max(8,Math.abs(ex-sx));o.h=Math.max(8,Math.abs(ey-sy));o.x1=sx<ex?0:o.w;o.y1=sy<ey?0:o.h;o.x2=sx<ex?o.w:0;o.y2=sy<ey?o.h:0;}
function artAdd(b,kind,x,y){const c=b.color||'#ee4a1c',o={id:uid(),kind,x,y,w:150,h:90,r:0,stroke:c,fill:'rgba(238,74,28,.16)',strokeW:3};
 if(kind==='ellipse')o.h=110;if(kind==='line'||kind==='arrow'){o.w=120;o.h=70;o.fill='transparent';}
 if(kind==='free'){o.w=8;o.h=8;o.fill='transparent';o.points=[[0,0]];o.strokeW=4;}
 if(kind==='highlight'){o.w=8;o.h=8;o.fill='transparent';o.points=[[0,0]];o.stroke='#ffe45c';o.strokeW=18;}
 if(kind==='text'){o.w=230;o.h=70;o.text=prompt('WordArt text:','Your Text')||'Your Text';o.fill=`linear-gradient(135deg,${c},#111)`;o.stroke='transparent';}
 b.items.push(o);b.active=o.id;return o;}
function artApply(b,act){const o=artActive(b);if(act==='image'){pendingImg={art:b.id};$('#fileImg').click();return;}if(!o){toast('Select an object first');return;}
 if(act==='delete')b.items=b.items.filter(x=>x.id!==o.id),b.active='';
 if(act==='front'){b.items=b.items.filter(x=>x.id!==o.id);b.items.push(o);} if(act==='back'){b.items=b.items.filter(x=>x.id!==o.id);b.items.unshift(o);}
 if(act==='rotl')o.r=(o.r||0)-15;if(act==='rotr')o.r=(o.r||0)+15;if(act==='scaleup'){o.w*=1.1;o.h*=1.1;}if(act==='scaledown'){o.w*=.9;o.h*=.9;}
 if(act==='cropin'&&o.kind==='image')o.zoom=Math.min(4,(o.zoom||1)+.15);if(act==='cropout'&&o.kind==='image')o.zoom=Math.max(.5,(o.zoom||1)-.15);if(act==='fit'&&o.kind==='image')o.fit=o.fit==='contain'?'cover':'contain';
 if(act==='skewl')o.skewX=(o.skewX||0)-5;if(act==='skewr')o.skewX=(o.skewX||0)+5;render();}
let artDrag=null;
function artPointerDown(e){const stage=e.target.closest('[data-art-stage]'),wrap=e.target.closest('[data-art]');if(!stage||!wrap)return;const b=artBlock(wrap.dataset.art);if(!b)return;const p=artPt(e,stage),objEl=e.target.closest('[data-art-obj]'),handle=e.target.closest('[data-art-handle]');
 if(objEl){const o=b.items.find(x=>x.id===objEl.dataset.artObj);if(!o)return;b.active=o.id;const start={x:p.x,y:p.y,ox:o.x,oy:o.y,w:o.w,h:o.h,r:o.r||0};artDrag={b,o,stage,mode:handle?handle.dataset.artHandle:'move',start};render();e.preventDefault();return;}
 if((b.tool||'select')==='select'){b.active='';render();return;}
 const o=artAdd(b,b.tool,p.x,p.y);artDrag={b,o,stage,mode:'draw',start:{x:p.x,y:p.y}};render();e.preventDefault();}
function artPointerMove(e){if(!artDrag)return;const {b,o,mode,start}=artDrag,stage=document.querySelector(`[data-art="${b.id}"] [data-art-stage]`)||artDrag.stage,p=artPt(e,stage);if(mode==='move'){o.x=start.ox+p.x-start.x;o.y=start.oy+p.y-start.y;}
 else if(mode==='se'){o.w=Math.max(12,start.w+p.x-start.x);o.h=Math.max(12,start.h+p.y-start.y);}
 else if(mode==='rot'){const cx=o.x+o.w/2,cy=o.y+o.h/2;o.r=Math.round(Math.atan2(p.y-cy,p.x-cx)*180/Math.PI)+90;}
 else if(mode==='draw'){if(o.kind==='rect'||o.kind==='ellipse')artNormalize(o,start.x,start.y,p.x,p.y);else if(o.kind==='line'||o.kind==='arrow')artNormalize(o,start.x,start.y,p.x,p.y);else if(o.kind==='free'||o.kind==='highlight'){o.w=Math.max(8,p.x-o.x);o.h=Math.max(8,p.y-o.y);o.points.push([Math.max(0,p.x-o.x),Math.max(0,p.y-o.y)]);}}
 render();}
function artPointerUp(){artDrag=null;}

function blockInner(b){switch(b.type){
 case 'h1':return `<h1 class="b">${b.html||''}</h1>`;
 case 'h2':return `<h2 class="b">${b.html||''}</h2>`;
 case 'h3':return `<h3 class="b">${b.html||''}</h3>`;
 case 'p':return `<p class="b">${b.html||''}</p>`;
 case 'ul':return `<ul class="b">${b.html||'<li></li>'}</ul>`;
 case 'callout':return `<div class="callout-b">${b.html||''}</div>`;
 case 'divider':return `<hr class="b">`;
 case 'image':return `<div class="img-b">${b.src?`<img src="${b.src}">`:''}${b.cap?`<div class="cap">${esc(b.cap)}</div>`:''}</div>`;
 case 'art':return artHTML(b);
 case 'stat':return `<div class="stat-b"><span class="num">${esc(b.num)}</span><span class="body"><span class="lab">${esc(b.lab)}</span><span class="txt">${esc(b.txt)}</span></span></div>`;
 case 'rings':return `<div class="rings-b">${b.title?`<div style="text-align:center;font-weight:700;color:var(--h-color);margin-bottom:4px;">${esc(b.title)}</div>`:''}${ringsInner(b)}</div>`;
 case 'table':{let h='<table class="data-b"><tr>'+b.headers.map(x=>`<th>${esc(x)}</th>`).join('')+'</tr>';b.rows.forEach(r=>h+='<tr>'+r.map(c=>`<td>${esc(c)}</td>`).join('')+'</tr>');return h+'</table>';}
}return '';}

function defaultLogoOpts(){return {size:48,pos:'left',x:0,y:0,gap:16};}
function logoOpts(){doc.logoOpts=Object.assign(defaultLogoOpts(),doc.logoOpts||{});doc.logoOpts.size=Math.max(18,Math.min(180,+doc.logoOpts.size||48));doc.logoOpts.x=Math.max(-200,Math.min(200,+doc.logoOpts.x||0));doc.logoOpts.y=Math.max(-120,Math.min(120,+doc.logoOpts.y||0));doc.logoOpts.gap=Math.max(0,Math.min(80,+doc.logoOpts.gap||0));if(!['left','right','above-left','above-center'].includes(doc.logoOpts.pos))doc.logoOpts.pos='left';return doc.logoOpts;}
function logoImgStyle(){const o=logoOpts(),mw=Math.max(90,Math.round(o.size*4));return `height:${o.size}px;max-height:none;max-width:${mw}px;object-fit:contain;transform:translate(${o.x}px,${o.y}px);`;}
function logoHTML(){return doc.logo?`<img class="logo" src="${doc.logo}" style="${logoImgStyle()}">`:'';}
function bandHTML(edit=true){const lg=logoHTML(),o=logoOpts();const title=edit?`<div class="dt" data-doc="title" contenteditable="true">${doc.title||''}</div><div class="ds" data-doc="subtitle" contenteditable="true">${doc.subtitle||''}</div>`:`<div class="dt">${esc(doc.title)}</div>${doc.subtitle?`<div class="ds">${esc(doc.subtitle)}</div>`:''}`;const txt=`<div class="txt">${title}</div>`;
 if(!lg)return `<div class="band">${txt}</div>`;
 if(o.pos==='right')return `<div class="band" style="gap:${o.gap}px;">${txt}${lg}</div>`;
 if(o.pos==='above-left')return `<div class="band" style="flex-direction:column;align-items:flex-start;gap:${o.gap}px;">${lg}${txt}</div>`;
 if(o.pos==='above-center')return `<div class="band" style="flex-direction:column;align-items:center;text-align:center;gap:${o.gap}px;">${lg}${txt}</div>`;
 return `<div class="band" style="gap:${o.gap}px;">${lg}${txt}</div>`;}

function applyTheme(){const v=activeVars();for(const k in VARMAP)canvas.style.setProperty(VARMAP[k],v[k]);}

function render(){applyTheme();
 let html=bandHTML()+'<div class="inner">';
 if(doc.blocks.length===0)html+='<div class="empty"><b>Start faster with a template</b><br>Pick a starter below, paste text, or add your first block.<div class="empty-actions"><button data-empty-tpl="brief">Project Brief</button><button data-empty-tpl="update">Status Update</button><button data-empty-tpl="decision">Decision Note</button><button data-empty-tpl="guide">How-To Guide</button></div></div>';
 doc.blocks.forEach(b=>{html+=`<div class="block${b.id===sel?' sel':''}" data-id="${b.id}"><div class="ctl">${typeSelect(b)}<button data-act="up" title="Up">&#9650;</button><button data-act="down" title="Down">&#9660;</button><button data-act="del" title="Delete">&#10005;</button></div>${blockInner(b)}</div>`;});
 html+='</div>';canvas.innerHTML=html;
 doc.blocks.forEach(b=>{const el=canvas.querySelector(`.block[data-id="${b.id}"]`);if(!el)return;
  if(['h1','h2','h3','p','callout'].includes(b.type)){const t=el.querySelector('.b,.callout-b');t.setAttribute('contenteditable','true');t.dataset.edit='html';}
  if(b.type==='ul'){const u=el.querySelector('ul');u.setAttribute('contenteditable','true');u.dataset.edit='html';}
  if(b.type==='image'){let c=el.querySelector('.cap');if(!c){c=document.createElement('div');c.className='cap';el.querySelector('.img-b').appendChild(c);}c.setAttribute('contenteditable','true');c.dataset.edit='cap';}
  if(b.type==='stat')['num','lab','txt'].forEach(f=>{const s=el.querySelector('.'+f);s.setAttribute('contenteditable','true');s.dataset.edit=f;});
  if(b.type==='table'){el.querySelectorAll('th').forEach((th,c)=>{th.setAttribute('contenteditable','true');th.dataset.r='h';th.dataset.c=c;});el.querySelectorAll('tr').forEach((tr,ri)=>{if(ri===0)return;tr.querySelectorAll('td').forEach((td,c)=>{td.setAttribute('contenteditable','true');td.dataset.r=ri-1;td.dataset.c=c;});});const tb=document.createElement('div');tb.style.cssText='display:flex;gap:6px;justify-content:flex-end;margin:2px 0 0;';tb.innerHTML='<button class="tbtn" data-tbl="addrow">+ Row</button><button class="tbtn" data-tbl="addcol">+ Col</button><button class="tbtn" data-tbl="delrow">&minus; Row</button><button class="tbtn" data-tbl="delcol">&minus; Col</button>';el.appendChild(tb);}
  if(b.type==='rings')el.appendChild(ringEditor(b));
 });
 $('#docTitle').value=doc.title;
}
function typeSelect(b){if(!['h1','h2','h3','p','ul','callout'].includes(b.type))return '';const opts=[['h1','Title'],['h2','Section'],['h3','Subhead'],['p','Paragraph'],['ul','List'],['callout','Callout']];return `<select data-type="${b.id}">`+opts.map(o=>`<option value="${o[0]}"${o[0]===b.type?' selected':''}>${o[1]}</option>`).join('')+`</select>`;}
function ringEditor(b){const wrap=document.createElement('div');wrap.className='ringedit';
 const f=(lbl,val,oninput,wide)=>{const l=document.createElement('label');l.textContent=lbl;const i=document.createElement('input');if(wide)i.style.width='120px';i.value=val;i.addEventListener('input',()=>{oninput(i.value);refreshRings(b.id);});l.appendChild(i);return l;};
 wrap.appendChild(f('Left label',b.a.label,v=>b.a.label=v,true));
 wrap.appendChild(f('Left value',b.a.value,v=>b.a.value=+v||0));
 wrap.appendChild(f('Max',b.a.max,v=>{b.a.max=+v||0;if(b.two)b.bb.max=+v||0;}));
 const tog=document.createElement('label');tog.style.flexDirection='row';tog.style.alignItems='center';tog.style.gap='4px';const cb=document.createElement('input');cb.type='checkbox';cb.checked=b.two;cb.style.width='auto';cb.addEventListener('change',()=>{b.two=cb.checked;render();});tog.appendChild(cb);tog.append(' Two rings');wrap.appendChild(tog);
 if(b.two){wrap.appendChild(f('Right label',b.bb.label,v=>b.bb.label=v,true));wrap.appendChild(f('Right value',b.bb.value,v=>b.bb.value=+v||0));wrap.appendChild(f('Center note',b.delta,v=>b.delta=v,true));}
 return wrap;}
function refreshRings(id){const b=doc.blocks.find(x=>x.id===id);const el=canvas.querySelector(`.block[data-id="${id}"] .rings-b`);if(el)el.innerHTML=(b.title?`<div style="text-align:center;font-weight:700;color:var(--h-color);margin-bottom:4px;">${esc(b.title)}</div>`:'')+ringsInner(b);}

/* ---------- editing ---------- */
canvas.addEventListener('pointerdown',artPointerDown);
window.addEventListener('pointermove',artPointerMove);
window.addEventListener('pointerup',artPointerUp);
canvas.addEventListener('input',e=>{const t=e.target;
 if(t.dataset&&t.dataset.doc){doc[t.dataset.doc]=t.innerHTML.replace(/<(?!\/?(b|i|strong|em|br|a)\b)[^>]*>/gi,'');if(t.dataset.doc==='title')$('#docTitle').value=t.textContent;return;}
 if(t.dataset&&t.dataset.edit){const blk=blkOf(t);if(!blk)return;if(t.dataset.edit==='html')blk.html=t.innerHTML;else blk[t.dataset.edit]=t.textContent;return;}
 if(t.dataset&&t.dataset.r!==undefined){const blk=blkOf(t);if(!blk)return;if(t.dataset.r==='h')blk.headers[+t.dataset.c]=t.textContent;else blk.rows[+t.dataset.r][+t.dataset.c]=t.textContent;}
});
function blkOf(node){const w=node.closest('.block');return w?doc.blocks.find(b=>b.id===w.dataset.id):null;}
canvas.addEventListener('click',e=>{const w=e.target.closest('.block');if(w&&sel!==w.dataset.id){canvas.querySelectorAll('.block.sel').forEach(x=>x.classList.remove('sel'));w.classList.add('sel');sel=w.dataset.id;}
 const emptyTpl=e.target.closest('[data-empty-tpl]');if(emptyTpl){loadTemplate(emptyTpl.dataset.emptyTpl);return;}
 const act=e.target.closest('[data-act]');if(act)doAct(act.dataset.act);
 const tbl=e.target.closest('[data-tbl]');if(tbl)tableOp(tbl.dataset.tbl);
 const artTool=e.target.closest('[data-art-tool]');if(artTool){const w=artTool.closest('[data-art]'),b=artBlock(w.dataset.art);b.tool=artTool.dataset.artTool;render();return;}
 const artAct=e.target.closest('[data-art-act]');if(artAct){const w=artAct.closest('[data-art]'),b=artBlock(w.dataset.art);artApply(b,artAct.dataset.artAct);return;}
});
canvas.addEventListener('change',e=>{if(e.target.dataset.type){const b=doc.blocks.find(x=>x.id===e.target.dataset.type);convert(b,e.target.value);}if(e.target.dataset.artColor!==undefined){const w=e.target.closest('[data-art]'),b=artBlock(w.dataset.art);b.color=e.target.value;const o=artActive(b);if(o&&o.kind!=='image'){o.stroke=e.target.value;if(o.kind==='text')o.fill=`linear-gradient(135deg,${e.target.value},#111)`;}render();}});
canvas.addEventListener('dblclick',e=>{const obj=e.target.closest('[data-art-obj]'),wrap=e.target.closest('[data-art]');if(!obj||!wrap)return;const b=artBlock(wrap.dataset.art),o=b&&b.items.find(x=>x.id===obj.dataset.artObj);if(o&&o.kind==='text'){const next=prompt('WordArt text:',o.text||'');if(next!==null){o.text=next||'WordArt';b.active=o.id;render();}}});
function doAct(a){const i=doc.blocks.findIndex(b=>b.id===sel);if(i<0)return;
 if(a==='del'){doc.blocks.splice(i,1);sel=null;}
 if(a==='up'&&i>0)[doc.blocks[i-1],doc.blocks[i]]=[doc.blocks[i],doc.blocks[i-1]];
 if(a==='down'&&i<doc.blocks.length-1)[doc.blocks[i+1],doc.blocks[i]]=[doc.blocks[i],doc.blocks[i+1]];
 render();}
function convert(b,to){if(b.type==='ul'&&to!=='ul')b.html=b.html.replace(/<\/li>/gi,' ').replace(/<li>/gi,'').trim();if(b.type!=='ul'&&to==='ul')b.html='<li>'+(b.html||'')+'</li>';b.type=to;render();}
function tableOp(op){const b=doc.blocks.find(x=>x.id===sel);if(!b||b.type!=='table')return;
 if(op==='addrow')b.rows.push(b.headers.map(()=>''));if(op==='addcol'){b.headers.push('Col');b.rows.forEach(r=>r.push(''));}
 if(op==='delrow'&&b.rows.length>1)b.rows.pop();if(op==='delcol'&&b.headers.length>1){b.headers.pop();b.rows.forEach(r=>r.pop());}render();}

document.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click',()=>{const type=btn.dataset.add;if(type==='image'){pendingImg=true;$('#fileImg').click();return;}insert(newBlock(type));}));
function insert(b){const i=doc.blocks.findIndex(x=>x.id===sel);if(i>=0)doc.blocks.splice(i+1,0,b);else doc.blocks.push(b);sel=b.id;render();}

$('#fmtB').addEventListener('mousedown',e=>{e.preventDefault();document.execCommand('bold');syncActive();});
$('#fmtI').addEventListener('mousedown',e=>{e.preventDefault();document.execCommand('italic');syncActive();});
$('#fmtLink').addEventListener('mousedown',e=>{e.preventDefault();const u=prompt('Link URL:');if(u)document.execCommand('createLink',false,u);syncActive();});
function syncActive(){const a=document.activeElement;if(a&&a.dataset&&a.dataset.edit==='html'){const blk=blkOf(a);if(blk)blk.html=a.innerHTML;}}

$('#docTitle').addEventListener('input',e=>{doc.title=e.target.value;const dt=canvas.querySelector('[data-doc="title"]');if(dt)dt.textContent=doc.title;});

/* ---------- theme controls ---------- */
$('#themeSeg').addEventListener('click',e=>{const b=e.target.closest('[data-th]');if(!b)return;setTheme(b.dataset.th);});
function setTheme(t){doc.theme=t;$('#themeSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.th===t));render();}
$('#btnCustom').addEventListener('click',openBrand);
function openBrand(){const v=Object.assign({},THEMES.custom.vars,doc.customVars);
 $('#cbName').value=v.name||'Custom';$('#cbBandBg').value=norm(v.bandBg);$('#cbBandFg').value=norm(v.bandFg);$('#cbAccent').value=norm(v.accent);$('#cbHColor').value=norm(v.hColor);$('#cbCallout').value=norm(v.calloutBg);$('#cbThead').value=norm(v.theadBg);$('#cbTheadFg').value=norm(v.theadFg);$('#cbFont').value=v.font;
 $('#brandScrim').classList.add('on');}
function norm(c){if(!c||c[0]!=='#')return '#000000';if(c.length===4)return '#'+c[1]+c[1]+c[2]+c[2]+c[3]+c[3];return c.slice(0,7);}
function readBrandForm(){const accent=$('#cbAccent').value;return {name:$('#cbName').value||'Custom',bandBg:$('#cbBandBg').value,bandFg:$('#cbBandFg').value,bandSub:accent,bandBB:'none',bandBBP:'0',accent,hColor:$('#cbHColor').value,calloutBg:$('#cbCallout').value,calloutBd:accent,statNum:$('#cbHColor').value,statLab:accent,statTxt:'#3a3a3a',theadBg:$('#cbThead').value,theadFg:$('#cbTheadFg').value,font:$('#cbFont').value,h3tt:'uppercase',ringNow:accent};}
['cbName','cbBandBg','cbBandFg','cbAccent','cbHColor','cbCallout','cbThead','cbTheadFg','cbFont'].forEach(id=>$('#'+id).addEventListener('input',()=>{doc.customVars=readBrandForm();setTheme('custom');}));
$('#cbDone').addEventListener('click',()=>{doc.customVars=readBrandForm();$('#brandScrim').classList.remove('on');toast('Custom brand applied');});
$('#cbLogo').addEventListener('click',()=>{pendingLogo='brand';$('#fileLogo').click();});
$('#cbSave').addEventListener('click',()=>{doc.customVars=readBrandForm();saveBrand(doc.customVars);});
$('#btnSaveBrand').addEventListener('click',()=>saveBrand(activeVars()));
function saveBrand(vars){const kit={tactagBrand:1,name:vars.name||THEMES[doc.theme].name,vars:Object.assign({},vars),logo:doc.logo||'',logoW:doc.logoW||0,logoH:doc.logoH||0,logoOpts:logoOpts()};dl(new Blob([JSON.stringify(kit,null,2)],{type:'application/json'}),(kit.name||'brand').replace(/\s+/g,'-')+'.brand.json');toast('Brand file saved');}
$('#btnLoadBrand').addEventListener('click',()=>$('#fileBrand').click());
$('#fileBrand').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const k=JSON.parse(r.result);doc.customVars=Object.assign({},THEMES.custom.vars,k.vars||{});if(k.logo){doc.logo=k.logo;doc.logoW=k.logoW||doc.logoW;doc.logoH=k.logoH||doc.logoH;doc.logoOpts=Object.assign(defaultLogoOpts(),k.logoOpts||doc.logoOpts||{});}setTheme('custom');toast('Brand loaded');}catch(err){toast('Invalid brand file');}};r.readAsText(f);e.target.value='';});

/* ---------- logo ---------- */
let pendingImg=false,pendingLogo=false;
function syncLogoForm(){const o=logoOpts();$('#logoSize').value=o.size;$('#logoPos').value=o.pos;$('#logoX').value=o.x;$('#logoY').value=o.y;$('#logoGap').value=o.gap;}
function openLogo(){syncLogoForm();$('#logoScrim').classList.add('on');}
function updateLogoOpts(){doc.logoOpts={size:+$('#logoSize').value||48,pos:$('#logoPos').value,x:+$('#logoX').value||0,y:+$('#logoY').value||0,gap:+$('#logoGap').value||0};logoOpts();render();}
$('#btnLogo').addEventListener('click',openLogo);
$('#logoDone').addEventListener('click',()=>$('#logoScrim').classList.remove('on'));
$('#logoUpload').addEventListener('click',()=>{pendingLogo='doc';$('#fileLogo').click();});
$('#logoClear').addEventListener('click',()=>{doc.logo='';render();toast('Logo removed');});
$('#logoReset').addEventListener('click',()=>{doc.logoOpts=defaultLogoOpts();syncLogoForm();render();toast('Logo layout reset');});
['logoSize','logoPos','logoX','logoY','logoGap'].forEach(id=>{const el=$('#'+id);el.addEventListener('input',updateLogoOpts);el.addEventListener('change',updateLogoOpts);});
document.querySelectorAll('.logopick').forEach(btn=>btn.addEventListener('click',()=>{const m=LOGOS[btn.dataset.mark];if(!m)return;doc.logo=m.u;doc.logoW=m.w;doc.logoH=m.h;doc.logoOpts=Object.assign(defaultLogoOpts(),doc.logoOpts||{});syncLogoForm();render();toast('Logo set');}));
$('#fileLogo').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{doc.logo=r.result;doc.logoW=img.naturalWidth;doc.logoH=img.naturalHeight;doc.logoOpts=Object.assign(defaultLogoOpts(),doc.logoOpts||{});syncLogoForm();render();toast('Logo set');};img.src=r.result;};r.readAsDataURL(f);e.target.value='';});

/* ---------- templates ---------- */
$('#btnTemplates').addEventListener('click',e=>{e.stopPropagation();$('#tplMenu').classList.toggle('on');});
document.addEventListener('click',()=>$('#tplMenu').classList.remove('on'));
let userTemplates=[];
const BUILTIN_TEMPLATES={
 brief:{name:'Project Brief',desc:'Goal, context, plan, milestones, and open questions.',toast:'Project brief template loaded',build:()=>({title:'Project Brief - [name]',subtitle:'Goal, context, plan, and next steps',blocks:[
  mk('callout',{html:'<b>Goal:</b> describe the outcome this document should support.'}),
  mk('h2',{html:'Overview'}),mk('p',{html:'Summarize the idea, project, or problem in two or three sentences.'}),
  mk('h2',{html:'Plan'}),mk('table',{headers:['Step','Person','Due','Status'],rows:[['','','',''],['','','',''],['','','','']]}),
  mk('h2',{html:'Milestones'}),mk('rings',{title:'Progress',a:{label:'Planned',value:0,max:10},two:true,bb:{label:'Done',value:3,max:10},delta:'complete'}),
  mk('h2',{html:'Open questions'}),mk('ul',{html:'<li>What still needs a decision?</li><li>What information is missing?</li><li>What should happen next?</li>'})
 ]})},
 update:{name:'Status Update',desc:'Progress, wins, blockers, next steps, and a simple tracker.',toast:'Status update template loaded',build:()=>({title:'Status Update - [date]',subtitle:'Current state and next actions',blocks:[
  mk('stat',{num:'3',lab:'Highlights',txt:'Key items worth calling out.'}),
  mk('rings',{title:'Overall progress',a:{label:'Planned',value:0,max:10},two:true,bb:{label:'Done',value:6,max:10},delta:'progress'}),
  mk('h2',{html:'What changed'}),mk('ul',{html:'<li>Add the most important progress first.</li><li>Keep each bullet short and specific.</li><li>Include links or references where useful.</li>'}),
  mk('h2',{html:'Needs attention'}),mk('table',{headers:['Item','Why it matters','Next move'],rows:[['','',''],['','','']]}),
  mk('h2',{html:'Next steps'}),mk('ul',{html:'<li>Next action.</li><li>Follow-up action.</li>'})
 ]})},
 decision:{name:'Decision Note',desc:'Options, recommendation, tradeoffs, and final decision.',toast:'Decision note template loaded',build:()=>({title:'Decision Note - [topic]',subtitle:'Options, recommendation, and outcome',blocks:[
  mk('callout',{html:'<b>Recommendation:</b> state the preferred path in one sentence.'}),
  mk('h2',{html:'Decision needed'}),mk('p',{html:'Explain what needs to be decided and why now.'}),
  mk('h2',{html:'Options'}),mk('table',{headers:['Option','Upside','Tradeoff'],rows:[['','',''],['','',''],['','','']]}),
  mk('h2',{html:'Recommendation'}),mk('p',{html:'Explain the reasoning, including the constraint or priority that matters most.'}),
  mk('h2',{html:'Next steps'}),mk('ul',{html:'<li>Confirm the decision.</li><li>Update any related document or plan.</li><li>Start the first action.</li>'})
 ]})},
 guide:{name:'How-To Guide',desc:'Steps, tips, examples, and troubleshooting notes.',toast:'How-to guide template loaded',build:()=>({title:'How-To Guide - [task]',subtitle:'A repeatable walkthrough',blocks:[
  mk('h2',{html:'Before you start'}),mk('ul',{html:'<li>What should be ready?</li><li>What access, file, or context is needed?</li>'}),
  mk('h2',{html:'Steps'}),mk('ul',{html:'<li>Step one.</li><li>Step two.</li><li>Step three.</li>'}),
  mk('callout',{html:'<b>Tip:</b> add a shortcut, warning, or best practice here.'}),
  mk('h2',{html:'Example'}),mk('p',{html:'Show what a successful result looks like.'}),
  mk('h2',{html:'Troubleshooting'}),mk('table',{headers:['Problem','Try this','Notes'],rows:[['','',''],['','','']]})
 ]})}
};
const TEMPLATE_ALIASES={passdown:'brief',bulletin:'update'};
function tplButton(id,t){return `<button data-tpl="${id}"><span class="tpl-title">${esc(t.name)}</span><span class="tpl-desc">${esc(t.desc)}</span></button>`;}
function renderTplMenu(){let h=Object.keys(BUILTIN_TEMPLATES).map(id=>tplButton(id,BUILTIN_TEMPLATES[id])).join('')+'<button data-tpl="blank"><span class="tpl-title">Blank document</span><span class="tpl-desc">Keep the current theme and start with an empty page.</span></button><div class="menu-label">Your templates</div><button data-tpl="save"><span class="tpl-title">Save current as template</span><span class="tpl-desc">Download a reusable .template.json file.</span></button><button data-tpl="loadfile"><span class="tpl-title">Load template file</span><span class="tpl-desc">Import a saved PageSmith template.</span></button>';if(userTemplates.length){h+='<div class="menu-label">Loaded this session</div>';userTemplates.forEach((t,i)=>h+=`<button data-utpl="${i}"><span class="tpl-title">\u2605 ${esc(t.name)}</span><span class="tpl-desc">Apply saved template</span></button>`);}$('#tplMenu').innerHTML=h;}
function syncThemeSeg(){$('#themeSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x.dataset.th===doc.theme));}
function applyTemplateDoc(model){if(doc.blocks.length&&!confirm('Replace the current document with this template?'))return;doc=JSON.parse(JSON.stringify(model));sel=null;syncThemeSeg();render();toast('Template applied');}
function saveTemplate(){const name=prompt('Template name:',doc.title||'My template');if(!name)return;const snap=JSON.parse(JSON.stringify(doc));userTemplates.push({name,doc:snap});renderTplMenu();dl(new Blob([JSON.stringify({tactagTemplate:1,name,doc:snap},null,2)],{type:'application/json'}),name.replace(/\s+/g,'-')+'.template.json');toast('Template saved & downloaded');}
$('#tplMenu').addEventListener('click',e=>{const u=e.target.closest('[data-utpl]');if(u){applyTemplateDoc(userTemplates[+u.dataset.utpl].doc);return;}const b=e.target.closest('[data-tpl]');if(!b)return;const t=b.dataset.tpl;if(t==='save'){saveTemplate();return;}if(t==='loadfile'){$('#fileTpl').click();return;}if(doc.blocks.length&&!confirm('Replace the current document with this template?'))return;loadTemplate(t);});
$('#fileTpl').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const k=JSON.parse(r.result);const model=k.doc||k;if(!model||!model.blocks)throw 0;const name=k.name||model.title||'Loaded template';userTemplates.push({name,doc:model});renderTplMenu();applyTemplateDoc(model);}catch(err){toast('Invalid template file');}};r.readAsText(f);e.target.value='';});
function mk(type,extra){return Object.assign(newBlock(type),extra||{});}
function loadTemplate(t){
 t=TEMPLATE_ALIASES[t]||t;
 if(t==='blank'){doc=Object.assign(doc,{title:'Untitled document',subtitle:'',blocks:[]});sel=null;render();toast('Blank document ready');return;}
 const tpl=BUILTIN_TEMPLATES[t];if(!tpl)return;
 const keep={theme:doc.theme,customVars:doc.customVars,logo:doc.logo,logoW:doc.logoW,logoH:doc.logoH,logoOpts:logoOpts()};
 doc=Object.assign({theme:keep.theme||'ro',customVars:keep.customVars||{},logo:keep.logo||'',logoW:keep.logoW||0,logoH:keep.logoH||0,logoOpts:Object.assign(defaultLogoOpts(),keep.logoOpts||{})},tpl.build());
 sel=null;syncThemeSeg();render();toast(tpl.toast);
}

/* ---------- ai polish ---------- */
const AI_URL_KEY='pagesmith.aiServiceUrl';
const AI_DEFAULT_URL='https://pagesmith-api-production.up.railway.app';
let aiPreviewDoc=null;
function aiTextFromHTML(html){const d=document.createElement('div');d.innerHTML=html||'';return d.textContent.trim();}
function aiCompactBlock(b){
 if(['h1','h2','h3','p','callout','ul'].includes(b.type))return {type:b.type,html:b.html||'',text:aiTextFromHTML(b.html)};
 if(b.type==='stat')return {type:'stat',num:b.num||'',lab:b.lab||'',txt:b.txt||''};
 if(b.type==='table')return {type:'table',headers:b.headers||[],rows:b.rows||[]};
 if(b.type==='rings')return {type:'rings',title:b.title||'',a:b.a,bb:b.bb,two:b.two,delta:b.delta};
 if(b.type==='divider')return {type:'divider'};
 return null;
}
function aiCompactDoc(){return {title:doc.title||'',subtitle:doc.subtitle||'',blocks:doc.blocks.map(aiCompactBlock).filter(Boolean)};}
function aiBlockFromModel(block){const allowed=['h1','h2','h3','p','ul','callout','stat','table','rings','divider'];const type=allowed.includes(block.type)?block.type:'p';const b=newBlock(type);
 if(['h1','h2','h3','p','ul','callout'].includes(type))b.html=String(block.html||block.text||'');
 if(type==='stat'){b.num=String(block.num||'0');b.lab=String(block.lab||'Key number');b.txt=String(block.txt||'');}
 if(type==='table'){b.headers=Array.isArray(block.headers)?block.headers.map(String):['Item','Notes'];b.rows=Array.isArray(block.rows)?block.rows.map(r=>Array.isArray(r)?r.map(String):[]):[];if(!b.rows.length)b.rows=[b.headers.map(()=>'')];}
 if(type==='rings'){b.title=String(block.title||'Progress');b.a=block.a||b.a;b.bb=block.bb||b.bb;b.two=block.two!==false;b.delta=String(block.delta||'progress');}
 return b;}
function aiNormalizeDoc(model){return {title:String(model.title||doc.title||'Untitled document'),subtitle:String(model.subtitle||''),blocks:(model.blocks||[]).map(aiBlockFromModel)};}
function aiPreviewText(model){const lines=[model.title||'Untitled document'];if(model.subtitle)lines.push(model.subtitle);lines.push('',`${(model.blocks||[]).length} blocks ready to apply.`);(model.blocks||[]).slice(0,6).forEach(b=>{if(['h1','h2','h3','p','callout','ul'].includes(b.type))lines.push(`- ${aiTextFromHTML(b.html).slice(0,120)}`);else lines.push(`- ${b.type}`);});return lines.join('\n');}
function aiEndpoint(){return ($('#aiUrl').value||'').trim().replace(/\/+$/,'');}
function openAI(){aiPreviewDoc=null;$('#aiUrl').value=localStorage.getItem(AI_URL_KEY)||AI_DEFAULT_URL;$('#aiPreview').textContent='Run AI Polish to preview the rewritten document here.';$('#aiApply').disabled=true;$('#aiScrim').classList.add('on');}
async function runAI(){const url=aiEndpoint();if(!url){toast('Add your Railway AI service URL first');return;}localStorage.setItem(AI_URL_KEY,url);$('#aiRun').disabled=true;$('#aiRun').textContent='Polishing...';$('#aiPreview').textContent='Claude is organizing the document...';
 try{const res=await fetch(url+'/api/polish',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({document:aiCompactDoc(),options:{style:$('#aiStyle').value,format:$('#aiFormat').value,intensity:$('#aiIntensity').value,instructions:$('#aiInstructions').value}})});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.error||'AI request failed');aiPreviewDoc=aiNormalizeDoc(data.document);$('#aiPreview').textContent=aiPreviewText(aiPreviewDoc);$('#aiApply').disabled=false;toast('AI preview ready');}
 catch(err){$('#aiPreview').textContent='Error: '+err.message;toast('AI Polish failed');}
 finally{$('#aiRun').disabled=false;$('#aiRun').textContent='AI Polish';}}
function applyAI(){if(!aiPreviewDoc)return;const preserved=doc.blocks.filter(b=>['image','art'].includes(b.type));doc.title=aiPreviewDoc.title;doc.subtitle=aiPreviewDoc.subtitle;doc.blocks=[...aiPreviewDoc.blocks,...preserved];sel=null;render();$('#aiScrim').classList.remove('on');toast('AI polish applied');}
$('#btnAI').addEventListener('click',openAI);
$('#aiCancel').addEventListener('click',()=>$('#aiScrim').classList.remove('on'));
$('#aiSaveUrl').addEventListener('click',()=>{const url=aiEndpoint();if(url){localStorage.setItem(AI_URL_KEY,url);toast('AI service URL saved');}});
$('#aiRun').addEventListener('click',runAI);
$('#aiApply').addEventListener('click',applyAI);

/* ---------- import ---------- */
$('#btnPaste').addEventListener('click',()=>{$('#pasteArea').value='';$('#pasteScrim').classList.add('on');});
$('#pasteCancel').addEventListener('click',()=>$('#pasteScrim').classList.remove('on'));
$('#pasteAdd').addEventListener('click',()=>{ingestText($('#pasteArea').value);$('#pasteScrim').classList.remove('on');});
$('#btnLoadTxt').addEventListener('click',()=>$('#fileTxt').click());
$('#fileTxt').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>ingestText(r.result);r.readAsText(f);e.target.value='';});
$('#btnLoadHtml').addEventListener('click',()=>$('#fileHtml').click());
$('#fileHtml').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>loadHtml(r.result);r.readAsText(f);e.target.value='';});
$('#fileImg').addEventListener('change',e=>{const f=e.target.files[0];if(!f||!pendingImg)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{if(pendingImg.art){const b=artBlock(pendingImg.art);if(b){const o={id:uid(),kind:'image',src:r.result,x:40,y:40,w:Math.min(360,img.naturalWidth||360),h:Math.min(220,img.naturalHeight||220),r:0,zoom:1,fit:'cover'};b.items.push(o);b.active=o.id;render();toast('Image added to canvas');}}else{const b=newBlock('image');b.src=r.result;b.w=img.naturalWidth;b.h=img.naturalHeight;insert(b);}};img.src=r.result;};r.readAsDataURL(f);pendingImg=false;e.target.value='';});
function ingestText(txt){if(!txt)return;const lines=txt.replace(/\r/g,'').split('\n');let buf=[],bul=[];
 const fp=()=>{if(buf.length){const b=newBlock('p');b.html=esc(buf.join(' ').trim());doc.blocks.push(b);buf=[];}};
 const fu=()=>{if(bul.length){const b=newBlock('ul');b.html=bul.map(x=>`<li>${esc(x)}</li>`).join('');doc.blocks.push(b);bul=[];}};
 lines.forEach(ln=>{const t=ln.trim();if(/^[-*]\s+/.test(t)){fp();bul.push(t.replace(/^[-*]\s+/,''));}else if(t===''){fp();fu();}else{fu();buf.push(t);}});
 fp();fu();render();toast('Text added');}
function loadHtml(html){const m=html.match(/<script[^>]*id=["']rdoc-model["'][^>]*>([\s\S]*?)<\/script>/i);
 if(m){try{doc=JSON.parse(m[1].trim());sel=null;syncThemeSeg();render();toast('Document loaded');return;}catch(e){}}
 const tmp=document.createElement('div');tmp.innerHTML=html;const body=tmp.querySelector('body')||tmp;doc.blocks=[];ingestText((body.textContent||'').trim());toast('Imported as text');}

/* ---------- docx ---------- */
function runsFromHTML(html){const tmp=document.createElement('div');tmp.innerHTML=html||'';const runs=[];
 (function walk(node,b,i){node.childNodes.forEach(n=>{if(n.nodeType===3){if(n.nodeValue)runs.push(new docx.TextRun({text:n.nodeValue,bold:b,italics:i}));}else if(n.nodeType===1){const tag=n.tagName.toLowerCase();if(tag==='br'){runs.push(new docx.TextRun({text:'',break:1}));return;}walk(n,b||tag==='b'||tag==='strong',i||tag==='i'||tag==='em');}});})(tmp,false,false);
 return runs.length?runs:[new docx.TextRun('')];}
function liTexts(html){const tmp=document.createElement('div');tmp.innerHTML=html||'';return [...tmp.querySelectorAll('li')];}
function dataURLtoU8(d){const bin=atob(d.split(',')[1]);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function rasterDataURL(src,w,h){return new Promise(res=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');const ratio=Math.max(1,Math.min(4,window.devicePixelRatio||1));c.width=Math.max(1,Math.round((w||img.naturalWidth||240)*ratio));c.height=Math.max(1,Math.round((h||img.naturalHeight||80)*ratio));const ctx=c.getContext('2d');ctx.scale(ratio,ratio);ctx.drawImage(img,0,0,c.width/ratio,c.height/ratio);try{res(c.toDataURL('image/png'));}catch(e){res(src);}};img.onerror=()=>res(src);img.src=src;});}
function shadedCell(children,fill,width){return new docx.TableCell({shading:{fill},margins:{top:80,bottom:80,left:120,right:120},width:width?{size:width,type:docx.WidthType.PERCENTAGE}:undefined,children});}
function rasterizeRings(b){return new Promise(res=>{const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="220" viewBox="0 0 640 220"><rect width="640" height="220" fill="#ffffff"/>`+ringsStandalone(b)+`</svg>`;const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=1280;c.height=440;const ctx=c.getContext('2d');ctx.scale(2,2);ctx.drawImage(img,0,0);try{res(c.toDataURL('image/png'));}catch(e){res(null);}};img.onerror=()=>res(null);img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});}
function oneRing(cx,r,color,label){const C=326.726,pct=r.max>0?Math.max(0,Math.min(1,r.value/r.max)):0,dash=(pct*C).toFixed(1),p=Math.round(pct*100);return `<g transform="translate(${cx},20)"><circle cx="60" cy="60" r="52" fill="none" stroke="#e3e6ea" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${dash} ${C}" transform="rotate(-90 60 60)"/><text x="60" y="57" text-anchor="middle" font-family="Calibri,Arial" font-size="27" font-weight="700" fill="#15243f">${esc(String(r.value))}</text><text x="60" y="75" text-anchor="middle" font-family="Calibri,Arial" font-size="11" fill="#5f5e5a">of ${esc(String(r.max))} &#183; ${p}%</text><text x="60" y="150" text-anchor="middle" font-family="Calibri,Arial" font-size="13" fill="#5f5e5a">${esc(label)}</text></g>`;}
function ringsStandalone(b){const acc=ringNow();if(!b.two)return oneRing(260,b.a,acc,b.a.label);let s=oneRing(120,b.a,'#888780',b.a.label);s+=`<g transform="translate(320,70)"><text x="0" y="0" text-anchor="middle" font-family="Calibri,Arial" font-size="12" fill="#5f5e5a">${esc(b.delta)}</text><text x="0" y="30" text-anchor="middle" font-family="Calibri,Arial" font-size="30" font-weight="700" fill="${acc}">+${b.bb.value-b.a.value}</text><text x="0" y="55" text-anchor="middle" font-family="Calibri,Arial" font-size="22" fill="#b8bcc4">&#8594;</text></g>`;s+=oneRing(400,b.bb,acc,b.bb.label);return s;}
async function exportDocx(){if(typeof docx==='undefined'){toast('docx not loaded');return;}toast('Building Word file…');
 const v=activeVars(),H=docx.HeadingLevel,kids=[];const ACC=hx(v.accent),HC=hx(v.hColor),SL=hx(v.statLab),ST=hx(v.statTxt),CB=hx(v.calloutBg),TB=hx(v.theadBg),TF=hx(v.theadFg);
 if(doc.logo){try{const lo=logoOpts(),logoSrc=doc.logo.startsWith('data:image/svg')?await rasterDataURL(doc.logo,doc.logoW||240,doc.logoH||80):doc.logo;const u=dataURLtoU8(logoSrc);const h=Math.max(18,Math.min(120,lo.size));const w=Math.min(Math.round(h*((doc.logoW||3)/(doc.logoH||1))),420);const align=lo.pos==='right'?docx.AlignmentType.RIGHT:(lo.pos==='above-center'?docx.AlignmentType.CENTER:docx.AlignmentType.LEFT);kids.push(new docx.Paragraph({alignment:align,children:[new docx.ImageRun({data:u,transformation:{width:w,height:h}})]}));}catch(e){}}
 if(doc.title)kids.push(new docx.Paragraph({heading:H.TITLE,children:[new docx.TextRun({text:doc.title,bold:true,color:HC})]}));
 if(doc.subtitle)kids.push(new docx.Paragraph({children:[new docx.TextRun({text:doc.subtitle,color:ACC})]}));
 const ringImgs={};for(const b of doc.blocks)if(b.type==='rings')ringImgs[b.id]=await rasterizeRings(b);
 for(const b of doc.blocks){
  if(b.type==='h1')kids.push(new docx.Paragraph({heading:H.HEADING_1,children:runsFromHTML(b.html)}));
  else if(b.type==='h2')kids.push(new docx.Paragraph({heading:H.HEADING_2,children:runsFromHTML(b.html)}));
  else if(b.type==='h3')kids.push(new docx.Paragraph({heading:H.HEADING_3,children:runsFromHTML(b.html)}));
  else if(b.type==='p')kids.push(new docx.Paragraph({children:runsFromHTML(b.html)}));
  else if(b.type==='callout')kids.push(new docx.Table({width:{size:100,type:docx.WidthType.PERCENTAGE},rows:[new docx.TableRow({children:[shadedCell([new docx.Paragraph({children:runsFromHTML(b.html)})],CB)]})]}));
  else if(b.type==='ul')liTexts(b.html).forEach(li=>kids.push(new docx.Paragraph({bullet:{level:0},children:runsFromHTML(li.innerHTML)})));
  else if(b.type==='divider')kids.push(new docx.Paragraph({border:{bottom:{color:"D3D1C7",space:1,style:docx.BorderStyle.SINGLE,size:6}},children:[new docx.TextRun('')]}));
  else if(b.type==='stat')kids.push(new docx.Table({width:{size:100,type:docx.WidthType.PERCENTAGE},rows:[new docx.TableRow({children:[shadedCell([new docx.Paragraph({children:[new docx.TextRun({text:b.num,bold:true,size:48,color:HC})]})],CB,18),shadedCell([new docx.Paragraph({children:[new docx.TextRun({text:(b.lab||'').toUpperCase(),bold:true,size:18,color:SL})]}),new docx.Paragraph({children:[new docx.TextRun({text:b.txt,size:26,color:ST})]})],CB,82)]})]}));
  else if(b.type==='image'&&b.src){const u=dataURLtoU8(b.src);const w=Math.min(560,b.w||560),h=Math.round((b.h||300)*(w/(b.w||560)));kids.push(new docx.Paragraph({alignment:docx.AlignmentType.CENTER,children:[new docx.ImageRun({data:u,transformation:{width:w,height:h}})]}));if(b.cap)kids.push(new docx.Paragraph({alignment:docx.AlignmentType.CENTER,children:[new docx.TextRun({text:b.cap,italics:true,size:20,color:"888780"})]}));}
  else if(b.type==='art')kids.push(new docx.Paragraph({children:[new docx.TextRun({text:'[Canvas / markup block - export as HTML or PDF for the visual layout]',italics:true,color:'888780'})]}));
  else if(b.type==='rings'&&ringImgs[b.id]){if(b.title)kids.push(new docx.Paragraph({alignment:docx.AlignmentType.CENTER,children:[new docx.TextRun({text:b.title,bold:true,color:HC})]}));kids.push(new docx.Paragraph({alignment:docx.AlignmentType.CENTER,children:[new docx.ImageRun({data:dataURLtoU8(ringImgs[b.id]),transformation:{width:560,height:192}})]}));}
  else if(b.type==='table'){const rows=[new docx.TableRow({tableHeader:true,children:b.headers.map(hd=>shadedCell([new docx.Paragraph({children:[new docx.TextRun({text:hd,bold:true,size:18,color:TF})]})],TB))})];b.rows.forEach(r=>rows.push(new docx.TableRow({children:r.map(c=>new docx.TableCell({margins:{top:60,bottom:60,left:120,right:120},children:[new docx.Paragraph({children:[new docx.TextRun({text:c,size:22})]})]}))})));kids.push(new docx.Table({width:{size:100,type:docx.WidthType.PERCENTAGE},rows}));}
  if(['callout','stat','table'].includes(b.type))kids.push(new docx.Paragraph({children:[new docx.TextRun('')]}));
 }
 const d=new docx.Document({styles:{default:{document:{run:{font:"Calibri"}}}},sections:[{children:kids}]});
 const blob=await docx.Packer.toBlob(d);dl(blob,(doc.title||'document')+'.docx');toast('Word file downloaded');}

/* ---------- html / txt / pdf / email ---------- */
function varsToStyle(v){return Object.keys(VARMAP).map(k=>`${VARMAP[k]}:${v[k]}`).join(';');}
function renderDocHTML(){let inner='';doc.blocks.forEach(b=>inner+=blockInner(b)+'\n');const v=activeVars();
 const band=bandHTML(false);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(doc.title||'Document')}</title>
<style>body{margin:0;background:#eef1f4;}.page{max-width:850px;margin:24px auto;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.12);border-radius:6px;overflow:hidden;}@media print{body{background:#fff;}.page{box-shadow:none;margin:0;max-width:none;border-radius:0;}}
${DOC_CSS}</style></head><body>
<div class="page doc export" style="${varsToStyle(v)}">${band}<div class="inner">${inner}</div></div>
<script type="application/json" id="rdoc-model">${JSON.stringify(doc).replace(/<\//g,'<\\/')}<\/script>
</body></html>`;}
function exportHtml(){dl(new Blob([renderDocHTML()],{type:'text/html'}),(doc.title||'document')+'.html');toast('HTML downloaded');}
function exportTxt(){const strip=h=>{const t=document.createElement('div');t.innerHTML=h||'';return t.textContent;};let out=doc.title?doc.title+'\n'+'='.repeat(doc.title.length)+'\n\n':'';
 doc.blocks.forEach(b=>{if(['h1','h2','h3'].includes(b.type))out+=strip(b.html).toUpperCase()+'\n\n';else if(b.type==='p'||b.type==='callout')out+=strip(b.html)+'\n\n';else if(b.type==='ul'){liTexts(b.html).forEach(li=>out+='- '+li.textContent+'\n');out+='\n';}else if(b.type==='divider')out+='----------------------------------------\n\n';else if(b.type==='image')out+=(b.cap?'[Image: '+b.cap+']':'[Image]')+'\n\n';else if(b.type==='art')out+='[Canvas: '+((b.items||[]).length)+' objects]\n\n';else if(b.type==='stat')out+=b.num+' — '+b.lab+': '+b.txt+'\n\n';else if(b.type==='rings'){out+=b.a.label+': '+b.a.value+'/'+b.a.max;if(b.two)out+='  →  '+b.bb.label+': '+b.bb.value+'/'+b.bb.max;out+='\n\n';}else if(b.type==='table'){out+=b.headers.join('\t')+'\n';b.rows.forEach(r=>out+=r.join('\t')+'\n');out+='\n';}});
 dl(new Blob([out],{type:'text/plain'}),(doc.title||'document')+'.txt');toast('TXT downloaded');}
function exportPdf(){const w=window.open('','_blank');if(!w){toast('Allow pop-ups for PDF');return;}w.document.write(renderDocHTML());w.document.close();const go=()=>{try{w.focus();w.print();}catch(e){}};w.onload=go;setTimeout(go,500);}
function copyEmail(){const html=`<div style="max-width:760px;font-family:${activeVars().font.replace(/"/g,"'")};">`+renderInlineForEmail()+`</div>`;const blob=new Blob([html],{type:'text/html'});
 if(navigator.clipboard&&window.ClipboardItem){navigator.clipboard.write([new ClipboardItem({'text/html':blob,'text/plain':new Blob([stripTags(html)],{type:'text/plain'})})]).then(()=>toast('Copied — paste into your email'),()=>fallbackCopy(html));}else fallbackCopy(html);}
function fallbackCopy(html){const tmp=document.createElement('div');tmp.style.cssText='position:fixed;left:-9999px;';tmp.innerHTML=html;document.body.appendChild(tmp);const r=document.createRange();r.selectNodeContents(tmp);const s=getSelection();s.removeAllRanges();s.addRange(r);try{document.execCommand('copy');toast('Copied — paste into your email');}catch(e){toast('Copy failed');}s.removeAllRanges();tmp.remove();}
function stripTags(h){const d=document.createElement('div');d.innerHTML=h;return d.textContent;}
function renderInlineForEmail(){const v=activeVars(),lo=logoOpts();let h='';const lg=doc.logo?`<img src="${doc.logo}" style="height:${lo.size}px;max-width:${Math.max(90,lo.size*4)}px;object-fit:contain;vertical-align:middle;transform:translate(${lo.x}px,${lo.y}px);">`:'';
 const title=`<span style="display:inline-block;vertical-align:middle;"><span style="font-size:22px;font-weight:700;">${esc(doc.title)}</span>${doc.subtitle?`<br><span style="font-size:13px;color:${v.bandSub};">${esc(doc.subtitle)}</span>`:''}</span>`;
 const bandStyle=`background:${v.bandBg};color:${v.bandFg};padding:16px 20px;`;
 if(lg&&lo.pos==='right')h+=`<div style="${bandStyle}"><span style="display:inline-flex;align-items:center;gap:${lo.gap}px;width:100%;justify-content:space-between;">${title}${lg}</span></div>`;
 else if(lg&&(lo.pos==='above-left'||lo.pos==='above-center'))h+=`<div style="${bandStyle}text-align:${lo.pos==='above-center'?'center':'left'};">${lg}<div style="height:${lo.gap}px;line-height:${lo.gap}px;">&nbsp;</div>${title}</div>`;
 else h+=`<div style="${bandStyle}"><span style="display:inline-flex;align-items:center;gap:${lo.gap}px;">${lg}${title}</span></div>`;
 h+='<div style="padding:6px 4px;">';
 doc.blocks.forEach(b=>{
  if(b.type==='h1')h+=`<div style="font-size:21px;font-weight:700;color:${v.hColor};margin:18px 0 8px;">${b.html}</div>`;
  else if(b.type==='h2')h+=`<div style="font-size:16px;font-weight:700;color:${v.hColor};border-bottom:2px solid ${v.accent};padding-bottom:4px;margin:18px 0 9px;">${b.html}</div>`;
  else if(b.type==='h3')h+=`<div style="font-size:13px;font-weight:700;color:${v.accent};text-transform:uppercase;letter-spacing:.4px;margin:14px 0 5px;">${b.html}</div>`;
  else if(b.type==='p')h+=`<p style="margin:8px 0;font-size:15px;line-height:1.5;">${b.html}</p>`;
  else if(b.type==='ul'){h+='<ul style="margin:8px 0;padding-left:20px;">';liTexts(b.html).forEach(li=>h+=`<li style="margin-bottom:4px;">${li.innerHTML}</li>`);h+='</ul>';}
  else if(b.type==='callout')h+=`<div style="background:${v.calloutBg};border:1px solid ${v.calloutBd};border-radius:6px;padding:12px 16px;margin:12px 0;">${b.html}</div>`;
  else if(b.type==='divider')h+='<hr style="border:0;border-top:1px solid #d3d1c7;margin:16px 0;">';
  else if(b.type==='image'&&b.src)h+=`<div style="text-align:center;margin:12px 0;"><img src="${b.src}" style="max-width:100%;">${b.cap?`<div style="font-size:12px;color:#888780;margin-top:4px;">${esc(b.cap)}</div>`:''}</div>`;
  else if(b.type==='art')h+=`<div style="border:1px solid #d8dde3;border-radius:6px;padding:14px;margin:12px 0;color:#666;font-size:13px;">Canvas / markup block (${(b.items||[]).length} objects). Export as HTML or PDF for the visual layout.</div>`;
  else if(b.type==='stat')h+=`<table style="width:100%;background:${v.calloutBg};border:1px solid ${v.calloutBd};border-radius:6px;margin:10px 0;"><tr><td style="padding:12px 8px 12px 16px;font-size:30px;font-weight:700;color:${v.statNum};white-space:nowrap;width:1%;">${esc(b.num)}</td><td style="padding:12px 16px 12px 8px;"><div style="font-size:11.5px;text-transform:uppercase;letter-spacing:.5px;color:${v.statLab};">${esc(b.lab)}</div><div style="font-size:14px;color:${v.statTxt};">${esc(b.txt)}</div></td></tr></table>`;
  else if(b.type==='rings')h+=`<div style="text-align:center;margin:16px 0;">${b.title?`<div style="font-weight:700;color:${v.hColor};margin-bottom:4px;">${esc(b.title)}</div>`:''}${ringsInner(b)}</div>`;
  else if(b.type==='table'){h+='<table style="width:100%;border-collapse:collapse;font-size:13.5px;margin:10px 0;"><tr>'+b.headers.map(x=>`<th style="background:${v.theadBg};color:${v.theadFg};text-align:left;padding:6px 10px;border-bottom:2px solid ${v.accent};font-size:11.5px;text-transform:uppercase;">${esc(x)}</th>`).join('')+'</tr>';b.rows.forEach((r,i)=>{h+='<tr>'+r.map(c=>`<td style="padding:5px 10px;border-bottom:1px solid #e6e6e0;${i%2?'background:#f7f9fb;':''}">${esc(c)}</td>`).join('')+'</tr>';});h+='</table>';}
 });
 return h+'</div>';}

function dl(blob,name){const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);}
let toastT;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}

$('#btnHtml').addEventListener('click',exportHtml);
$('#btnTxt').addEventListener('click',exportTxt);
$('#btnPdf').addEventListener('click',exportPdf);
$('#btnDocx').addEventListener('click',()=>exportDocx().catch(e=>{console.error(e);toast('DOCX error: '+e.message);}));
$('#btnEmail').addEventListener('click',copyEmail);
$('#btnHelp').addEventListener('click',()=>$('#helpScrim').classList.add('on'));
$('#helpClose').addEventListener('click',()=>$('#helpScrim').classList.remove('on'));
$('#helpScrim').addEventListener('click',e=>{if(e.target.id==='helpScrim')$('#helpScrim').classList.remove('on');});

renderTplMenu();
render();
