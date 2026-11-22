// Face Magic: runs entirely in the user's browser. No image upload or analytics.
const MP_VERSION = '0.10.22';
const VIDEO = document.querySelector('#video');
const CANVAS = document.querySelector('#view');
const CTX = CANVAS.getContext('2d', {alpha:false});
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const state = {
  activeTab:'magic',
  tattoo:'🦋', position:'right', accessory:'none', smile:'💖',
  cinderellaTattoo:'glitter_swirl', cinderellaCompanion:'none', cinderellaAccessory:'tiara', cinderellaDress:'dress_blue', cinderellaPosition:'both',
  facing:'user', stream:null, landmarker:null, running:false, result:null, timestamp:-1, frame:0, lastDetection:0
};
const sets = {
 tattoo:[['🦋','פרפר'],['💖','לב'],['⭐','כוכב'],['🌈','קשת'],['🌸','פרח'],['🐱','חתול'],['⚡','ברק'],['none','בלי','🚫']],
 position:[['right','לחי ימין','👉'],['left','לחי שמאל','👈'],['both','שתי לחיים','💕'],['forehead','מצח','🎯']],
 accessory:[['none','בלי','🚫'],['👑','כתר'],['😎','משקפיים'],['🐱','אוזניים'],['🎀','סרט'],['🥸','שפם']],
 smile:[['💖','לבבות'],['⭐','כוכבים'],['🌸','פרחים'],['🌈','קשתות'],['none','בלי','🚫']],
 cinderellaTattoo:[['glitter_swirl','נצנצים כחולים','✨'],['castle_tattoo','טירה קסומה','🏰'],['slipper_tattoo','נעל ונצנצים','👠'],['slipper','נעל זכוכית','💎'],['star','כוכבי קסם','⭐'],['none','בלי','🚫']],
 cinderellaCompanion:[['fairy','פיה טובה','🧚'],['prince','נסיך','🤴'],['coach','כרכרה','🎠'],['none','בלי','🚫']],
 cinderellaAccessory:[['tiara','כתר משובץ','👑'],['none','בלי כתר','🚫']],
 cinderellaDress:[['dress_blue','שמלה כחולה','👗'],['none','בלי שמלה','🚫']],
 cinderellaPosition:[['both','שתי לחיים','💕'],['right','לחי אחת','👉'],['left','לחי שנייה','👈'],['forehead','מצח','🎯']]
};

function buildChoices(key){
 const node = $(`#${key}Choices`);
 if(!node) return;
 for(const item of sets[key]){
   const [value,name,icon=value] = item;
   const button = document.createElement('button'); button.type='button'; button.className='choice';
   button.setAttribute('aria-label',name);
   const artKeys=['cinderellaTattoo','cinderellaCompanion','cinderellaAccessory','cinderellaDress'];
   const artName=artKeys.includes(key) && value!=='none' ? value : null;
   const ext = ['star','clock','bow'].includes(artName)?'svg':'png';
   button.innerHTML=`<span class="emoji" aria-hidden="true">${artName?`<img src="assets/${artName}.${ext}" alt="">`:icon === 'none'?'🚫':icon}</span><span class="name">${name}</span>`;
   button.addEventListener('click',()=>{state[key]=value; updateChoices();});
   button.dataset.value=value;node.appendChild(button);
 }
}
function updateChoices(){
 for(const key of Object.keys(sets)){
   const container = $(`#${key}Choices`);
   if(!container) continue;
   for(const b of container.children){
     const active=b.dataset.value===state[key];
     b.classList.toggle('active',active);
     b.setAttribute('aria-pressed',String(active));
   }
 }
}
Object.keys(sets).forEach(buildChoices);updateChoices();
function status(text){$('#status').textContent=text;}

