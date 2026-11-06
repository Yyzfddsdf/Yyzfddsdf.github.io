/* Original handcrafted voxel exhibits, authored for Yizhe Yang's personal site.
   Shared scene models power small, noninteractive homepage previews and full explorations.
   No trackers, remote assets, pointer-lock requirement, or external dependencies. */
(function () {
'use strict';
if (!window.THREE) return;
const T = window.THREE;
const page = document.body.classList.contains('explore-page');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const KEY = 'yizhe-world-preferences';
let prefs = {};
try { prefs = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) {}
if (page && new URLSearchParams(location.search).get('lang') === 'zh') prefs.lang = 'zh';
let lang = page ? (prefs.lang || 'en') : (document.documentElement.lang.startsWith('zh') ? 'zh' : 'en');
let day = page ? !!prefs.day : document.body.classList.contains('day');
function remember() { try { sessionStorage.setItem(KEY, JSON.stringify({ lang, day })); } catch (_) {} }
const tr = (en, zh) => lang === 'zh' ? zh : en;
const colors = { grass:0x718c54, grass2:0x86a366, leaf:0x789458, leaf2:0xa4b875, dirt:0x6d5741, stone:0x708280, stone2:0x8e9d91, dark:0x243d44, metal:0x506a6c, teal:0x65b9ae, bright:0x9ee3ce, lime:0xc4e795, gold:0xf0c677, coral:0xd77d6b, sand:0xb6a787, cream:0xd9d9b6, wood:0x92734f, water:0x467f90, blue:0x6baec9, purple:0xaa95bf };
const unit = new T.BoxGeometry(1,1,1), materials = new Map();
function material(color, glow = 0, alpha = 1, textured = false) {
  const key = [color,glow,alpha,textured].join(':');
  if (materials.has(key)) return materials.get(key);
  let map;
  if (textured) {
    const c = document.createElement('canvas'); c.width=c.height=16;
    const ctx=c.getContext('2d'), base=new T.Color(color); let seed=123+color;
    for(let y=0;y<16;y++)for(let x=0;x<16;x++){
      seed=(seed*1664525+1013904223)>>>0;
      const shade=.9+(seed/4294967296)*.19;
      ctx.fillStyle=base.clone().multiplyScalar(shade).getStyle();ctx.fillRect(x,y,1,1);
    }
    map=new T.CanvasTexture(c);map.magFilter=T.NearestFilter;map.minFilter=T.NearestFilter;
    map.colorSpace=T.SRGBColorSpace;
  }
  const m = new T.MeshStandardMaterial({color: textured ? 0xffffff : color,map:map||null,roughness:.86,metalness:.06,transparent:alpha<1,opacity:alpha,emissive:glow?color:0,emissiveIntensity:glow,depthWrite:alpha>=.9});
  m.userData.baseColor = color;
  materials.set(key,m);return m;
}
function box(parent,color,x,y,z,sx=1,sy=1,sz=1,glow=0,alpha=1,textured=false){
  const m=new T.Mesh(unit,material(color,glow,alpha,textured));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=alpha>.8;m.receiveShadow=true;parent.add(m);return m;
}
function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function rail(parent,x1,z1,x2,z2,y,color=colors.metal){
  const len=Math.hypot(x2-x1,z2-z1),m=box(parent,color,(x1+x2)/2,y,(z1+z2)/2,.11,.12,len);m.rotation.y=Math.atan2(x2-x1,z2-z1);return m;
}
function tree(parent,x,z,s=1){const g=group(parent,x,0,z);g.scale.setScalar(s);box(g,colors.wood,0,.85,0,.28,1.7,.3,0,1,true);box(g,colors.leaf,0,1.9,0,1.25,.7,1.15,0,1,true);box(g,colors.leaf2,.03,2.45,0,.87,.55,.85,0,1,true);box(g,colors.leaf,-.35,1.55,.15,.68,.4,.7,0,1,true);return g;}
function lamp(parent,x,z,height=2.4,color=colors.gold){box(parent,colors.dark,x,height/2,z,.12,height,.12);box(parent,colors.metal,x,height+.03,z,.5,.13,.5);box(parent,color,x,height-.15,z,.32,.24,.32,.85);box(parent,colors.dark,x,.05,z,.38,.12,.38);const light=new T.PointLight(color,2.1,4.5,1.6);light.position.set(x,height-.1,z);parent.add(light);}
function crystal(parent,x,y,z,color=colors.gold,s=.55){const g=group(parent,x,y,z);box(g,color,0,0,0,s,s,s,.35);box(g,color,0,s*.65,0,s*.55,s*.35,s*.55,.55);box(g,0xf7e9b7,-s*.16,s*.16,s*.51,s*.18,s*.34,.025,.6);return g;}
function pixelText(parent,pattern,color,x,y,z,s=.15){
  pattern.forEach((row,iy)=>[...row].forEach((c,ix)=>{if(c!==' ')box(parent,color,x+ix*s,y-iy*s,z,s*.84,s*.84,s*.2,.45);}));
}
function addCollider(model,x,z,w,d){model.colliders.push({x,z,w,d});}
function foundation(model,w,d,color=colors.stone){
  model.scene.userData.groundBounds={x:w/2,z:d/2};
  box(model.root,colors.dark,0,-.36,0,w,.64,d,0,1,true);
  box(model.root,color,0,-.03,0,w+.08,.15,d+.08,0,1,true);
  for(const x of[-w/2+.4,w/2-.4])for(const z of[-d/2+.4,d/2-.4])box(model.root,colors.metal,x,-.72,z,.58,.25,.58);
}
function modelBase(type){
  const scene=new T.Scene(),root=group(scene),model={type,scene,root,colliders:[],targets:[],animated:[],bounds:6.1,start:{x:0,z:5.1,yaw:0},floor:0,span:16.4,centerY:1.1};
  const hemi=new T.HemisphereLight(0xc4e3e5,0x394637,1.7);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffe1b0,3.1);sun.position.set(-7,12,8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:35});sun.shadow.normalBias=.035;sun.shadow.bias=-.0004;sun.shadow.radius=3;scene.add(sun);
  const fill=new T.DirectionalLight(0x82cacc,1.5);fill.position.set(7,7,-8);scene.add(fill);
  model.lights={hemi,sun,fill};
  model.theme=function(light){scene.userData.day=light;hemi.intensity=light?2.25:1.7;sun.intensity=light?3.5:3.1;fill.intensity=light?1.1:1.5;};
  return model;
}
function makeEmbodied(){
 const m=modelBase('embodied'),r=m.root;m.span=16.5;m.centerY=.8;m.start={x:0,z:5.15,yaw:0};
 foundation(m,12.5,12.5,colors.grass);
 // Grounded robot workshop: stone pathways, timber lab, workbench, charging dock.
 for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){
   if(Math.abs(x)<2||Math.abs(z)<2||z===4)box(r,((x+z)%3===0?0x87958a:0x708478),x,.09,z,.94,.15,.94,0,1,true);
   else if((x*11+z*7)%5===0)box(r,colors.grass2,x,.07,z,.91,.1,.91,0,1,true);
 }
 // Open-sided voxel laboratory at the back left, not another floating island.
 box(r,colors.stone2,-3.6,.17,-3.6,4.4,.35,3.4,0,1,true);
 for(const x of[-5.6,-1.6])for(const z of[-4.95,-2.1])box(r,colors.wood,x,1.65,z,.28,3,.28,0,1,true);
 box(r,colors.wood,-3.6,1.55,-5.05,4.3,2.7,.2,0,1,true);
 for(let k=0;k<3;k++)box(r,colors.teal,-3.6,3.17+k*.2,-3.6,4.7-k*.6,.25,3.7,0,1,true);
 box(r,colors.cream,-4.15,1.9,-4.89,1.75,.9,.11);pixelText(r,['# #','# #','###'],colors.teal,-4.55,2.13,-4.81,.19);
 box(r,colors.wood,-2.5,.8,-4.15,1.2,.16,1.05,0,1,true);for(const x of[-2.95,-2.05])box(r,colors.dark,x,.44,-4.15,.13,.7,.8);
 box(r,colors.dark,-2.5,1.25,-4.35,.65,.62,.12);box(r,colors.bright,-2.5,1.25,-4.27,.48,.39,.025,.65);
 // Three charging sockets display delivered cells.
 m.sockets=[];for(let i=0;i<3;i++){const x=-4.65+i*.6;box(r,colors.dark,x,.4,-3.15,.46,.5,.46);m.sockets.push(box(r,colors.metal,x,.68,-3.15,.32,.08,.32,.0));}
 const dock=group(r,-4.05,.3,-2.55);box(dock,colors.teal,0,0,0,1.9,.12,.45,.15);m.targets.push({id:'dock',x:-4,z:-2.8,group:dock,label:()=>tr('charging dock','充电站')});
 addCollider(m,-3.6,-5.2,4.6,.4);addCollider(m,-2.5,-4.1,1.3,1.1);
 // Workshop obstacles are physically solid; stepping around them is the game.
 [[2,1.2,1.4,1],[3,-2,1,1.8],[-2,.6,1.25,1.25]].forEach(([x,z,w,d],i)=>{
 box(r,colors.wood,x,.55,z,w,1.1,d,0,1,true);box(r,colors.sand,x,1.13,z,w+.08,.12,d+.08);box(r,colors.dark,x,.55,z+d/2+.015,.13,.94,.035);addCollider(m,x,z,w,d);
 });
 // Low fence, tools, gravel, vegetation, and lamplight furnish the space.
 for(let z=-4;z<=4;z+=2){box(r,colors.wood,5.8,.55,z,.13,1.1,.13);if(z<4){box(r,colors.wood,5.8,.85,z+1,.09,.1,2);box(r,colors.wood,5.8,.4,z+1,.09,.1,2);}}
 tree(r,4.9,-4.6,1.18);tree(r,-5,3.7,.85);addCollider(m,4.9,-4.6,.6,.6);addCollider(m,-5,3.7,.6,.6);
 for(const [x,z]of[[4.6,3.9],[-4.7,1.5],[2.8,4.8],[-2.9,4.9]]){box(r,colors.grass2,x,.25,z,.08,.5,.08);box(r,colors.gold,x,.5,z,.24,.12,.24);box(r,colors.grass2,x+.14,.2,z,.25,.08,.07);}
 lamp(r,-5.7,.2,2.3);lamp(r,4.9,2.1,2.45);
 m.cells=[];[[-4,1.6],[4.5,.1],[1.2,-4.4]].forEach(([x,z],i)=>{box(r,colors.dark,x,.17,z,.85,.25,.85);box(r,colors.teal,x,.32,z,.7,.08,.7,.2);const g=crystal(r,x,.85,z,colors.gold,.48);m.cells.push(g);m.targets.push({id:'cell'+i,x,z,group:g,label:()=>tr('energy cell','能量方块')});});
 // The player is a little blocky robot in overview; its body hides in first person.
 const robot=group(r,0,0,5.1);box(robot,colors.cream,0,.8,0,.55,.6,.42);box(robot,colors.teal,0,1.26,0,.71,.48,.55);box(robot,colors.dark,0,1.29,-.285,.52,.21,.035);for(const x of[-.16,.16])box(robot,colors.bright,x,1.3,-.31,.095,.1,.04,.7);box(robot,colors.dark,0,1.57,0,.07,.2,.07);box(robot,colors.gold,0,1.69,0,.14,.13,.14,.4);for(const x of[-.34,.34])box(robot,colors.metal,x,.75,0,.14,.43,.18);for(const x of[-.17,.17])box(robot,colors.dark,x,.32,0,.19,.35,.32);m.robot=robot;
 return m;
}
function makeMultimodal(){
 const m=modelBase('multimodal'),r=m.root;m.span=17.5;m.centerY=1.1;m.start={x:0,z:5.5,yaw:0};
 // An observatory in a mineral desert, with a recessed prism, raised satellite decks.
 foundation(m,13,13,colors.sand);
 for(let x=-6;x<=6;x++)for(let z=-6;z<=6;z++)if((x*17+z*23)%7===0)box(r,0xc5b38d,x,.08,z,.88,.08,.88,0,1,true);
 box(r,colors.dark,0,.16,0,4,.35,4);box(r,colors.metal,0,.38,0,3.55,.16,3.55);box(r,colors.teal,0,.49,0,2.8,.09,2.8,.15);
 const outer=group(r,0,.65,0);for(let i=0;i<4;i++){const angle=i*Math.PI/2;const p=box(outer,colors.cream,Math.cos(angle)*1.65,.34,Math.sin(angle)*1.65,.3,.9,.3);p.rotation.y=angle;}
 m.core=group(r,0,1.45,0);box(m.core,colors.teal,0,0,0,.9,.9,.9,.5);box(m.core,colors.bright,0,0,0,1.14,1.14,1.14,.05,.13);box(m.core,colors.gold,0,.8,0,.35,.28,.35,.65);m.core.rotation.y=Math.PI/4;
 addCollider(m,0,0,2.7,2.7);m.targets.push({id:'core',x:0,z:0,group:m.core,label:()=>tr('fusion core','融合核心')});
 m.channels=[];const stations=[[-4.1,-1.2,0x72adc1],[0,-4.35,0xb2c184],[4.1,-1.2,0xb298c3]];
 stations.forEach(([x,z,color],i)=>{
  box(r,colors.dark,x,.17,z,2,.35,1.8);box(r,colors.metal,x,.39,z,1.65,.13,1.5);box(r,color,x,.5,z,1.45,.09,1.3,.1);
  const g=group(r,x,0,z);box(g,colors.cream,0,1.2,0,1.08,1.45,.7);box(g,colors.dark,0,1.55,.38,.86,.67,.09);
  const display=group(g,0,1.55,.45);m.channels.push({group:g,display,state:i,color});
  box(g,colors.dark,0,2.18,-.2,.1,.7,.1);box(g,color,0,2.55,-.2,.35,.14,.35,.5);box(g,colors.metal,-.3,.9,.57,.32,.13,.28);box(g,color,.29,.9,.57,.21,.12,.25,.3);
  // Three distinct transmitter silhouettes: camera, book-like memory bank, equalizer.
  if(i===0){box(g,colors.metal,0,2.5,-.2,1.2,.55,.63);box(g,colors.blue,0,2.5,.17,.7,.38,.15,.4);box(g,colors.dark,0,2.5,.27,.34,.22,.1);}
  if(i===1){for(let k=0;k<4;k++)box(g,k%2?colors.lime:colors.cream,-.45+k*.3,2.65,-.2,.2,.65+((k%2)*.22),.55);}
  if(i===2){for(let k=0;k<5;k++)box(g,colors.purple,-.6+k*.3,2.5+((k%3)*.14),-.2,.13,.25+(k%3)*.28,.2,.2);}
  const beam=rail(r,x,z,x*.35,z*.35,.2,color);beam.scale.x=.13;beam.scale.y=.08;
  m.targets.push({id:'channel'+i,x,z:z+.7,group:g,label:()=>[tr('vision terminal','视觉终端'),tr('language terminal','语言终端'),tr('audio terminal','声音终端')][i]});addCollider(m,x,z,1.4,1.2);
 });
 // Stair-stepped antenna mast and solar farm on two different corners.
 box(r,colors.metal,-4.7,.2,-4.8,1.8,.3,1.8);box(r,colors.dark,-4.7,1.65,-4.8,.3,3,.3);const dish=group(r,-4.7,3.1,-4.8);dish.rotation.z=-.22;for(let i=-2;i<=2;i++)box(dish,colors.cream,i*.28,Math.abs(i)*.16,0,.27,.18,1.15-Math.abs(i)*.21);box(dish,colors.gold,0,.58,0,.1,1.0,.1,.4);addCollider(m,-4.7,-4.8,.7,.7);
 for(let i=0;i<3;i++){const panel=group(r,3.3+i*.75,1,-4.8);panel.rotation.x=-.25;box(panel,colors.dark,0,0,0,.68,.11,1.6);for(let k=0;k<4;k++)box(panel,0x518292,0,.08,-.57+k*.38,.55,.04,.3,.03);box(r,colors.metal,3.3+i*.75,.48,-4.8,.08,.9,.1);}addCollider(m,4,-4.8,2.5,1.8);
 // Pixel dunes and rocks, sparse desert reeds.
 for(const [x,z,s]of[[-5,4.8,.8],[4.8,4.9,.75],[-5.8,-2.8,.5],[2.7,4.8,.35],[-2.9,4.8,.4]]){box(r,colors.stone,x,s*.3,z,s,s*.6,s*.8,0,1,true);box(r,colors.sand,x+.12,s*.6,z,s*.6,.2,s*.55);}
 for(const [x,z]of[[-5.4,2.4],[5.3,2.7]]){box(r,colors.leaf,x,.6,z,.25,1.2,.27);box(r,colors.leaf,x+.26,.7,z,.4,.22,.2);box(r,colors.leaf,x+.44,.9,z,.2,.5,.2);}
 lamp(r,-2.8,3.2,1.7,colors.teal);lamp(r,2.8,3.2,1.7,colors.teal);
 m.bloom=group(r,0,1,0);m.bloom.visible=false;
 box(m.bloom,colors.gold,0,1.2,0,.25,2.2,.25,.3);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(m.bloom,colors.bright,Math.cos(a)*.95,2.2+(i%2)*.2,Math.sin(a)*.95,.58,.45,.58,.45);}box(m.bloom,colors.gold,0,2.45,0,.75,.5,.75,.7);box(m.bloom,colors.leaf,-.5,.8,0,.85,.2,.35);box(m.bloom,colors.leaf,.4,1.25,0,.7,.2,.35);
 return m;
}
function makeSafety(){
 const m=modelBase('safety'),r=m.root;m.span=17.5;m.centerY=1.2;m.start={x:0,z:5.25,yaw:0};
 // A water-cooled data checkpoint: conveyor, inspection arch, bifurcated output bays.
 foundation(m,13,13,colors.dark);box(r,colors.water,0,-.04,0,12.7,.13,12.7,.03,.85);
 for(const x of[-5.1,5.1]){box(r,colors.stone,x,.1,0,2.3,.28,12.7,0,1,true);for(let z=-5;z<=5;z+=2){box(r,colors.metal,x+Math.sign(x)*.85,.6,z,.12,1.1,.12);if(z<5)rail(r,x+Math.sign(x)*.85,z,x+Math.sign(x)*.85,z+2,.95);}}
 box(r,colors.stone,0,.1,3.7,8,.28,5.1,0,1,true);box(r,colors.stone,0,.1,-3.5,8,.28,5.3,0,1,true);
 box(r,colors.dark,0,.55,-.7,2.6,.65,8.7);box(r,colors.metal,0,.9,-.7,2.4,.12,8.6);for(let z=-4.5;z<3.3;z+=.42)box(r,colors.dark,0,.99,z,2.15,.06,.12);
 for(const x of[-1.27,1.27])box(r,colors.cream,x,1.05,-.7,.13,.28,8.6);
 // Substantial protective arch with lit rim, voxel shield sign, and glass membrane.
 for(const x of[-1.85,1.85]){box(r,colors.metal,x,2.1,-.8,.65,4.1,.8,0,1,true);box(r,colors.bright,x,2.15,-.33,.13,3.1,.1,.7);}box(r,colors.cream,0,4.1,-.8,4.5,.6,.85);box(r,colors.teal,0,4.46,-.8,2.2,.17,.64,.25);
 pixelText(r,['#####','# # #',' ### ','  #  '],colors.lime,-.4,4.33,-.32,.2);
 m.shield=group(r,0,2.5,-.8);for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)box(m.shield,colors.teal,x*.85,y*.9,0,.8,.84,.1,.1,.15);
 addCollider(m,0,-.8,2.6,8.8);for(const x of[-1.85,1.85])addCollider(m,x,-.8,.75,.85);
 // Split output paths and separate accept / quarantine containers.
 for(const x of[-3.45,3.45]){box(r,colors.dark,x,.4,-3.7,2.25,.6,2.6);box(r,colors.metal,x,.74,-3.7,2.15,.15,2.5);for(const side of[-1,1])box(r,colors.metal,x+side*1.05,1.1,-3.7,.1,.8,2.5);box(r,colors.metal,x,1.1,-4.92,2.2,.8,.12);addCollider(m,x,-3.7,2.3,2.6);}
 box(r,colors.lime,-3.45,1.2,-4.85,1.2,.3,.11,.6);box(r,colors.coral,3.45,1.2,-4.85,1.2,.3,.11,.6);
 // A freestanding console is reached by walking beside the conveyor.
 const c=group(r,-3.7,0,1.9);box(c,colors.metal,0,.7,0,1.4,1.3,.8);box(c,colors.dark,0,1.5,0,1.55,.7,.3);box(c,colors.bright,0,1.52,.17,1.2,.46,.04,.2);pixelText(c,['# # #',' ### '],colors.dark,-.4,1.68,.21,.18);box(c,colors.lime,-.37,1.08,.5,.35,.12,.27,.3);box(c,colors.coral,.37,1.08,.5,.35,.12,.27,.3);addCollider(m,-3.7,1.9,1.5,1.2);m.targets.push({id:'console',x:-3.7,z:2.7,group:c,label:()=>tr('inspection console','检查控制台')});
 // Server racks, cooling pipes, hazard floor tiles, four working lights.
 for(const x of[-5.1,5.1])for(const z of[-.4,-2.2]){box(r,colors.dark,x,1.05,z,1,1.9,1.15);for(let i=0;i<5;i++){box(r,colors.metal,x,.4+i*.29,z+.59,.8,.16,.035);box(r,i%2?colors.teal:colors.gold,x-.3,.4+i*.29,z+.62,.08,.06,.03,.4);}addCollider(m,x,z,1.1,1.2);}
 for(const x of[-1.9,1.9])for(let z=2.6;z<5.3;z+=.5)box(r,colors.gold,x,.27,z,.35,.035,.22);
 for(const [x,z]of[[-5.5,4.8],[5.5,4.8],[-5.7,-5.1],[5.7,-5.1]])lamp(r,x,z,2.5,colors.blue);
 m.packet=group(r,0,1.5,2.1);m.packetBody=box(m.packet,colors.lime,0,0,0,.7,.7,.7,.2);m.packetTag=box(m.packet,colors.cream,0,0,.37,.43,.32,.035);m.packetMarks=group(m.packet,0,0,0);m.sorted=group(r);return m;
}
function makeUniversity(){
 const m=modelBase('university'),r=m.root;m.span=17.5;m.centerY=1;m.bounds=7;
 // Stylized university courtyard, not a claim of architectural reproduction.
 foundation(m,13,9,colors.grass);box(r,colors.sand,0,.08,1.3,8,.14,4.8,0,1,true);
 for(let x=-3;x<=3;x++)for(let z=0;z<=3;z++)box(r,(x+z)%3?0xa8ac95:0xc3bfa3,x,.18,z,.93,.09,.93);
 box(r,colors.cream,0,1.7,-1.9,5.8,3.2,2.4,0,1,true);box(r,colors.stone2,0,3.36,-1.9,6.2,.2,2.65);
 for(const x of[-4.5,4.5]){box(r,colors.cream,x,1.35,-1.3,2.3,2.5,3.5,0,1,true);box(r,colors.stone2,x,2.65,-1.3,2.5,.2,3.65);}
 for(const x of[-2.2,-1.1,1.1,2.2])for(const y of[1.1,2.3]){box(r,colors.dark,x,y,-.67,.62,.65,.07);box(r,colors.teal,x,y,-.62,.44,.46,.035,.1);}
 for(const x of[-4.5,4.5])for(const z of[-2.2,-1,.2])box(r,colors.teal,x+Math.sign(x)*1.16,1.55,z,.04,.8,.65,.1);
 box(r,colors.dark,0,.9,-.63,1.25,1.6,.1);box(r,colors.teal,0,1,-.56,1,.95,.06,.1);box(r,colors.cream,0,1.1,-.5,.09,1.7,.08);
 for(let i=0;i<3;i++)box(r,colors.stone2,0,.11+i*.08,-.3-i*.2,2.4-i*.1,.14,.45);
 // A tower, books and antenna hint at an engineering university.
 box(r,colors.cream,0,3.95,-1.9,1.7,1.15,1.7);box(r,colors.teal,0,4.58,-1.9,2,.18,2);box(r,colors.dark,0,4,-1.02,.55,.55,.06);box(r,colors.gold,0,4,-.97,.08,.31,.03,.2);box(r,colors.gold,.1,4.12,-.96,.27,.07,.03,.2);
 box(r,colors.metal,-1.9,1.2,2.3,.06,2.4,.06);box(r,colors.coral,-1.5,2.15,2.3,.75,.5,.04);
 for(const [x,z,s]of[[-5.3,2.8,.85],[5.3,2.8,.85],[-5.2,-3.2,.7],[5.2,-3.2,.7]])tree(r,x,z,s);
 for(const x of[-3.4,3.4]){box(r,colors.wood,x,.52,2.5,1.5,.18,.5);for(const dx of[-.5,.5])box(r,colors.dark,x+dx,.25,2.5,.1,.5,.4);box(r,colors.wood,x,.8,2.72,1.5,.35,.1);}
 lamp(r,-3,0,1.75);lamp(r,3,0,1.75);return m;
}
function makeAttention(){
 const m=modelBase('attention'),r=m.root;m.span=17.5;m.centerY=.5;
 // A sculptural circuit board with a sparse attention matrix and stepped GPU.
 foundation(m,12.8,9.4,0x32565a);
 for(let i=0;i<6;i++){const z=-3.5+i*1.35;rail(r,-5.8,z,5.5,z,.1,i%2?0x668c78:0x557b6f);box(r,colors.gold,-5.9,.13,z,.18,.06,.18);box(r,colors.gold,5.6,.13,z,.18,.06,.18);}
 box(r,colors.dark,-2.6,.45,0,4, .8,4);box(r,colors.metal,-2.6,.92,0,3.7,.18,3.7);box(r,colors.teal,-2.6,1.08,0,3.1,.18,3.1,.08);box(r,colors.dark,-2.6,1.25,0,2.6,.18,2.6);
 for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)box(r,(x+z)%2?colors.teal:colors.bright,-2.6+x*.68,1.43,z*.68,.55,.18,.55,.1);
 for(let i=0;i<7;i++){const q=-1.6+i*.53;for(const sign of[-1,1]){box(r,colors.gold,-2.6+q,.5,sign*2.2,.23,.2,.55);box(r,colors.gold,-2.6+sign*2.2,.5,q,.55,.2,.23);}}
 box(r,colors.dark,3,.3,0,3.55,.5,5.3);for(let x=0;x<4;x++)for(let z=0;z<6;z++){const active=x===z%4||(z===2&&x===0)||(z===4&&x===3),h=active?.7:.2;box(r,active?colors.lime:colors.metal,1.75+x*.8,.65+h/2,-2+z*.8,.62,h,.62,active?.2:0);}
 for(let k=0;k<3;k++){box(r,colors.dark,-1+k*.9,.45,-3.5,.55,.65,.65);box(r,colors.cream,-1+k*.9,.82,-3.5,.55,.08,.65);}
 box(r,colors.cream,0,.3,3.7,1.6,.4,.5);box(r,colors.coral,0,.56,3.7,.7,.1,.3);return m;
}
const builders={embodied:makeEmbodied,multimodal:makeMultimodal,safety:makeSafety,university:makeUniversity,attention:makeAttention};

