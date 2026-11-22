// Face Magic: runs entirely in the user's browser. No image upload or analytics.
const MP_VERSION = '0.10.22';
const VIDEO = document.querySelector('#video');
const CANVAS = document.querySelector('#view');
const CTX = CANVAS.getContext('2d', {alpha:false});
const $ = s => document.querySelector(s);
const state = { tattoo:'🦋', position:'right', accessory:'none', smile:'💖', facing:'user', stream:null, landmarker:null, running:false, result:null, timestamp:-1, frame:0, lastDetection:0, mode:'classic', mermaid:{hair:'pink',crown:'shells',scales:'pink',gem:'pearl',necklace:'pearls',bubbles:'bubbles',friend:'dolphin',tail:'pink',eyes:'sparkle'} };
const sets = {
 tattoo:[['🦋','פרפר'],['💖','לב'],['⭐','כוכב'],['🌈','קשת'],['🌸','פרח'],['🐱','חתול'],['⚡','ברק'],['none','בלי']],
 position:[['right','לחי ימין','👉'],['left','לחי שמאל','👈'],['both','שתי לחיים','💕'],['forehead','מצח','🎯']],
 accessory:[['none','בלי','🚫'],['👑','כתר'],['😎','משקפיים'],['🐱','אוזניים'],['🎀','סרט'],['🥸','שפם']],
 smile:[['💖','לבבות'],['⭐','כוכבים'],['🌸','פרחים'],['🌈','קשתות'],['none','בלי','🚫']]
};
function buildChoices(key){
 const node = $(`#${key}Choices`);
 for(const item of sets[key]){
   const [value,name,icon=value] = item;
   const button = document.createElement('button'); button.type='button'; button.className='choice';
   button.setAttribute('aria-label',name);
   button.innerHTML=`<span class="emoji" aria-hidden="true">${icon === 'none'?'🚫':icon}</span><span class="name">${name}</span>`;
   button.addEventListener('click',()=>{state[key]=value; updateChoices();});
   button.dataset.value=value;node.appendChild(button);
 }
}
function updateChoices(){for(const key of Object.keys(sets)) for(const b of $(`#${key}Choices`).children){ const active=b.dataset.value===state[key]; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); }}
Object.keys(sets).forEach(buildChoices);updateChoices();

