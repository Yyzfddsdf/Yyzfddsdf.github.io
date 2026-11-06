/* Living island: local-only, dependency-free interaction built on the bundled Three.js. */
(function () {
'use strict';
window.createIslandLife=function (api) {
  const {THREE,canvas,shell,scene,world,camera:orbitCamera,renderer,meshBox,materials,lampMat,inIsland,pond}=api;
  const zh=()=>document.documentElement.lang==='zh-CN';
  const tr=(en,cn)=>zh()?cn:en;
  const camera=new THREE.PerspectiveCamera(72,1,.055,75);
  camera.rotation.order='YXZ';
  let active=false,previousFocus=null,oldScroll=0,yaw=0,pitch=0,lookPointer=null,lastPX=0,lastPY=0;
  let pressX=0,pressY=0,pressId=null,nearest=null,toastTime=0,walking=0,planTime=0;
  const keys=new Set(),held=new Set(),inertNodes=[],seen=new Set();
  const player={x:1.75,z:2.5};
  const mat=(color)=>new THREE.MeshStandardMaterial({color,roughness:.9});
  const skin=mat(0xdba47a),hair=mat(0x392a29),shirt=mat(0xcc795a),shirtLight=mat(0xe49d71),pants=mat(0x344d62),boots=mat(0x253039),white=mat(0xf1e6cc),ink=mat(0x26323b),teal=mat(0x518982),gold=mat(0xd8ad5b),red=mat(0x985d55);
  const resident=new THREE.Group();resident.name='island-resident';world.add(resident);resident.position.set(player.x,.5,player.z);
  const add=(m,x,y,z,sx,sy,sz,parent=resident)=>meshBox(m,x,y,z,sx,sy,sz,parent);
  const pivot=(x,y,z)=>{const g=new THREE.Group();g.position.set(x,y,z);resident.add(g);return g;};
  const leftLeg=pivot(-.13,.48,0),rightLeg=pivot(.13,.48,0);
  for(const leg of[leftLeg,rightLeg]){add(pants,0,-.2,0,.21,.4,.24,leg);add(boots,0,-.42,.045,.22,.12,.32,leg);}
  add(shirt,0,.72,0,.48,.5,.28);add(shirtLight,0,.83,.149,.08,.27,.024);
  add(teal,0,.76,-.22,.36,.37,.17);add(gold,0,.72,-.31,.1,.07,.025);
  add(skin,0,1.08,0,.38,.37,.34);add(hair,0,1.29,-.01,.4,.12,.37);
  add(hair,0,1.18,-.17,.4,.25,.055);add(hair,-.17,1.22,0,.08,.18,.35);
  add(white,-.092,1.11,.176,.095,.075,.025);add(white,.092,1.11,.176,.095,.075,.025);
  add(ink,-.075,1.105,.192,.04,.055,.018);add(ink,.11,1.105,.192,.04,.055,.018);
  add(skin,.02,1.03,.195,.08,.06,.07);add(hair,.02,.967,.177,.105,.025,.025);
  const leftArm=pivot(-.32,.91,0),rightArm=pivot(.32,.91,0);
  for(const arm of[leftArm,rightArm]){add(shirt,0,-.12,0,.17,.25,.25,arm);add(skin,0,-.32,0,.16,.2,.22,arm);}
  const book=new THREE.Group();rightArm.add(book);book.position.set(0,-.43,.07);add(teal,0,0,0,.24,.08,.29,book);add(white,0,.045,0,.19,.035,.24,book);book.visible=false;
  // Warm, furnished interior. The building itself has separate walls and a real open doorway.
  add(red,1.6,.785,-1.45,1.2,.025,1.6,world);
  add(materials.wood,.57,.92,-2.03,.7,.3,1.35,world);
  add(teal,.57,1.10,-1.9,.72,.12,1.05,world);
  add(white,.57,1.13,-2.5,.63,.14,.3,world);
  add(materials.wood,2.68,1.1,-2.24,.71,.65,.75,world);
  add(materials.plank,2.68,1.45,-2.24,.84,.11,.88,world);
  add(ink,2.68,1.73,-2.39,.47,.38,.07,world);
  const screen=mat(0x98cab1);screen.emissive=new THREE.Color(0x417d66);screen.emissiveIntensity=.7;
  add(screen,2.68,1.73,-2.345,.39,.29,.025,world);
  add(gold,2.53,1.51,-2.10,.11,.035,.2,world);add(teal,2.77,1.51,-2.09,.14,.04,.2,world);
  add(materials.plank,1.5,2.23,-2.68,1.4,.1,.22,world);
  for(let i=0;i<7;i++)add([teal,red,gold,white][i%4],.98+i*.16,2.39,-2.68,.115,.23+(i%3)*.035,.16,world);
  add(lampMat,1.6,2.43,-1.5,.18,.18,.18,world);
  add(materials.wood,1.6,2.61,-1.5,.055,.2,.055,world);
  const indoorLight=new THREE.PointLight(0xffd29b,3.1,4.4,1.6);indoorLight.position.set(1.6,2.35,-1.5);world.add(indoorLight);
  // A work garden, a quiet bench, and a small trail sign give the resident destinations.
  add(materials.wood,2.95,.68,1.06,.87,.26,.68,world);
  add(materials.dirt,2.95,.82,1.06,.76,.045,.57,world);
  for(let i=0;i<3;i++){add(teal,2.68+i*.27,1.0,1.06,.08,.36,.08,world);add(gold,2.68+i*.27,1.19,1.06,.15,.13,.15,world);}
  add(materials.plank,-1.5,.92,-2.75,1.1,.14,.4,world);add(materials.wood,-1.88,.7,-2.75,.12,.4,.3,world);add(materials.wood,-1.12,.7,-2.75,.12,.4,.3,world);
  add(materials.plank,-1.5,1.2,-2.93,1.1,.35,.09,world);
  add(materials.wood,2.75,.92,2.8,.09,.85,.09,world);add(materials.plank,2.75,1.34,2.8,.59,.3,.08,world);
  add(gold,2.75,1.34,2.85,.33,.035,.025,world);
  const obstacles=[
    [.04,-1.55,.18,2.7],[3.16,-1.55,.18,2.7],[1.6,-2.86,3.3,.18],
    [.48,-.24,.88,.18],[2.72,-.24,.88,.18],
    [.57,-2.03,.74,1.4],[2.68,-2.24,.86,.9],[-3.4,-1.6,.85,.85],
    [4.15,2.2,.22,2.6],[2.95,1.06,.9,.72],[-1.5,-2.75,1.15,.45],[2.75,2.8,.12,.12],
    [0,1.2,.18,.18],[3.6,2.9,.18,.18],[-4.3,2.4,.18,.18],
    [3.9,-3,.67,.7],[4.4,-2.5,.4,.4]
  ];
  function onLand(x,z){const ix=Math.round(x),iz=Math.round(z);return ix>=-5&&ix<=5&&iz>=-4&&iz<=4&&inIsland(ix,iz)&&!pond(ix,iz);}
  function safe(x,z,r=.18){for(let i=0;i<8;i++){const a=i*Math.PI/4;if(!onLand(x+Math.cos(a)*r,z+Math.sin(a)*r))return false;}return !obstacles.some(o=>Math.abs(x-o[0])<o[2]/2+r&&Math.abs(z-o[1])<o[3]/2+r);}
  function floor(x,z){return x>-.24&&x<3.44&&z>-3.15&&z<.1?.79:.5;}
  function move(p,dx,dz){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));for(let i=0;i<steps;i++){if(safe(p.x+dx/steps,p.z))p.x+=dx/steps;if(safe(p.x,p.z+dz/steps))p.z+=dz/steps;}}
  // A small A* grid routes around the pond, walls, furniture, and the island edge.
  function pathTo(from,to){
    const step=.25,key=(x,z)=>x+','+z,goal=[Math.round(to.x/step),Math.round(to.z/step)];
    const candidates=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const x=Math.round(from.x/step)+dx,z=Math.round(from.z/step)+dz,d=Math.hypot(x*step-from.x,z*step-from.z);if(!safe(x*step,z*step))continue;let clear=true;const samples=Math.max(1,Math.ceil(d/.06));for(let i=1;i<=samples;i++)if(!safe(from.x+(x*step-from.x)*i/samples,from.z+(z*step-from.z)*i/samples)){clear=false;break;}if(clear)candidates.push({x,z,d});}
    candidates.sort((a,b)=>a.d-b.d);if(!candidates.length)return [];const start=[candidates[0].x,candidates[0].z];
    if(!safe(goal[0]*step,goal[1]*step))return [];
    const open=[{x:start[0],z:start[1],g:0,f:0}],scores=new Map([[key(...start),0]]),parents=new Map(),closed=new Set();
    for(let count=0;open.length&&count<4000;count++){
      let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
      const n=open.splice(best,1)[0],nk=key(n.x,n.z);if(closed.has(nk))continue;closed.add(nk);
      if(n.x===goal[0]&&n.z===goal[1]){const route=[];let k=nk;while(k!==key(...start)){const [x,z]=k.split(',').map(Number);route.unshift({x:x*step,z:z*step});k=parents.get(k);if(!k)return [];}route.unshift({x:start[0]*step,z:start[1]*step});route.push(to);return route;}
      for(const [dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const x=n.x+dx,z=n.z+dz,k=key(x,z),g=n.g+Math.hypot(dx,dz);
        if(Math.abs(x)>22||Math.abs(z)>18||closed.has(k)||!safe(x*step,z*step))continue;
        if(dx&&dz&&(!safe((n.x+dx)*step,n.z*step)||!safe(n.x*step,(n.z+dz)*step)))continue;
        if(g>=(scores.get(k)??Infinity))continue;scores.set(k,g);parents.set(k,nk);open.push({x,z,g,f:g+Math.hypot(goal[0]-x,goal[1]-z)});
      }
    }return [];
  }
  const activities=[
    {id:'rest',en:'Resting at home',cn:'回小屋休息',x:1.6,z:-1.4,face:Math.PI,weight:1},
    {id:'read',en:'Reading & tinkering',cn:'读书与研究',x:1.75,z:-2,face:Math.PI/2,weight:2},
    {id:'garden',en:'Tending the garden',cn:'照料小菜园',x:2.75,z:1.75,face:Math.PI,weight:2.5},
    {id:'pond',en:'Watching the waterfall',cn:'在水边发呆',x:0,z:2.75,face:-Math.PI/2,weight:1.5},
    {id:'stroll',en:'Taking in the view',cn:'散步看风景',x:3,z:3.5,face:0,weight:1.2},
    {id:'think',en:'Thinking under the oak',cn:'树下思考',x:-1.5,z:-2,face:Math.PI,weight:1.7}
  ];
  const npc={x:player.x,z:player.z,energy:82,curiosity:48,care:30,activity:activities[3],phase:'walking',route:[],remaining:0};
  function choose(){
    let a;if(npc.energy<30)a=activities[0];else if(npc.care>78)a=activities[2];else if(npc.curiosity>78)a=activities[1];
    else{const options=activities.filter(a=>a!==npc.activity&&a.id!=='rest');let n=Math.random()*options.reduce((s,a)=>s+a.weight,0);a=options.find(a=>(n-=a.weight)<=0)||options[0];}
    npc.activity=a;npc.route=pathTo(npc,{x:a.x,z:a.z});npc.phase=npc.route.length?'walking':'acting';npc.remaining=6+Math.random()*7;planTime=0;labels();
  }
  const overlay=document.createElement('div');overlay.className='island-overlay';
  overlay.innerHTML='<button class="resident-pin" type="button"><span class="resident-led"></span><span>Y. / EXPLORER</span><span class="resident-arrow">↗</span></button><div class="resident-card"><span class="resident-kicker">A LITTLE LIFE HERE</span><span class="resident-activity"></span><button type="button" class="enter-island"></button></div><div class="explore-hud" hidden><div class="explore-top"><div><span class="explore-kicker">OVERWORLD / 001</span><h2 class="explore-location"></h2><p class="explore-progress"></p></div><div class="explore-top-actions"><button class="explore-day" type="button">☀</button><button class="exit-island" type="button"></button></div></div><div class="explore-crosshair" aria-hidden="true"></div><div class="landmark-card" hidden><button class="close-landmark" type="button">×</button><span class="landmark-kicker"></span><h3></h3><p></p></div><div class="explore-bottom"><p class="explore-help"></p><button class="inspect-island" type="button"></button></div><div class="move-pad" aria-label="Movement controls"><button data-move="forward" class="move-forward" aria-label="Move forward">↑</button><button data-move="left" class="move-left" aria-label="Move left">←</button><button data-move="back" class="move-back" aria-label="Move backward">↓</button><button data-move="right" class="move-right" aria-label="Move right">→</button></div><div class="explore-toast" role="status" aria-live="polite"></div></div>';
  shell.appendChild(overlay);
  const $=s=>overlay.querySelector(s),pin=$('.resident-pin'),card=$('.resident-card'),hud=$('.explore-hud'),info=$('.landmark-card');
  const landmarks=[
    {id:'cabin',x:1.6,z:-1.3,en:'A place to think',cn:'留一盏灯，慢慢思考',text:'A warm cabin, a few books, and room for new ideas. Walk through the open door to explore the desk and bed.',textCN:'一间温暖的小屋，几本书，和留给新想法的空间。穿过敞开的门，可以走近书桌与小床。'},
    {id:'desk',x:2.4,z:-2.1,en:'Attention & optimization',cn:'注意力机制与优化',text:'Yizhe’s technical experience includes NSA sparse attention optimization on MetaX C500 using TileLang.',textCN:'杨艺哲的技术经历包括使用 TileLang，在 MetaX C500 上开展 NSA 稀疏注意力优化。'},
    {id:'garden',x:2.8,z:1.2,en:'Small steps, steady growth',cn:'慢慢来，也会长大',text:'The resident tends this little garden when it needs care. Curiosity, rest, and a little routine shape each day.',textCN:'小居民会优先照顾需要打理的菜园。好奇心、休息与一点日常，让这座小岛有了生活。'},
    {id:'pond',x:-.3,z:2.7,en:'At the water’s edge',cn:'听一会儿流水',text:'Water catches the torchlight before falling into the clouds. The shoreline keeps your steps safely on the island.',textCN:'水面映着火光，瀑布落进云里。沿着岸边走走，岛屿边界会保护你的脚步。'},
    {id:'oak',x:-2.4,z:-1.8,en:'Under the old oak',cn:'树荫里的好奇心',text:'A quiet corner for thinking about perception, intelligence, and trust. Look up through the blocky canopy.',textCN:'这里适合想想感知、智能与可信。抬起头，可以看见一层层方块树冠。'}
  ];
  function labels(){
    const a=npc.activity;$('.resident-activity').textContent=(npc.phase==='walking'?tr('On the way · ','正在前往 · '):'')+(zh()?a.cn:a.en);
    $('.resident-kicker').textContent=tr('A LITTLE LIFE HERE','小岛上的日常');
    $('.enter-island').textContent=tr('Explore in first person ↗','进入第一人称探索 ↗');
    pin.setAttribute('aria-label',tr('Become the resident and explore the island','点击小人，以第一人称探索空岛'));
    $('.exit-island').textContent=tr('Exit · Esc','退出 · Esc');
    $('.explore-day').setAttribute('aria-label',tr('Toggle day and night','切换昼夜'));
    $('.explore-help').textContent=tr('WASD / arrows to move · Drag to look · E to inspect','WASD / 方向键移动 · 拖动环顾 · E 查看');
    $('.move-pad').setAttribute('aria-label',tr('Movement controls','移动控制'));
    for(const [i,b]of Array.from(overlay.querySelectorAll('[data-move]')).entries())b.setAttribute('aria-label',zh()?['前进','向左','后退','向右'][i]:['Move forward','Move left','Move backward','Move right'][i]);
    $('.close-landmark').setAttribute('aria-label',tr('Close description','关闭介绍'));
    if(active){shell.setAttribute('aria-label',tr('Explore the floating island','探索小空岛'));canvas.setAttribute('aria-label',tr('First person. WASD to move, drag to look, Escape to exit.','第一人称。WASD 移动，拖动环顾，Escape 退出。'));updateHUD();}
  }
  function updateHUD(){
    const inside=player.x>.15&&player.x<3&&player.z<-.15&&player.z>-2.7;
    $('.explore-location').textContent=inside?tr('THE CABIN','温暖的小屋'):tr('THE FLOATING ISLAND','小小空岛');
    $('.explore-progress').textContent=tr('Discoveries ','已发现 ')+seen.size+' / '+landmarks.length+' · X '+player.x.toFixed(1)+'  Z '+player.z.toFixed(1);
    let distance=Infinity;nearest=null;
    for(const p of landmarks){const d=Math.hypot(player.x-p.x,player.z-p.z);if(d<1.2&&d<distance){distance=d;nearest=p;}}
    const inspect=$('.inspect-island');inspect.disabled=!nearest;inspect.textContent=nearest?tr('E · Inspect ','E · 查看 ')+(zh()?nearest.cn:nearest.en):tr('Walk closer to discover','靠近景物，发现更多');
  }
  function inspect(){
    if(!nearest||!active)return;seen.add(nearest.id);info.hidden=false;
    $('.landmark-kicker').textContent=tr('FIELD NOTES / ','岛屿手记 / ')+String(landmarks.indexOf(nearest)+1).padStart(2,'0');
    info.querySelector('h3').textContent=zh()?nearest.cn:nearest.en;info.querySelector('p').textContent=zh()?nearest.textCN:nearest.text;updateHUD();
  }
  function clearInput(){keys.clear();held.clear();lookPointer=null;for(const b of overlay.querySelectorAll('[data-move]'))b.classList.remove('pressed');}
  function enter(){
    if(active)return;
    previousFocus=document.activeElement;oldScroll=window.scrollY;
    player.x=npc.x;player.z=npc.z;if(!safe(player.x,player.z)){player.x=1.75;player.z=2.5;}
    yaw=Math.atan2(player.x-1.6,player.z+1.3);pitch=0;
    active=true;resident.visible=false;pin.hidden=true;card.hidden=true;hud.hidden=false;info.hidden=true;
    shell.classList.add('exploring');document.body.style.setProperty('--island-scroll',(-oldScroll)+'px');document.documentElement.classList.add('island-exploring');document.body.classList.add('island-exploring');
    shell.setAttribute('role','dialog');shell.setAttribute('aria-modal','true');
    const hero=shell.parentElement,main=hero.parentElement;
    for(const n of[...hero.children,...main.children,document.querySelector('header'),document.querySelector('footer')]){
      if(n===shell||n===hero||!n||n.contains(shell))continue;inertNodes.push([n,n.inert]);n.inert=true;
    }
    canvas.setAttribute('role','application');canvas.setAttribute('aria-label',tr('First person. WASD to move, drag to look, Escape to exit.','第一人称。WASD 移动，拖动环顾，Escape 退出。'));
    clearInput();labels();api.onResize();canvas.focus({preventScroll:true});
  }
  function exit(){
    if(!active)return;active=false;clearInput();resident.visible=true;pin.hidden=false;card.hidden=false;hud.hidden=true;info.hidden=true;
    npc.x=player.x;npc.z=player.z;resident.position.set(npc.x,floor(npc.x,npc.z),npc.z);choose();
    shell.classList.remove('exploring');document.body.classList.remove('island-exploring');document.documentElement.classList.remove('island-exploring');document.body.style.removeProperty('--island-scroll');shell.removeAttribute('role');shell.removeAttribute('aria-modal');shell.removeAttribute('aria-label');canvas.setAttribute('role','img');
    canvas.setAttribute('aria-label',tr('Interactive voxel island. Drag to rotate; click the resident to explore.','交互式体素空岛。拖动旋转，点击小人进入探索。'));
    for(const[n,value]of inertNodes)n.inert=value;inertNodes.length=0;api.onResize();window.scrollTo(0,oldScroll);
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
  }
  pin.addEventListener('click',enter);$('.enter-island').addEventListener('click',enter);$('.exit-island').addEventListener('click',exit);
  $('.explore-day').addEventListener('click',()=>document.getElementById('theme').click());
  $('.inspect-island').addEventListener('click',inspect);$('.close-landmark').addEventListener('click',()=>{info.hidden=true;canvas.focus();});
  const rays=new THREE.Raycaster(),pointer=new THREE.Vector2();
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;pressX=e.clientX;pressY=e.clientY;pressId=e.pointerId;
    if(active){e.stopImmediatePropagation();e.preventDefault();lookPointer=e.pointerId;lastPX=e.clientX;lastPY=e.clientY;canvas.setPointerCapture(e.pointerId);}
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(!active)return;e.stopImmediatePropagation();if(lookPointer!==e.pointerId)return;e.preventDefault();
    yaw-=(e.clientX-lastPX)*.004;pitch=Math.max(-1.25,Math.min(1.25,pitch-(e.clientY-lastPY)*.004));lastPX=e.clientX;lastPY=e.clientY;
  },true);
  canvas.addEventListener('pointerup',e=>{
    if(active){e.stopImmediatePropagation();lookPointer=null;return;}
    if(e.pointerId!==pressId||Math.hypot(e.clientX-pressX,e.clientY-pressY)>7)return;
    const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);rays.setFromCamera(pointer,orbitCamera);scene.updateMatrixWorld(true);
    if(rays.intersectObject(resident,true).length)enter();
  },true);
  canvas.addEventListener('pointercancel',()=>{lookPointer=null;pressId=null;});
  for(const b of overlay.querySelectorAll('[data-move]')){
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(b.dataset.move);b.classList.add('pressed');});
    const stop=()=>{held.delete(b.dataset.move);b.classList.remove('pressed');};b.addEventListener('pointerup',stop);b.addEventListener('pointercancel',stop);b.addEventListener('lostpointercapture',stop);
  }
  document.addEventListener('keydown',e=>{
    if(!active)return;
    if(e.code==='Escape'){e.preventDefault();if(!info.hidden)info.hidden=true;else exit();return;}
    if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)inspect();return;}
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();keys.add(e.code);}
    if(e.key==='Tab'){const list=[canvas,...Array.from(hud.querySelectorAll('button')).filter(b=>!b.disabled&&b.getClientRects().length>0&&!b.closest('[hidden]'))];const i=list.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();list.at(-1).focus();}else if(!e.shiftKey&&(i===list.length-1||i<0)){e.preventDefault();list[0].focus();}}
  },true);
  document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
  window.addEventListener('languagechange',labels);
  const anchor=new THREE.Vector3();
  function updateNPC(dt,time){
    npc.energy=Math.max(0,npc.energy-dt*.32);npc.curiosity=Math.min(100,npc.curiosity+dt*.42);npc.care=Math.min(100,npc.care+dt*.33);planTime+=dt;
    let moving=false;
    if(npc.route.length){
      const dest=npc.route[0],dx=dest.x-npc.x,dz=dest.z-npc.z,d=Math.hypot(dx,dz),s=Math.min(d,.65*dt);
      if(d<.055)npc.route.shift();else{const oldX=npc.x,oldZ=npc.z;move(npc,dx/d*s,dz/d*s);moving=Math.hypot(npc.x-oldX,npc.z-oldZ)>.001;resident.rotation.y=Math.atan2(dx,dz);}
      if(planTime>26)choose();
      if(!npc.route.length){npc.phase='acting';resident.rotation.y=npc.activity.face;labels();}
    }else{
      npc.remaining-=dt;
      if(npc.activity.id==='rest')npc.energy=Math.min(100,npc.energy+dt*6);
      if(npc.activity.id==='read')npc.curiosity=Math.max(0,npc.curiosity-dt*7);
      if(npc.activity.id==='garden')npc.care=Math.max(0,npc.care-dt*7);
      if(npc.remaining<=0)choose();
    }
    const swing=moving?Math.sin(time*9)*.55:0;leftLeg.rotation.x=swing;rightLeg.rotation.x=-swing;leftArm.rotation.x=-swing;rightArm.rotation.x=swing;
    book.visible=!moving&&npc.activity.id==='read';if(book.visible)rightArm.rotation.x=-1.1;
    if(!moving&&npc.activity.id==='garden')rightArm.rotation.x=-.7+Math.sin(time*3)*.3;
    if(!moving&&npc.activity.id==='think')leftArm.rotation.x=-1.4;
    resident.position.set(npc.x,floor(npc.x,npc.z)+(moving?Math.abs(Math.sin(time*9))*.022:0),npc.z);
  }
  function update(dt,time){
    if(active){
      let f=Number(keys.has('KeyW')||keys.has('ArrowUp')||held.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||held.has('back'));
      let s=Number(keys.has('KeyD')||keys.has('ArrowRight')||held.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||held.has('left'));
      const length=Math.hypot(f,s)||1,speed=(keys.has('ShiftLeft')||keys.has('ShiftRight')?2.2:1.45)*dt;
      f/=length;s/=length;move(player,(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed,(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed);
      walking+=dt*(f||s?1:0);camera.position.set(player.x,floor(player.x,player.z)+1.18,player.z);camera.rotation.set(pitch,yaw,0);
      updateHUD();
    }else{
      if(!api.isPaused())updateNPC(dt,time);
      resident.updateMatrixWorld(true);anchor.set(0,1.65,0).applyMatrix4(resident.matrixWorld).project(orbitCamera);
      pin.style.left=((anchor.x+1)*shell.clientWidth/2)+'px';pin.style.top=((1-anchor.y)*shell.clientHeight/2)+'px';
      pin.style.visibility=anchor.z>-1&&anchor.z<1?'visible':'hidden';
    }
    indoorLight.intensity=api.isDay()?1.8:3.1;
  }
  function resize(w,h){camera.aspect=w/h;camera.updateProjectionMatrix();}
  choose();labels();
  return {camera,enter,exit,update,resize,labels,get active(){return active;},getState:()=>({active,position:{...player},resident:{x:npc.x,z:npc.z,activity:npc.activity.id,phase:npc.phase,energy:npc.energy,curiosity:npc.curiosity,care:npc.care},seen:[...seen],yaw,pitch}),test:{safe,pathTo,activities:activities.map(({x,z,id})=>({x,z,id})),move},resident};
};
})();