/* WebGL with soft shadows when available; a perspective-correct box renderer is
   included so gameplay and first-person exploration also work without WebGL. */
class SoftwareRenderer {
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.software=true;this.ratio=1;this.calls=0;this.faces=[[[1,0,0],[[.5,.5,.5],[.5,.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,.5,-.5],[-.5,.5,.5],[-.5,-.5,.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[.5,.5,-.5],[.5,.5,.5],[-.5,.5,.5]]],[[0,-1,0],[[-.5,-.5,.5],[.5,-.5,.5],[.5,-.5,-.5],[-.5,-.5,-.5]]],[[0,0,1],[[-.5,.5,.5],[.5,.5,.5],[.5,-.5,.5],[-.5,-.5,.5]]],[[0,0,-1],[[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,-.5],[.5,-.5,-.5]]]];}
 setSize(w,h){this.w=w;this.h=h;this.ratio=Math.min(devicePixelRatio||1,1.4);this.canvas.width=Math.round(w*this.ratio);this.canvas.height=Math.round(h*this.ratio);}
 render(scene,camera){
  if(!this.ctx)return;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
  const surfaces=[],normal=new T.Vector3(),center=new T.Vector3(),eye=new T.Vector3(),light=new T.Vector3(-.5,1,.7).normalize(),view=new T.Matrix4(),p=new T.Vector3();
  scene.traverseVisible(mesh=>{if(!mesh.isMesh)return;const mat=mesh.material;if(!mat||mat.opacity<.025)return;view.multiplyMatrices(camera.matrixWorldInverse,mesh.matrixWorld);center.set(0,0,0).applyMatrix4(mesh.matrixWorld);eye.copy(camera.position).sub(center).normalize();
   for(const [nn,vv]of this.faces){normal.fromArray(nn).transformDirection(mesh.matrixWorld);if(normal.dot(eye)<.001)continue;
    let points=vv.map(q=>new T.Vector3(...q).applyMatrix4(view));const near=-camera.near-.002,out=[];
    for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ai=a.z<near,bi=b.z<near;if(ai)out.push(a);if(ai!==bi){const t=(near-a.z)/(b.z-a.z);out.push(a.clone().lerp(b,t));}}points=out;if(points.length<3)continue;
    const depth=points.reduce((a,q)=>a-q.z,0)/points.length;
    const pts=points.map(q=>{p.copy(q).applyMatrix4(camera.projectionMatrix);return[(p.x+1)*this.w/2,(1-p.y)*this.h/2];});if(pts.every(q=>q[0]<-2)||pts.every(q=>q[0]>this.w+2)||pts.every(q=>q[1]<-2)||pts.every(q=>q[1]>this.h+2))continue;
    surfaces.push({pts,depth,mat,floor:center.y<.24,shade:.56+Math.max(0,normal.dot(light))*.4});
   }
  });surfaces.sort((a,b)=>a.floor!==b.floor?(a.floor?-1:1):b.depth-a.depth);const ctx=this.ctx;ctx.setTransform(this.ratio,0,0,this.ratio,0,0);ctx.clearRect(0,0,this.w,this.h);ctx.imageSmoothingEnabled=false;
  let shadowDrawn=false;
  const drawShadows=()=>{
   const bounds=scene.userData.groundBounds;if(!bounds)return;ctx.save();ctx.globalAlpha=.21;ctx.fillStyle='#102927';ctx.beginPath();
   scene.traverseVisible(mesh=>{if(!mesh.isMesh||!mesh.castShadow||mesh.material.opacity<.9)return;const pos=new T.Vector3();mesh.getWorldPosition(pos);if(pos.y<.4)return;const verts=[];
    for(const x of[-.5,.5])for(const y of[-.5,.5])for(const z of[-.5,.5]){const q=new T.Vector3(x,y,z).applyMatrix4(mesh.matrixWorld);q.x=Math.max(-bounds.x,Math.min(bounds.x,q.x+q.y*.48));q.z=Math.max(-bounds.z,Math.min(bounds.z,q.z-q.y*.36));q.y=.16;q.applyMatrix4(camera.matrixWorldInverse);if(q.z>=-camera.near)return;q.applyMatrix4(camera.projectionMatrix);verts.push([(q.x+1)*this.w/2,(1-q.y)*this.h/2]);}
    verts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]),lo=[],hi=[];for(const q of verts){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}for(let j=verts.length-1;j>=0;j--){const q=verts[j];while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],q)<=0)hi.pop();hi.push(q);}const hull=lo.slice(0,-1).concat(hi.slice(0,-1));if(hull.length>2){ctx.moveTo(...hull[0]);hull.slice(1).forEach(q=>ctx.lineTo(...q));ctx.closePath();}
   });ctx.fill();ctx.restore();
  };
  for(const f of surfaces){if(!f.floor&&!shadowDrawn){drawShadows();shadowDrawn=true;}ctx.globalAlpha=f.mat.opacity;ctx.beginPath();f.pts.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();const color=new T.Color(f.mat.userData.baseColor||f.mat.color.getHex());color.multiplyScalar(Math.min(1.1,f.shade+f.mat.emissiveIntensity*.24)*(scene.userData.day?1.07:1));ctx.fillStyle=color.getStyle();ctx.fill();if(f.mat.map&&f.mat.map.image&&f.pts.length===4&&!f.floor){const pp=f.pts,img=f.mat.map.image;ctx.save();ctx.clip();ctx.globalAlpha=.2*f.mat.opacity;ctx.transform((pp[1][0]-pp[0][0])/img.width,(pp[1][1]-pp[0][1])/img.width,(pp[3][0]-pp[0][0])/img.height,(pp[3][1]-pp[0][1])/img.height,pp[0][0],pp[0][1]);ctx.drawImage(img,0,0);ctx.restore();}if(f.mat.opacity>.9){ctx.strokeStyle='rgba(11,28,31,.08)';ctx.lineWidth=.45;ctx.stroke();}}
  ctx.globalAlpha=1;this.calls=surfaces.length;
 }
 dispose(){}
}
function makeRenderer(canvas,preview){
 let renderer;
 try { const context=canvas.getContext('webgl2',{alpha:true,antialias:true})||canvas.getContext('webgl',{alpha:true,antialias:true});if(!context)throw new Error('WebGL unavailable');renderer=new T.WebGLRenderer({canvas,context,alpha:true,antialias:true,powerPreference:preview?'low-power':'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,preview?1.5:1.8));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap; }
 catch(_){renderer=new SoftwareRenderer(canvas);}
 return renderer;
}
function overviewCamera(m,aspect,angle=.73,tilt=.65){
 const vertical=Math.max(m.span/aspect,m.type==='university'||m.type==='attention'?9.6:12.4),width=vertical*aspect,camera=new T.OrthographicCamera(-width/2,width/2,vertical/2,-vertical/2,.1,100);camera.position.set(Math.sin(angle)*24,Math.sin(tilt)*24,Math.cos(angle)*24);camera.lookAt(0,m.centerY,0);return camera;
}
function setDisplay(m,index,state){
 const ch=m.channels[index];ch.state=state;while(ch.display.children.length)ch.display.remove(ch.display.children[0]);
 const c=[colors.coral,colors.gold,colors.teal][state],patterns=[['###','# #','###'],['## ',' ##','## '],[' # ','###',' # ']];
 pixelText(ch.display,patterns[state],c,-.22,.22,.01,.18);
}
function setPacket(m,index){
 const unsafe=[false,true,true,false,true,false][index]||false;
 m.packetBody.material=material(unsafe?colors.coral:colors.lime,.22);while(m.packetMarks.children.length)m.packetMarks.remove(m.packetMarks.children[0]);
 pixelText(m.packetMarks,unsafe?['# #',' # ','# #']:['  #','# #',' # '],unsafe?colors.coral:colors.dark,-.16,.16,.4,.13);
 return unsafe;
}
function initModel(m){if(m.type==='multimodal')m.channels.forEach((c,i)=>setDisplay(m,i,i));if(m.type==='safety')setPacket(m,0);m.theme(day);}

function initPreviews(){
 const cards=[...document.querySelectorAll('.interest')],background=[...document.querySelectorAll('.background article')];
 const entries=[],types=['embodied','multimodal','safety'];
 cards.forEach((card,i)=>{
  if(!types[i]||card.querySelector('.idea-preview'))return;
  const a=document.createElement('a');a.className='idea-preview';a.href='explore.html?world='+types[i];a.dataset.world=types[i];
  a.innerHTML='<canvas aria-hidden="true"></canvas><span class="idea-preview-label">WORLD / 0'+(i+1)+'</span><span class="idea-preview-link"><span></span><b aria-hidden="true">↗</b></span>';
  const note=document.createElement('p');note.className='idea-model-note';card.prepend(a);card.append(note);
  a.addEventListener('click',()=>{remember();});entries.push({canvas:a.querySelector('canvas'),type:types[i],a,note,index:i});
 });
 background.forEach((card,i)=>{if(i>1||card.querySelector('.static-voxel'))return;const c=document.createElement('canvas');c.className='static-voxel';c.setAttribute('role','img');const cap=document.createElement('div');cap.className='static-model-caption';const heading=card.querySelector('h3');heading.before(c);heading.before(cap);entries.push({canvas:c,type:i?'attention':'university',cap});});
 function labels(){lang=document.documentElement.lang.startsWith('zh')?'zh':'en';day=document.body.classList.contains('day');remember();entries.forEach(e=>{
  if(e.a){e.a.href='explore.html?world='+e.type+'&lang='+lang;e.a.setAttribute('aria-label',tr('Explore '+['Embodied AI','Multimodal LLMs','AI Safety'][e.index]+' in its own interactive world','进入'+['具身智能','多模态大语言模型','人工智能安全'][e.index]+'独立交互世界'));e.a.querySelector('.idea-preview-link span').textContent=tr('ENTER THIS WORLD','进入这个世界');e.note.textContent=[tr('ROBOT WORKSHOP · Collect & deliver · First-person exploration','机器人车间 · 收集与搬运 · 第一人称探索'),tr('SIGNAL OBSERVATORY · Align & fuse · First-person exploration','信号观测站 · 对齐与融合 · 第一人称探索'),tr('SAFETY CHECKPOINT · Inspect & sort · First-person exploration','安全检查站 · 检查与分流 · 第一人称探索')][e.index];}
  else {e.canvas.setAttribute('aria-label',e.type==='university'?tr('A static voxel illustration of a university courtyard','大学庭院的静态体素插画'):tr('A static voxel illustration of a processor and sparse attention matrix','处理器与稀疏注意力矩阵的静态体素插画'));e.cap.textContent=e.type==='university'?tr('A campus in miniature · Stylized illustration','微缩校园 · 风格化示意'):tr('Sparse connections, focused computation · Stylized illustration','稀疏连接，专注计算 · 风格化示意');}
  if(e.model){e.model.theme(day);renderPreview(e);}
 });}
 function renderPreview(e){if(!e.renderer)return;const rect=e.canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;e.renderer.setSize(rect.width,rect.height,false);const cam=overviewCamera(e.model,rect.width/rect.height,.73,.7);e.renderer.render(e.model.scene,cam);e.canvas.dataset.ready='true';}
 // Models are rendered on demand and never continuously animated on the homepage.
 function load(e){if(e.model)return;e.model=builders[e.type]();initModel(e.model);e.renderer=makeRenderer(e.canvas,true);renderPreview(e);new ResizeObserver(()=>renderPreview(e)).observe(e.canvas);}
 const observer=new IntersectionObserver(xs=>xs.forEach(x=>{if(x.isIntersecting){const e=entries.find(e=>e.canvas===x.target);if(e)load(e);observer.unobserve(x.target);}}),{rootMargin:'200px'});entries.forEach(e=>observer.observe(e.canvas));
 labels();window.addEventListener('languagechange',labels);new MutationObserver(labels).observe(document.body,{attributes:true,attributeFilter:['class']});
 window.ideaPreviews={entries,renderAll:()=>entries.forEach(load)};
}

function initExplore(){
 const params=new URLSearchParams(location.search),type=['embodied','multimodal','safety'].includes(params.get('world'))?params.get('world'):'embodied';
 const id=n=>document.getElementById(n),canvas=id('idea-explore'),stage=id('explore-stage');
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.body.classList.toggle('day',day);
 const m=builders[type]();initModel(m);const renderer=makeRenderer(canvas,false);
 const perspective=new T.PerspectiveCamera(67,1,.08,65);let camera,overview=true,orbit=.73,tilt=.62;
 let width=1,height=1,last=performance.now(),clock=0,lastRender=0,dirty=true;
 let drag=null,pressed=new Set(),statusKey='start',statusUntil=0,held=null,walked=0;
 const player={x:m.start.x,z:m.start.z,yaw:m.start.yaw,pitch:0};
 const state={collected:[],delivered:0,carrying:-1,channels:[0,1,2],fused:false,sorted:0,mistakes:0,unsafe:false,finished:false};
 let transit=null;
 const titles={embodied:['Embodied AI','具身智能'],multimodal:['Multimodal LLMs','多模态大语言模型'],safety:['AI Safety','人工智能安全']};
 function message(key,ms=3500){statusKey=key;statusUntil=performance.now()+ms;updateStatus();}
 function nameWorld(){return tr(...titles[type]);}
 function reset(){
  player.x=m.start.x;player.z=m.start.z;player.yaw=0;player.pitch=0;walked=0;pressed.clear();held=null;
  state.collected=[];state.delivered=0;state.carrying=-1;state.channels=[0,1,2];state.fused=false;state.sorted=0;state.mistakes=0;state.finished=false;transit=null;
  if(m.cells){m.cells.forEach(g=>g.visible=true);m.sockets.forEach(g=>g.material=material(colors.metal));}
  if(m.channels){m.channels.forEach((c,i)=>setDisplay(m,i,i));m.bloom.visible=false;m.core.visible=true;}
  if(m.packet){m.packet.visible=true;m.packet.position.set(0,1.5,2.1);state.unsafe=setPacket(m,0);while(m.sorted.children.length)m.sorted.remove(m.sorted.children[0]);}
  orbit=.73;tilt=.62;dirty=true;message('start',5000);labels();
 }
 function availableTargets(){return m.targets.filter(t=>!(t.id.startsWith('cell')&&!m.cells[+t.id.slice(4)].visible));}
 function closest(){const ts=availableTargets().map(t=>({...t,d:Math.hypot(t.x-player.x,t.z-player.z)})).sort((a,b)=>a.d-b.d);return ts[0];}
 function messages(){
  const target=closest();return {
   start: type==='embodied'?tr('Find a golden cell, then bring it to the three-socket charging dock.','找到金色能量方块，将它送到三槽充电站。'):type==='multimodal'?tr('Tune each terminal to the cyan + symbol, then activate the central core.','将三个终端调成青色 + 符号，再激活中央核心。'):tr('Mint ✓ packets pass. Coral × packets go to quarantine. Inspect all six.','薄荷绿 ✓ 方块放行，珊瑚红 × 方块隔离。检查全部六个。'),
   picked:tr('Cell collected. Bring it to the charging dock at the timber workshop.','已拿起方块。把它送到木制车间前的充电站。'),
   carrying:tr('Your hands are full. Deliver this cell before collecting another.','一次只能携带一个方块，请先送到充电站。'),
   delivered:tr('Power restored to one socket. Find the next golden cell.','一处插槽已充能，继续寻找下一个金色方块。'),
   empty:tr('The dock needs power. Collect a golden cell first.','充电站还缺能量，请先找到金色方块。'),
   far:tr('Move closer to a highlighted object, then interact.','靠近可交互物体，再按交互键。'),
   tuned:tr('Signal changed. All three terminals must show the cyan + symbol.','信号已切换。让三个终端都显示青色 + 符号。'),
   unaligned:tr('The signals do not agree yet. Tune all three terminals to cyan +.','信号还未对齐，请将三个终端调成青色 +。'),
   correct:tr('Correct route. The next packet is ready for inspection.','分流正确，下一个方块已准备好。'),
   incorrect:tr('That route would be unsafe. The shield caught it. Try the other route.','这条路径不合适，防护屏障已拦截。试试另一条。'),
   console:tr('Use Pass or Quarantine to route the packet on the conveyor.','使用“放行”或“隔离”，给传送带上的方块分流。'),
   wait:tr('Routing the current packet. One moment.','正在分流当前方块，请稍候。'),
   completed: type==='embodied'?tr('All three cells delivered. The workshop is powered up!','三个能量方块全部送达，车间已重新点亮！'):type==='multimodal'?tr('Three signals, one shared idea. Your voxel bloom is complete!','三种信号，一个共同概念。体素花朵已生成！'):tr('All six packets safely routed. The checkpoint is secure!','六个方块已安全分流，检查站任务完成！'),
   nearby:target?tr('Nearby: '+target.label()+'. Press E or Interact.','附近：'+target.label()+'。按 E 或点击交互。'):tr('Explore at your own pace.','慢慢探索这个世界。'),
   move:overview?tr('Drag to orbit. Click a terminal or object to interact.','拖动旋转全景，点击终端或物体交互。'):tr('WASD or the arrow pad to walk. Drag the scene to look around.','WASD 或屏幕方向键行走，拖动画面环顾四周。')
  };
 }
 function updateStatus(){const all=messages();id('explore-message').textContent=all[statusKey]||all.move;}
 function progress(){return type==='embodied'?state.delivered:type==='multimodal'?(state.fused?4:state.channels.filter(s=>s===2).length):state.sorted;}
 function labels(){
  document.title=nameWorld()+' · Yizhe Yang';id('explore-title').textContent=nameWorld();id('explore-world-id').textContent='WORLD / 0'+(['embodied','multimodal','safety'].indexOf(type)+1);
  id('explore-kicker').textContent=tr('A SMALL EXPERIMENT','一个小小的交互实验');
  id('explore-mission-title').textContent=type==='embodied'?tr('Bring the workshop to life.','让机器人车间苏醒。'):type==='multimodal'?tr('Find a shared signal.','寻找共同的信号。'):tr('Let the right things through.','让可信的信号通过。');
  id('explore-mission-text').textContent=type==='embodied'?tr('Find 3 energy cells. Carry them one at a time to the charging dock. Navigate around solid obstacles.','找到 3 个能量方块，逐个送到充电站。绕过障碍，在世界中感知与行动。'):type==='multimodal'?tr('Three different channels. Tune vision, language and audio to cyan +, then activate the fusion core.','三个不同通道。将视觉、语言与声音调成青色 +，再激活融合核心。'):tr('Inspect the incoming packets. Pass mint ✓, quarantine coral ×. The shield catches wrong turns.','检查传入的方块：薄荷绿 ✓ 放行，珊瑚红 × 隔离。防护屏障会拦截错误分流。');
  const total=type==='embodied'?3:type==='multimodal'?4:6;
  id('explore-progress').innerHTML=Array.from({length:total},(_,i)=>'<i class="'+(i<progress()?'done':'')+'"></i>').join('');
  id('explore-stat-label').textContent=type==='embodied'?tr('POWER RESTORED','能量已恢复'):type==='multimodal'?tr('SIGNALS ALIGNED','信号已对齐'):tr('PACKETS ROUTED','方块已分流');
  id('explore-stat-value').textContent=progress()+' / '+total;id('explore-view-label').textContent=overview?tr('OVERVIEW','全景视角'):tr('FIRST PERSON','第一人称');
  id('view-overview').textContent=tr('Overview','全景');id('view-person').textContent=tr('First person','第一人称');id('explore-reset').textContent=tr('↻ Reset','↻ 重置');
  id('view-overview').classList.toggle('is-active',overview);id('view-person').classList.toggle('is-active',!overview);id('view-overview').setAttribute('aria-pressed',String(overview));id('view-person').setAttribute('aria-pressed',String(!overview));
  id('explore-language').textContent=lang==='zh'?'EN':'中文';id('explore-language').setAttribute('aria-label',tr('Switch to Chinese','切换到英文'));
  id('explore-theme').textContent=day?'☾':'☀';id('explore-theme').setAttribute('aria-label',day?tr('Switch to night','切换到夜晚'):tr('Switch to daylight','切换到白天'));
  id('explore-home').setAttribute('aria-label',tr('Back to Yizhe Yang’s homepage','返回杨艺哲的主页'));
  id('explore-help').textContent=overview?tr('Drag to orbit · Click objects to interact\nWASD / arrow pad to move · E to interact','拖动旋转 · 点击物体交互\nWASD / 方向面板行走 · E 交互'):tr('WASD / arrow pad to walk · Drag to look\nE to interact · Escape for overview','WASD / 方向面板行走 · 拖动环顾\nE 交互 · Esc 返回全景');
  id('explore-note').textContent=tr('A playful sketch, not a research result.','趣味交互示意，不代表研究成果。');
  document.querySelector('.explore-links').setAttribute('aria-label',tr('Other worlds','其他世界'));
  id('explore-failure').textContent=tr('This world could not be loaded. Your profile is still available from the link above.','这个世界暂时无法载入，你仍可通过左上角链接返回主页。');
  document.querySelectorAll('[data-world-link]').forEach(a=>{a.href='explore.html?world='+a.dataset.worldLink+'&lang='+lang;a.textContent=tr(...({embodied:['Embodied','具身智能'],multimodal:['Multimodal','多模态'],safety:['Safety','AI 安全']}[a.dataset.worldLink]));if(a.dataset.worldLink===type)a.setAttribute('aria-current','page');});
  canvas.setAttribute('aria-label',tr(nameWorld()+' interactive voxel world. WASD moves, drag to look, E interacts. Escape returns to overview.','可交互的'+nameWorld()+'体素世界。WASD 移动，拖动环顾，E 交互，Esc 返回全景。'));
  document.querySelector('.explore-movement').setAttribute('aria-label',tr('Movement controls','移动控制'));
  document.querySelectorAll('[data-move]').forEach((b,i)=>b.setAttribute('aria-label',[tr('Move forward','向前移动'),tr('Move left','向左移动'),tr('Move backward','向后移动'),tr('Move right','向右移动')][i]));
  const actions=id('explore-actions');if(!actions.children.length){
   if(type==='safety'){['pass','quarantine'].forEach(key=>{const b=document.createElement('button');b.className='explore-button '+(key==='pass'?'action-primary':'');b.type='button';b.dataset.action=key;b.addEventListener('click',()=>sort(key==='quarantine'));actions.append(b);});}
   else{const b=document.createElement('button');b.className='explore-button action-primary';b.type='button';b.dataset.action='interact';b.addEventListener('click',()=>interact());actions.append(b);}
  }
  actions.querySelectorAll('button').forEach(b=>{b.textContent=b.dataset.action==='pass'?tr('✓ Pass [1]','✓ 放行 [1]'):b.dataset.action==='quarantine'?tr('× Quarantine [2]','× 隔离 [2]'):tr('E · Interact','E · 交互');b.disabled=state.finished||!!transit;});
  updateStatus();dirty=true;
 }
 function setView(isOverview){overview=isOverview;pressed.clear();held=null;document.body.classList.toggle('first-person',!overview);canvas.classList.toggle('is-first-person',!overview);if(m.robot)m.robot.visible=overview;labels();resize();message('move',4500);canvas.focus({preventScroll:true});}
 function interact(target){
  if(state.finished){message('completed');return;}
  if(!target){target=closest();if(!target||target.d>3.15){message('far');return;}}
  if(type==='embodied'){
   if(target.id==='dock'){
    if(state.carrying<0){message('empty');return;}
    state.delivered++;m.sockets[state.delivered-1].material=material(colors.bright,.8);state.carrying=-1;
    if(state.delivered===3){state.finished=true;message('completed',15000);}else message('delivered');
   }else if(target.id.startsWith('cell')){const i=+target.id.slice(4);if(!m.cells[i].visible)return;if(state.carrying>=0){message('carrying');return;}state.carrying=i;state.collected.push(i);m.cells[i].visible=false;message('picked');}
  }else if(type==='multimodal'){
   if(target.id==='core'){
    if(!state.channels.every(s=>s===2)){message('unaligned');return;}state.fused=true;state.finished=true;m.core.visible=false;m.bloom.visible=true;message('completed',15000);
   }else{const i=+target.id.slice(7);state.channels[i]=(state.channels[i]+1)%3;setDisplay(m,i,state.channels[i]);message('tuned');}
  }else message('console');
  labels();
 }
 function sort(quarantine){
  if(state.finished){message('completed');return;}if(transit){message('wait');return;}
  if(!overview&&Math.hypot(player.x+3.7,player.z-2.7)>3.15){message('far');return;}
  if(quarantine!==state.unsafe){state.mistakes++;message('incorrect',5500);m.shield.children.forEach(x=>x.material=material(colors.coral,.15,.28));setTimeout(()=>{m.shield.children.forEach(x=>x.material=material(colors.teal,.1,.15));dirty=true;},700);dirty=true;return;}
  if(reduce.matches){finishPacket(quarantine);return;}
  transit={start:performance.now()/1000,duration:1.15,quarantine};labels();message('wait',2000);
 }
 function finishPacket(quarantine){
  const count=m.sorted.children.length,x=quarantine?3.45:-3.45,z=-3.15-(Math.floor(count/2)%2)*.65;box(m.sorted,quarantine?colors.coral:colors.lime,x+(count%2?-.4:.35),1.15,z,.5,.5,.5,.12);
  state.sorted++;transit=null;m.packet.position.set(0,1.5,2.1);
  if(state.sorted===6){state.finished=true;m.packet.visible=false;message('completed',15000);}else{state.unsafe=setPacket(m,state.sorted);message('correct');}labels();
 }
 function blocked(x,z){if(Math.abs(x)>m.bounds||Math.abs(z)>m.bounds)return true;return m.colliders.some(c=>Math.abs(x-c.x)<c.w/2+.24&&Math.abs(z-c.z)<c.d/2+.24);}
 function move(dx,dz,dt){
  const length=Math.hypot(dx,dz);if(!length)return;const speed=2.8*dt/length,sy=Math.sin(player.yaw),cy=Math.cos(player.yaw),mx=(dx*cy-dz*sy)*speed,mz=(dx*-sy-dz*cy)*speed;
  const steps=Math.max(1,Math.ceil(Math.hypot(mx,mz)/.08));for(let i=0;i<steps;i++){if(!blocked(player.x+mx/steps,player.z))player.x+=mx/steps;if(!blocked(player.x,player.z+mz/steps))player.z+=mz/steps;}walked+=dt;dirty=true;
 }
 function resize(){const b=stage.getBoundingClientRect();width=b.width;height=b.height;renderer.setSize(width,height,false);perspective.aspect=width/height;perspective.updateProjectionMatrix();dirty=true;}
 new ResizeObserver(resize).observe(stage);
 id('view-overview').addEventListener('click',()=>setView(true));id('view-person').addEventListener('click',()=>setView(false));id('explore-reset').addEventListener('click',reset);
 id('explore-language').addEventListener('click',()=>{lang=lang==='zh'?'en':'zh';document.documentElement.lang=lang==='zh'?'zh-CN':'en';remember();labels();});
 id('explore-theme').addEventListener('click',()=>{day=!day;document.body.classList.toggle('day',day);m.theme(day);remember();labels();});
 document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();held=b.dataset.move;b.setPointerCapture(e.pointerId);});for(const ev of['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held=null);});
 const recognized=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','Digit1','Digit2','Escape'];
 window.addEventListener('keydown',e=>{if(!recognized.includes(e.code)||e.altKey||e.ctrlKey||e.metaKey)return;if(e.target instanceof HTMLButtonElement&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))return;e.preventDefault();pressed.add(e.code);if(e.repeat)return;if(e.code==='KeyE')interact();if(e.code==='Digit1'&&type==='safety')sort(false);if(e.code==='Digit2'&&type==='safety')sort(true);if(e.code==='Escape')setView(true);});
 window.addEventListener('keyup',e=>pressed.delete(e.code));window.addEventListener('blur',()=>{pressed.clear();held=null;drag=null;});document.addEventListener('visibilitychange',()=>{last=performance.now();pressed.clear();held=null;});
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;canvas.focus({preventScroll:true});drag={x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,distance:0};canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.distance+=Math.abs(dx)+Math.abs(dy);if(overview){orbit-=dx*.007;tilt=Math.max(.24,Math.min(1.05,tilt+dy*.004));}else{player.yaw-=dx*.006;player.pitch=Math.max(-1.05,Math.min(.85,player.pitch-dy*.004));}drag.x=e.clientX;drag.y=e.clientY;dirty=true;});
 canvas.addEventListener('pointerup',e=>{if(drag&&drag.distance<8&&overview)clickObject(e);drag=null;canvas.classList.remove('is-dragging');});canvas.addEventListener('pointercancel',()=>{drag=null;canvas.classList.remove('is-dragging');});
 function clickObject(e){
  const bounds=canvas.getBoundingClientRect(),pos=new T.Vector2((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1),ray=new T.Raycaster();ray.setFromCamera(pos,camera);
  const hits=ray.intersectObjects(availableTargets().map(t=>t.group),true).filter(h=>h.object.visible);if(!hits.length)return;let object=hits[0].object;const targets=availableTargets();let found;
  while(object&&!found){found=targets.find(t=>t.group===object);object=object.parent;}
  if(found)interact(found);
 }
 function render(now){requestAnimationFrame(render);if(document.hidden)return;const dt=Math.min((now-last)/1000,.25);last=now;clock+=dt;
  const dx=(pressed.has('KeyD')||held==='right'?1:0)-(pressed.has('KeyA')||held==='left'?1:0),dz=(pressed.has('KeyW')||pressed.has('ArrowUp')||held==='forward'?1:0)-(pressed.has('KeyS')||pressed.has('ArrowDown')||held==='back'?1:0);move(dx,dz,dt);
  if(pressed.has('ArrowLeft')){if(overview)orbit+=dt;else player.yaw+=dt;dirty=true;}if(pressed.has('ArrowRight')){if(overview)orbit-=dt;else player.yaw-=dt;dirty=true;}
  if(transit){const t=Math.min(1,(now/1000-transit.start)/transit.duration),x=(transit.quarantine?3.45:-3.45)*Math.max(0,(t-.45)/.55);m.packet.position.set(x,1.5,2.1-t*5.8);dirty=true;if(t>=1)finishPacket(transit.quarantine);}
  if(now>statusUntil){const near=closest();const next=state.finished?'completed':!overview&&near&&near.d<3.15?'nearby':'move';if(next!==statusKey){statusKey=next;updateStatus();}}
  if(m.robot){m.robot.position.set(player.x,0,player.z);m.robot.rotation.y=player.yaw;m.robot.visible=overview;}
  if(!reduce.matches){if(m.cells)m.cells.forEach((g,i)=>{g.position.y=.85+Math.sin(clock*1.7+i)*.08;g.rotation.y=clock*.35;});if(m.core){m.core.rotation.y=Math.PI/4+clock*.17;m.core.position.y=1.45+Math.sin(clock)*.07;}if(m.bloom&&m.bloom.visible)m.bloom.rotation.y=Math.sin(clock*.2)*.09;}
  if(!overview&&(dx||dz))id('explore-view-label').textContent=tr('FIRST PERSON','第一人称')+' · '+player.x.toFixed(1)+' / '+player.z.toFixed(1);
  if(renderer.software&&now-lastRender<55)return;if(!dirty&&(reduce.matches||type==='safety'))return;
  lastRender=now;dirty=false;
  if(overview){
   const aspect=width/height,vertical=Math.max(m.span*(width<600?1.08:1.12)/aspect,12.8),base=vertical*aspect;camera=new T.OrthographicCamera(-base/2,base/2,vertical/2,-vertical/2,.1,100);camera.position.set(Math.sin(orbit)*24,Math.sin(tilt)*24,Math.cos(orbit)*24);camera.lookAt(0,m.centerY+(width<600?2:0),0);
  }else{camera=perspective;camera.position.set(player.x,1.62+(reduce.matches?0:(dx||dz?Math.sin(walked*10)*.025:0)),player.z);camera.rotation.order='YXZ';camera.rotation.set(player.pitch,player.yaw,0);}
  const renderStart=performance.now();renderer.render(m.scene,camera);canvas.dataset.frameMs=(performance.now()-renderStart).toFixed(1);canvas.dataset.ready='true';
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('failed');});canvas.addEventListener('webglcontextrestored',()=>location.reload());
 reset();resize();requestAnimationFrame(render);
 window.ideaWorld={type,model:m,renderer,getState:()=>({type,overview,player:{...player},...JSON.parse(JSON.stringify(state)),transit:!!transit,software:!!renderer.software,reducedMotion:reduce.matches}),getCamera:()=>camera,projectTarget:id=>{const t=m.targets.find(t=>t.id===id);if(!t||!camera)return null;const p=new T.Vector3();t.group.getWorldPosition(p);p.project(camera);return{x:(p.x+1)*width/2,y:(1-p.y)*height/2};}};
}
if(page)initExplore();else initPreviews();
})();