// === Mermaid World: choices and presets ===
// Original MediaPipe and camera loading above/below remain unchanged.
const mermaidSets = {
 hair:[['none','בלי','🚫'],['pink','ורוד','🩷'],['aqua','טורקיז','🩵'],['purple','סגול','💜'],['blue','כחול','💙'],['gold','זהב','💛'],['rainbow','קשת','🌈']],
 crown:[['none','בלי','🚫'],['shells','צדפים','🐚'],['pearls','פנינים','🤍'],['coral','אלמוגים','🪸'],['star','כוכבי ים','⭐']],
 scales:[['none','בלי','🚫'],['pink','ורודים','🩷'],['aqua','טורקיז','🩵'],['purple','סגולים','💜'],['gold','זהב','💛'],['rainbow','קשת','🌈']],
 gem:[['none','בלי','🚫'],['pearl','פנינה','🤍'],['diamond','יהלום','💎'],['star','כוכב','⭐'],['shell','צדף','🐚']],
 necklace:[['none','בלי','🚫'],['pearls','פנינים','🤍'],['shells','צדפים','🐚'],['coral','אלמוגים','🪸'],['stars','כוכבים','⭐']],
 bubbles:[['none','בלי','🚫'],['bubbles','בועות','🫧'],['sparkles','נצנצים','✨'],['hearts','לבבות','💖'],['stars','כוכבים','🌟']],
 friend:[['none','בלי','🚫'],['dolphin','דולפין','🐬'],['turtle','צב ים','🐢'],['fish','דגים','🐠'],['jelly','מדוזה','🪼'],['crab','סרטן','🦀']],
 tail:[['none','בלי','🚫'],['pink','ורוד','🩷'],['aqua','טורקיז','🩵'],['purple','סגול','💜'],['gold','זהב','💛'],['rainbow','קשת','🌈']],
 eyes:[['none','בלי','🚫'],['sparkle','נצנצים','✨'],['aqua','טורקיז','🩵'],['pink','ורוד','🩷'],['purple','סגול','💜']]
};
const mermaidPalettes={
 pink:['#f482c6','#ffd1ec','#df4dad'], aqua:['#32c6c5','#b6ffff','#098fbd'],
 purple:['#a879ed','#e2caff','#704bd4'],blue:['#609cf8','#b6d5ff','#287bd3'],
 gold:['#f1bd55','#fff0a6','#cf8c1b'],rainbow:['#6bc9e5','#ff9dcf','#d193ef']
};
const mermaidPresets={
 pink:{hair:'pink',crown:'shells',scales:'pink',gem:'pearl',necklace:'pearls',bubbles:'bubbles',friend:'dolphin',tail:'pink',eyes:'sparkle'},
 ocean:{hair:'aqua',crown:'pearls',scales:'aqua',gem:'diamond',necklace:'shells',bubbles:'sparkles',friend:'turtle',tail:'aqua',eyes:'aqua'},
 purple:{hair:'purple',crown:'star',scales:'purple',gem:'diamond',necklace:'stars',bubbles:'hearts',friend:'jelly',tail:'purple',eyes:'purple'}
};
function updateMermaidChoices(){
 for(const key of Object.keys(mermaidSets)){
   for(const button of $(`#mermaid${key[0].toUpperCase()+key.slice(1)}Choices`).children){
     const active=state.mermaid[key]===button.dataset.value;
     button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));
   }
 }
 for(const button of document.querySelectorAll('[data-preset]')){
   const selected=Object.entries(mermaidPresets[button.dataset.preset]).every(([k,v])=>state.mermaid[k]===v);
   button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
 }
}
function buildMermaidChoices(){
 for(const [key,values] of Object.entries(mermaidSets)){
   const node=$(`#mermaid${key[0].toUpperCase()+key.slice(1)}Choices`);
   for(const [value,name,icon] of values){
     const button=document.createElement('button');button.type='button';button.className='choice';
     button.dataset.value=value;button.setAttribute('aria-label',name);
     const symbol=document.createElement('span');symbol.className='emoji';symbol.setAttribute('aria-hidden','true');symbol.textContent=icon;
     const label=document.createElement('span');label.className='name';label.textContent=name;
     button.append(symbol,label);
     button.addEventListener('click',()=>{state.mermaid[key]=value;updateMermaidChoices();});
     node.appendChild(button);
   }
 }
 updateMermaidChoices();
}
function setMode(mode){
 state.mode=mode;
 const classic=mode==='classic';
 $('#classicTab').hidden=!classic;$('#mermaidTab').hidden=classic;
 for(const [button,active] of [['#classicTabButton',classic],['#mermaidTabButton',!classic]]){
   $(button).classList.toggle('active',active);$(button).setAttribute('aria-selected',String(active));
 }
 // Clear stale face results only if camera flips; tab changes retain camera stream.
}
$('#classicTabButton').addEventListener('click',()=>setMode('classic'));
$('#mermaidTabButton').addEventListener('click',()=>setMode('mermaid'));
$('#mermaidPresets').addEventListener('click',(event)=>{
 const button=event.target.closest('[data-preset]');
 if(!button)return;
 Object.assign(state.mermaid,mermaidPresets[button.dataset.preset]);updateMermaidChoices();
});
$('#mermaidAllButton').addEventListener('click',()=>{
 Object.assign(state.mermaid,mermaidPresets.ocean);
 // All nine categories are now enabled. The child can customize each one afterward.
 updateMermaidChoices();
});
$('#mermaidClearButton').addEventListener('click',()=>{
 for(const key of Object.keys(mermaidSets))state.mermaid[key]='none';
 updateMermaidChoices();
});
buildMermaidChoices();