$$('.tab-button').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.tab)));
function setTab(tab){
  state.activeTab = tab;
  $$('.tab-button').forEach(b=>{
    const active = b.dataset.tab===tab;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  $$('.tab-page').forEach(p=>p.classList.toggle('active', p.dataset.page===tab));
}

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
 const modelUrls = ['https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'];
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
async function loadFaceModel() { try { await makeLandmarker(); } catch(err) { showModelError(err); } }
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
   status(message); alert(message); start.disabled=false;
 }
}
async function openCamera(){
 stopTracks(); let stream;
 try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:state.facing},width:{ideal:960},height:{ideal:1280}},audio:false});}
 catch(err){if(err.name==='OverconstrainedError')stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});else throw err;}
 state.stream=stream; VIDEO.srcObject=stream; await VIDEO.play();
 if(!VIDEO.videoWidth){await new Promise((resolve,reject)=>{ const t=setTimeout(()=>reject(new Error('המצלמה לא מספקת תמונה')),8000); VIDEO.addEventListener('loadedmetadata',()=>{clearTimeout(t);resolve();},{once:true}); });}
 CANVAS.width=VIDEO.videoWidth; CANVAS.height=VIDEO.videoHeight;
 state.result=null; state.timestamp=-1;
}
function stopTracks(){state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;}
function point(lm,index){const p=lm[index];return {x:p.x*CANVAS.width,y:p.y*CANVAS.height};}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function emoji(text,x,y,size,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.textAlign='center';CTX.textBaseline='middle';CTX.font=`${Math.round(size)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;CTX.fillText(text,0,0);CTX.restore();}
// Images are stored locally in the repository, with transparent backgrounds.
const assetNames=['tiara','dress_blue','slipper','glitter_swirl','castle_tattoo','slipper_tattoo','fairy','prince','coach','star'];
const assetImages={};
for(const name of assetNames){
 const img=new Image();
 img.src=`assets/${name}.${name==='star'?'svg':'png'}`;
 assetImages[name]=img;
}
function drawArt(name,x,y,w,h,angle=0){
 const img=assetImages[name];
 if(!img||!img.complete||!img.naturalWidth)return;
 const ratio=img.naturalWidth/img.naturalHeight;
 if(!h)h=w/ratio;
 CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.drawImage(img,-w/2,-h/2,w,h);CTX.restore();
}
function drawCinderellaFace(lm,smile,index){
 const left=point(lm,234),right=point(lm,454),top=point(lm,10),chin=point(lm,152),eyeL=point(lm,33),eyeR=point(lm,263);
 const faceW=distance(left,right),faceH=distance(top,chin);
 const tilt=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
 const cheeks=[point(lm,205),point(lm,425)], forehead=point(lm,151);
 const targets=state.cinderellaPosition==='both'?cheeks:state.cinderellaPosition==='forehead'?[forehead]:[cheeks[state.cinderellaPosition==='right'?0:1]];
 if(state.cinderellaTattoo!=='none'){
   const w=faceW*(state.cinderellaPosition==='forehead'?.28:.35);
   targets.forEach((p,i)=>drawArt(state.cinderellaTattoo,p.x,p.y,w,0,tilt+(i===1?-.09:.09)));
 }
 if(state.cinderellaAccessory==='tiara'){
   // Crown sits over natural hair, no artificial hair added.
   drawArt('tiara',top.x,top.y-faceH*.19,faceW*1.12,0,tilt);
 }
 if(state.cinderellaDress==='dress_blue'){
   // Wearable bodice anchored below the chin, scaled to estimated shoulders.
   // Face mesh alone does not locate shoulders; the overlay is approximate.
   const shoulderY=chin.y+faceH*.47;
   drawArt('dress_blue',chin.x,shoulderY,faceW*2.22,0,tilt*.30);
 }
 if(state.cinderellaCompanion!=='none'){
   const name=state.cinderellaCompanion;
   const x=right.x+faceW*.45,y=(top.y+chin.y)*.50;
   drawArt(name,x,y,faceW*.75,0,0);
 }
}
function drawMagicFace(lm,smile,index){
 const left=point(lm,234),right=point(lm,454),top=point(lm,10),chin=point(lm,152),eyeL=point(lm,33),eyeR=point(lm,263);
 const faceW=distance(left,right), faceH=distance(top,chin);
 const tilt=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
 const cheekA=point(lm,205),cheekB=point(lm,425);
 const cheeks=state.position==='both'?[cheekA,cheekB]:state.position==='forehead'?[point(lm,151)]:[state.position==='right'?cheekA:cheekB];
 if(state.tattoo!=='none') cheeks.forEach(p=>emoji(state.tattoo,p.x,p.y,Math.max(21,faceW*(state.position==='forehead'?.23:.20)),tilt));
 const centerX=(eyeL.x+eyeR.x)/2,centerY=(eyeL.y+eyeR.y)/2;
 if(state.accessory==='👑')emoji('👑',top.x,top.y-faceH*.13,faceW*.7,tilt);
 if(state.accessory==='😎')emoji('🕶️',centerX,centerY,faceW*.92,tilt);
 if(state.accessory==='🐱') emoji('🐱',top.x,top.y-faceH*.17,faceW*.66,tilt);
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
function smileDetected(i){const categories=state.result?.faceBlendshapes?.[i]?.categories||[]; const score=name=>categories.find(c=>c.categoryName===name)?.score||0; return (score('mouthSmileLeft')+score('mouthSmileRight'))/2>.33;}
function paint(){
 const w=CANVAS.width,h=CANVAS.height;if(!w||!h)return;
 CTX.save();
 if(state.facing==='user'){CTX.translate(w,0);CTX.scale(-1,1);}
 CTX.drawImage(VIDEO,0,0,w,h);
 if(state.result?.faceLandmarks?.length){
   state.result.faceLandmarks.forEach((lm,i)=>{
     if(state.activeTab==='cinderella') drawCinderellaFace(lm,smileDetected(i),i);
     else drawMagicFace(lm,smileDetected(i),i);
   });
 }
 CTX.restore();
}
function loop(now){if(!state.running)return; if(VIDEO.readyState>=2){ if(state.landmarker && VIDEO.currentTime!==state.timestamp && now-state.lastDetection>65){ state.lastDetection=now; state.timestamp=VIDEO.currentTime; try{state.result=state.landmarker.detectForVideo(VIDEO,now);}catch(err){console.warn('Frame detection error:',err);} } paint(); if(state.landmarker){ if(state.result?.faceLandmarks?.length) status(''); else status('הציגי את הפנים למצלמה 😊'); } } requestAnimationFrame(loop);}
function savePhoto(){ if(!state.running||!CANVAS.width)return; paint(); const filename=`face-magic-${new Date().toISOString().replace(/[:.]/g,'-')}.png`; CANVAS.toBlob(blob=>{ if(!blob){alert('לא ניתן לשמור תמונה במכשיר הזה');return;} const url=URL.createObjectURL(blob); const a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove(); setTimeout(()=>URL.revokeObjectURL(url),30000); status('התמונה נשמרה או הועברה להורדות 📸'); },'image/png'); }
function clearCurrent(){
 if(state.activeTab==='cinderella'){
   state.cinderellaTattoo='none'; state.cinderellaCompanion='none'; state.cinderellaAccessory='none'; state.cinderellaDress='none'; state.cinderellaPosition='both';
 } else {
   state.tattoo='none'; state.accessory='none'; state.smile='none'; state.position='right';
 }
 updateChoices();
}
$('#startButton').addEventListener('click',startCamera);
$('#retryButton').addEventListener('click',loadFaceModel);
$('#saveButton').addEventListener('click',savePhoto);
$('#switchButton').addEventListener('click',async()=>{ state.running=false; state.facing=state.facing==='user'?'environment':'user'; try{await openCamera(); state.running=true; requestAnimationFrame(loop);}catch(e){console.error(e); alert('לא הצלחנו להחליף מצלמה'); state.facing=state.facing==='user'?'environment':'user'; try{await openCamera(); state.running=true; requestAnimationFrame(loop);}catch(e2){status('שגיאת מצלמה');}} });
$('#clearButton').addEventListener('click',clearCurrent);
window.addEventListener('pagehide',stopTracks);