function status(text){$('#status').textContent=text;}
// Version 3: load a real MediaPipe bundle, with CDN fallback and readable diagnostics.
let loadingModel = false;
function showModelError(err) {
 const message = String(err?.message || err || 'שגיאה לא ידועה');
 console.error('Face model loading error:', err);
 $('#modelDetails').textContent = `פרטי התקלה: ${message.slice(0, 350)}`;
 $('#modelPanel').hidden = false;
 $('#retryButton').disabled = false;
 status('📷 המצלמה עובדת. זיהוי הפנים לא נטען. לחצי על ״נסי שוב״ לפרטים.');
}
async function makeLandmarker() {
 if(state.landmarker || loadingModel) return;
 loadingModel = true;
 $('#retryButton').disabled = true;
 $('#modelPanel').hidden = true;
 const sources = [
   {base:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22', version:'0.10.22'},
   {base:'https://unpkg.com/@mediapipe/tasks-vision@0.10.22', version:'0.10.22'},
   {base:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21', version:'0.10.21'}
 ];
 const modelUrls = [
   'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
 ];
 const errors = [];
 try {
   for(const source of sources) {
     status(`✨ טוענת זיהוי פנים (${source.version})...`);
     try {
       const visionModule = await import(`${source.base}/vision_bundle.mjs`);
       const {FaceLandmarker, FilesetResolver} = visionModule;
       if (!FaceLandmarker || !FilesetResolver) throw new Error('הספרייה נטענה ללא FaceLandmarker');
       const vision = await FilesetResolver.forVisionTasks(`${source.base}/wasm`);
       for (const modelUrl of modelUrls) {
         for (const delegate of ['GPU', 'CPU']) {
           try {
             state.landmarker = await FaceLandmarker.createFromOptions(vision, {
               baseOptions: {modelAssetPath: modelUrl, delegate},
               runningMode: 'VIDEO', numFaces: 2, outputFaceBlendshapes: true
             });
             $('#modelPanel').hidden = true;
             status('✅ זיהוי הפנים מוכן! בחרי קעקוע 🦋');
             return;
           } catch(err) { errors.push(`${source.version} ${delegate}: ${String(err.message || err).slice(0,120)}`); }
         }
       }
     } catch(err) { errors.push(`${source.version}: ${String(err.message || err).slice(0,150)}`); }
   }
   throw new Error(errors.join(' | ') || 'לא ניתן לטעון את קובצי MediaPipe');
 } finally {loadingModel = false;}
}
async function loadFaceModel() {
 try { await makeLandmarker(); }
 catch(err) {showModelError(err);}
}
function cameraErrorMessage(err){
 if(!window.isSecureContext) return 'יש לפתוח את האתר בכתובת HTTPS של GitHub Pages (לא כקובץ מקומי).';
 if(err?.name==='NotAllowedError'||err?.name==='PermissionDeniedError') return 'הגישה למצלמה נחסמה. לחצי על סמל המנעול ליד כתובת האתר, אפשרי מצלמה ורענני את הדף.';
 if(err?.name==='NotFoundError'||err?.name==='DevicesNotFoundError') return 'לא נמצאה מצלמה זמינה במכשיר.';
 if(err?.name==='NotReadableError'||err?.name==='TrackStartError') return 'המצלמה בשימוש של אפליקציה אחרת. סגרי אותה ונסי שוב.';
 if(err?.name==='OverconstrainedError') return 'לא ניתן להשתמש במצלמה עם ההגדרות הנוכחיות.';
 return 'לא הצלחנו לפתוח את המצלמה: '+(err?.message||'שגיאה לא ידועה');
}
async function startCamera(){
 const start=$('#startButton');start.disabled=true;
 try{
   if(!navigator.mediaDevices?.getUserMedia) throw new Error('נדרשת כתובת HTTPS או localhost ודפדפן שתומך במצלמה.');
   status('פותחת מצלמה... 📷');
   await openCamera();
   $('#empty').hidden=true;$('#empty').style.display='none';
   $('#saveButton').disabled=false;$('#switchButton').disabled=false;
   state.running=true;requestAnimationFrame(loop);
   status('המצלמה פועלת! טוענת זיהוי פנים... ✨');
   await loadFaceModel();
 }catch(err){
    console.error('Camera start failed',err);
    const message=cameraErrorMessage(err);
    status(message);
    alert(message);
    start.disabled=false;
 }
}
async function openCamera(){
 stopTracks();
 let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.facing},width:{ideal:960},height:{ideal:1280}},audio:false});}
 catch(err){if(err.name==='OverconstrainedError')stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});else throw err;}
 state.stream=stream;VIDEO.srcObject=stream;
 await VIDEO.play();
 if(!VIDEO.videoWidth){await new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error('המצלמה לא מספקת תמונה')),8000); VIDEO.addEventListener('loadedmetadata',()=>{clearTimeout(t);resolve();},{once:true}); });}
 CANVAS.width=VIDEO.videoWidth;CANVAS.height=VIDEO.videoHeight;
 state.result=null;state.timestamp=-1;
}
function stopTracks(){state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;}
function point(lm,index){const p=lm[index];return {x:p.x*CANVAS.width,y:p.y*CANVAS.height};}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function emoji(text,x,y,size,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.textAlign='center';CTX.textBaseline='middle';CTX.font=`${Math.round(size)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;CTX.fillText(text,0,0);CTX.restore();}
function drawFace(lm,smile,index){
 const left=point(lm,234),right=point(lm,454),top=point(lm,10),chin=point(lm,152),eyeL=point(lm,33),eyeR=point(lm,263);
 const faceW=distance(left,right), faceH=distance(top,chin);
 const tilt=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
 const cheekA=point(lm,205),cheekB=point(lm,425);
 const cheeks=state.position==='both'?[cheekA,cheekB]:state.position==='forehead'?[point(lm,151)]:[state.position==='right'?cheekA:cheekB];
 if(state.tattoo!=='none')cheeks.forEach(p=>emoji(state.tattoo,p.x,p.y,Math.max(21,faceW*(state.position==='forehead'?.23:.20)),tilt));
 const centerX=(eyeL.x+eyeR.x)/2,centerY=(eyeL.y+eyeR.y)/2;
 if(state.accessory==='👑')emoji('👑',top.x,top.y-faceH*.13,faceW*.7,tilt);
 if(state.accessory==='😎')emoji('🕶️',centerX,centerY,faceW*.92,tilt);
 if(state.accessory==='🐱'){
  emoji('🐱',top.x,top.y-faceH*.17,faceW*.66,tilt);
 }
 if(state.accessory==='🎀')emoji('🎀',top.x-faceW*.24,top.y-faceH*.09,faceW*.38,tilt);
 if(state.accessory==='🥸')emoji('〰️',point(lm,13).x,point(lm,13).y-faceH*.075,faceW*.46,tilt);
 if(smile && state.smile!=='none'){
   for(let i=0;i<5;i++){
      const time=performance.now()/720+i*1.5+index;
      const x=top.x+Math.cos(time*1.5+i*2)*faceW*(.42+i*.08);
      const y=top.y-faceH*.13-Math.sin(time+i)*faceH*.13;
      emoji(state.smile,x,y,faceW*.15+Math.sin(time)*4,tilt);
   }
 }
}

// === Mermaid canvas effects, anchored to the same face landmarks as the original effects ===
function mermaidGradient(x0,y0,x1,y1,colors){
 const gradient=CTX.createLinearGradient(x0,y0,x1,y1);
 gradient.addColorStop(0,colors[0]);gradient.addColorStop(.53,colors[1]);gradient.addColorStop(1,colors[2]);
 return gradient;
}
function mermaidHair(top,faceW,faceH,tilt,kind){
 if(kind==='none')return;
 const palette=mermaidPalettes[kind]||mermaidPalettes.pink;
 CTX.save();CTX.translate(top.x,top.y);CTX.rotate(tilt);
 const w=faceW,h=faceH;
 const rainbow=kind==='rainbow';
 const hairFill=rainbow?mermaidGradient(-w*.6,0,w*.6,h*.5,['#6be5dc','#d19afa','#ff84ae']):mermaidGradient(-w*.5,0,w*.5,h, palette);
 CTX.globalAlpha=.84;
 // Soft wavy side locks. We draw around the face, leaving the eyes and mouth clear.
 for(const direction of [-1,1]){
   CTX.beginPath();CTX.moveTo(direction*w*.46,-h*.06);
   CTX.bezierCurveTo(direction*w*.68,h*.08,direction*w*.40,h*.42,direction*w*.62,h*.68);
   CTX.bezierCurveTo(direction*w*.75,h*.88,direction*w*.57,h*.95,direction*w*.54,h*.98);
   CTX.lineWidth=w*.18;CTX.lineCap='round';CTX.strokeStyle=hairFill;CTX.stroke();
   CTX.beginPath();CTX.moveTo(direction*w*.45,0);
   CTX.bezierCurveTo(direction*w*.58,h*.26,direction*w*.40,h*.58,direction*w*.60,h*.78);
   CTX.strokeStyle=palette[1];CTX.globalAlpha=.56;CTX.lineWidth=w*.038;CTX.stroke();CTX.globalAlpha=.84;
 }
 // Hair cap at the top, above the forehead.
 CTX.beginPath();CTX.moveTo(-w*.55,h*.085);
 CTX.bezierCurveTo(-w*.67,-h*.39,-w*.28,-h*.48,0,-h*.45);
 CTX.bezierCurveTo(w*.36,-h*.50,w*.65,-h*.32,w*.57,h*.09);
 CTX.bezierCurveTo(w*.34,-h*.18,w*.14,-h*.24,0,-h*.14);
 CTX.bezierCurveTo(-w*.17,-h*.05,-w*.38,-h*.05,-w*.55,h*.085);
 CTX.closePath();CTX.fillStyle=hairFill;CTX.fill();
 CTX.globalAlpha=.5;CTX.beginPath();CTX.moveTo(-w*.25,-h*.30);
 CTX.quadraticCurveTo(0,-h*.40,w*.29,-h*.29);CTX.lineWidth=w*.027;CTX.strokeStyle=palette[1];CTX.stroke();
 CTX.restore();
}
function mermaidScales(cheek,faceW,tilt,kind){
 if(kind==='none')return;
 const palette=mermaidPalettes[kind]||mermaidPalettes.aqua;
 const r=faceW*.067;
 CTX.save();CTX.translate(cheek.x,cheek.y);CTX.rotate(tilt);
 for(let row=0;row<3;row++)for(let col=0;col<4;col++){
   const x=(col-1.5)*r*.89+(row%2)*r*.4, y=(row-1)*r*.82;
   CTX.beginPath();CTX.arc(x,y,r*.5,0,Math.PI);
   CTX.lineWidth=Math.max(1.5,faceW*.013);CTX.strokeStyle=palette[(row+col)%3];CTX.globalAlpha=.82;CTX.stroke();
   CTX.beginPath();CTX.arc(x,y-r*.1,r*.11,0,Math.PI*2);CTX.fillStyle='#ffffff';CTX.globalAlpha=.65;CTX.fill();
 }
 CTX.restore();
}
function mermaidNecklace(chin,faceW,faceH,tilt,kind){
 if(kind==='none')return;
 const small=faceW*.07;
 CTX.save();CTX.translate(chin.x,chin.y);CTX.rotate(tilt);
 CTX.strokeStyle='#d2a8bb';CTX.lineWidth=Math.max(2,faceW*.008);
 CTX.beginPath();CTX.moveTo(-faceW*.43,faceH*.04);
 CTX.quadraticCurveTo(0,faceH*.44,faceW*.43,faceH*.04);CTX.stroke();
 for(let i=0;i<=10;i++){
   const t=i/10,x=(t-.5)*faceW*.84,y=faceH*(.04+.20*(1-Math.pow(2*t-1,2)));
   if(kind==='shells'&&i%3===1)emoji('🐚',x,y,small*1.65);
   else if(kind==='coral'&&i%3===1)emoji('🪸',x,y,small*1.5);
   else if(kind==='stars'&&i%3===1)emoji('⭐',x,y,small*1.7);
   else{CTX.beginPath();CTX.arc(x,y,small*.35,0,Math.PI*2);CTX.fillStyle=i%2===0?'#fff6f0':'#ffcef0';CTX.fill();CTX.strokeStyle='#e6adc7';CTX.lineWidth=1.1;CTX.stroke();}
 }
 CTX.restore();
}
function mermaidTail(chin,faceW,faceH,tilt,kind){
 if(kind==='none')return;
 const palette=mermaidPalettes[kind]||mermaidPalettes.aqua;
 CTX.save();CTX.translate(chin.x+faceW*.52,chin.y+faceH*.30);CTX.rotate(tilt-.2);
 const w=faceW*.35,h=faceH*.42;
 CTX.globalAlpha=.84;
 // Two iridescent fins attached to a tiny curved sea-tail; decorative, not body tracking.
 CTX.beginPath();CTX.moveTo(0,-h*.32);CTX.quadraticCurveTo(-w*.25,h*.10,0,h*.52);
 CTX.lineWidth=w*.25;CTX.strokeStyle=palette[0];CTX.lineCap='round';CTX.stroke();
 for(const side of [-1,1]){
   CTX.beginPath();CTX.moveTo(0,h*.36);
   CTX.bezierCurveTo(side*w*.22,h*.14,side*w*.92,h*.36,side*w*.9,h*.83);
   CTX.quadraticCurveTo(side*w*.40,h*.98,0,h*.36);
   CTX.closePath();CTX.fillStyle=mermaidGradient(0,h*.2,side*w,h*.9,[palette[0],palette[1],palette[2]]);CTX.fill();
   CTX.strokeStyle=palette[2];CTX.lineWidth=w*.024;CTX.stroke();
 }
 CTX.restore();
}
function mermaidBubbles(top,faceW,faceH,index,kind){
 if(kind==='none')return;
 const now=performance.now()/1400;
 for(let i=0;i<9;i++){
   const angle=i*2.40+index*.4;
   const x=top.x+Math.sin(angle)*faceW*(.75+(i%3)*.16);
   const y=top.y+Math.cos(angle)*faceH*.72-((now*.22+i*.14)%1)*faceH*.32;
   const size=faceW*(.08+(i%3)*.025);
   if(kind==='bubbles'){
     CTX.save();CTX.beginPath();CTX.arc(x,y,size*.40,0,Math.PI*2);
     CTX.fillStyle='rgba(171,244,253,0.16)';CTX.fill();CTX.strokeStyle='rgba(218,255,255,.85)';
     CTX.lineWidth=Math.max(1.5,faceW*.009);CTX.stroke();CTX.beginPath();CTX.arc(x-size*.1,y-size*.1,size*.10,0,Math.PI*2);CTX.fillStyle='#fff';CTX.fill();CTX.restore();
   } else {
     emoji(kind==='sparkles'?'✨':kind==='stars'?'🌟':'💖',x,y,size);
   }
 }
}
function mermaidEyes(lm,faceW,kind){
 if(kind==='none')return;
 const color=kind==='aqua'?'#34e0eb':kind==='pink'?'#f59adb':kind==='purple'?'#b18bf5':'#e8faff';
 for(const idx of [159,386]){
   const eye=point(lm,idx);
   CTX.save();CTX.beginPath();CTX.arc(eye.x,eye.y-faceW*.055,faceW*.058,Math.PI*1.13,Math.PI*1.91);
   CTX.strokeStyle=color;CTX.lineWidth=Math.max(2,faceW*.03);CTX.globalAlpha=.72;CTX.stroke();CTX.restore();
   if(kind==='sparkle')emoji('✨',eye.x+faceW*.08,eye.y-faceW*.13,faceW*.10);
 }
}
function drawMermaidFace(lm,index){
 const top=point(lm,10),chin=point(lm,152),left=point(lm,234),right=point(lm,454);
 const eyeL=point(lm,33),eyeR=point(lm,263);
 const faceW=distance(left,right),faceH=distance(top,chin);
 if(faceW<10||faceH<10)return;
 const tilt=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
 const selection=state.mermaid;
 mermaidHair(top,faceW,faceH,tilt,selection.hair);
 mermaidScales(point(lm,205),faceW,tilt,selection.scales);
 mermaidScales(point(lm,425),faceW,tilt,selection.scales);
 mermaidEyes(lm,faceW,selection.eyes);
 if(selection.crown!=='none'){
   const icons={shells:'🐚',pearls:'👑',coral:'🪸',star:'⭐'};
   emoji(icons[selection.crown],top.x,top.y-faceH*.31,faceW*.44,tilt);
   if(selection.crown==='shells'){
     emoji('⭐',top.x-faceW*.27,top.y-faceH*.24,faceW*.19,tilt);
     emoji('⭐',top.x+faceW*.27,top.y-faceH*.24,faceW*.19,tilt);
   }
 }
 if(selection.gem!=='none'){
   const icons={pearl:'⚪',diamond:'💎',star:'⭐',shell:'🐚'};
   emoji(icons[selection.gem],point(lm,151).x,point(lm,151).y+faceH*.09,faceW*.17,tilt);
 }
 mermaidNecklace(chin,faceW,faceH,tilt,selection.necklace);
 mermaidTail(chin,faceW,faceH,tilt,selection.tail);
 mermaidBubbles(top,faceW,faceH,index,selection.bubbles);
 if(selection.friend!=='none'){
   const icons={dolphin:'🐬',turtle:'🐢',fish:'🐠',jelly:'🪼',crab:'🦀'};
   emoji(icons[selection.friend],top.x+faceW*.78,top.y+faceH*.28,faceW*.38,tilt);
 }
}

function smileDetected(i){const categories=state.result?.faceBlendshapes?.[i]?.categories||[];
 const score=name=>categories.find(c=>c.categoryName===name)?.score||0;
 return (score('mouthSmileLeft')+score('mouthSmileRight'))/2>.33;
}
function paint(){
 const w=CANVAS.width,h=CANVAS.height;if(!w||!h)return;
 CTX.save();
 // Mirror the selfie view and the saved file consistently.
 if(state.facing==='user'){CTX.translate(w,0);CTX.scale(-1,1);}
 CTX.drawImage(VIDEO,0,0,w,h);
 if(state.result?.faceLandmarks?.length){state.result.faceLandmarks.forEach((lm,i)=>{if(state.mode==='mermaid')drawMermaidFace(lm,i);else drawFace(lm,smileDetected(i),i);});}
 CTX.restore();
}
function loop(now){if(!state.running)return;
 if(VIDEO.readyState>=2){
  if(state.landmarker && VIDEO.currentTime!==state.timestamp && now-state.lastDetection>65){
   state.lastDetection=now;state.timestamp=VIDEO.currentTime;
   try{state.result=state.landmarker.detectForVideo(VIDEO,now);}catch(err){console.warn('Frame detection error:',err);}
  }
  paint();
  if(state.landmarker){
    if(state.result?.faceLandmarks?.length)status('');
    else status('הציגי את הפנים למצלמה 😊');
  }
 }
 requestAnimationFrame(loop);
}
function savePhoto(){
 if(!state.running||!CANVAS.width)return;
 paint();const filename=`face-magic-${new Date().toISOString().replace(/[:.]/g,'-')}.png`;
 CANVAS.toBlob(blob=>{
   if(!blob){alert('לא ניתן לשמור תמונה במכשיר הזה');return;}
   const url=URL.createObjectURL(blob);
   const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
   status('התמונה נשמרה או הועברה להורדות 📸');
 },'image/png');
}
$('#startButton').addEventListener('click',startCamera);
$('#retryButton').addEventListener('click',loadFaceModel);
$('#saveButton').addEventListener('click',savePhoto);
$('#switchButton').addEventListener('click',async()=>{
 state.running=false;state.facing=state.facing==='user'?'environment':'user';
 try{await openCamera();state.running=true;requestAnimationFrame(loop);}catch(e){console.error(e);alert('לא הצלחנו להחליף מצלמה');state.facing=state.facing==='user'?'environment':'user';try{await openCamera();state.running=true;requestAnimationFrame(loop);}catch(e2){status('שגיאת מצלמה');}}
});
$('#clearButton').addEventListener('click',()=>{if(state.mode==='mermaid'){for(const key of Object.keys(mermaidSets))state.mermaid[key]='none';updateMermaidChoices();}else{state.tattoo='none';state.accessory='none';state.smile='none';updateChoices();}});
window.addEventListener('pagehide',stopTracks);
