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
  cinderellaTattoo:'slipper', cinderellaCompanion:'fairy', cinderellaAccessory:'tiara', cinderellaBackdrop:'ballroom',
  facing:'user', stream:null, landmarker:null, running:false, result:null, timestamp:-1, frame:0, lastDetection:0
};
const sets = {
 tattoo:[['🦋','פרפר'],['💖','לב'],['⭐','כוכב'],['🌈','קשת'],['🌸','פרח'],['🐱','חתול'],['⚡','ברק'],['none','בלי','🚫']],
 position:[['right','לחי ימין','👉'],['left','לחי שמאל','👈'],['both','שתי לחיים','💕'],['forehead','מצח','🎯']],
 accessory:[['none','בלי','🚫'],['👑','כתר'],['😎','משקפיים'],['🐱','אוזניים'],['🎀','סרט'],['🥸','שפם']],
 smile:[['💖','לבבות'],['⭐','כוכבים'],['🌸','פרחים'],['🌈','קשתות'],['none','בלי','🚫']],
 cinderellaTattoo:[['slipper','נעל זכוכית','👠'],['dress','שמלה כחולה','👗'],['fairy','פיה','🪄'],['prince','נסיך','🤴'],['clock','שעון','🕛'],['coach','כרכרה','🎃'],['star','כוכב קסם','✨'],['none','בלי','🚫']],
 cinderellaCompanion:[['fairy','פיה טובה','🧚'],['prince','נסיך','🤴'],['mice','חברים קטנים','🐭'],['clock','שעון חצות','🕛'],['coach','כרכרה','🎠'],['none','בלי','🚫']],
 cinderellaAccessory:[['tiara','כתר זכוכית','👑'],['headband','סרט כחול','🎀'],['sparkles','ניצוצות','✨'],['bow','קשת לשיער','💙'],['none','בלי','🚫']],
 cinderellaBackdrop:[['ballroom','אולם נשף','🏰'],['stairs','מדרגות הטירה','🪜'],['carriage','כרכרה בלילה','🌙'],['garden','גן קסום','🌹'],['window','חלון וכוכבים','✨']]
};

function buildChoices(key){
 const node = $(`#${key}Choices`);
 if(!node) return;
 for(const item of sets[key]){
   const [value,name,icon=value] = item;
   const button = document.createElement('button'); button.type='button'; button.className='choice';
   button.setAttribute('aria-label',name);
   button.innerHTML=`<span class="emoji" aria-hidden="true">${icon === 'none'?'🚫':icon}</span><span class="name">${name}</span>`;
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
function glowCircle(x,y,r,fill){CTX.beginPath();CTX.arc(x,y,r,0,Math.PI*2);CTX.fillStyle=fill;CTX.fill();}
function drawGlassSlipper(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.beginPath();CTX.moveTo(-0.9,0.25);CTX.quadraticCurveTo(-0.15,-0.35,0.72,-0.22);CTX.quadraticCurveTo(0.98,-0.12,1.0,0.15);CTX.quadraticCurveTo(0.75,0.26,0.52,0.55);CTX.quadraticCurveTo(0.28,0.75,-0.18,0.72);CTX.quadraticCurveTo(-0.55,0.67,-0.92,0.44);CTX.closePath();CTX.fillStyle='rgba(179,231,255,0.55)';CTX.fill();CTX.lineWidth=0.08;CTX.strokeStyle='rgba(255,255,255,0.95)';CTX.stroke();CTX.beginPath();CTX.moveTo(-0.15,0.15);CTX.lineTo(0.4,0.08);CTX.strokeStyle='rgba(210,247,255,0.9)';CTX.stroke();CTX.restore();}
function drawDressIcon(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.fillStyle='#8bc0ff';CTX.beginPath();CTX.moveTo(0,-1);CTX.lineTo(0.35,-0.65);CTX.lineTo(0.68,0.8);CTX.quadraticCurveTo(0,1.22,-0.68,0.8);CTX.lineTo(-0.35,-0.65);CTX.closePath();CTX.fill();CTX.beginPath();CTX.arc(0,-1.17,0.18,0,Math.PI*2);CTX.fillStyle='#ffe2bf';CTX.fill();CTX.strokeStyle='rgba(255,255,255,.95)';CTX.lineWidth=0.08;CTX.stroke();CTX.beginPath();CTX.moveTo(-0.18,-0.72);CTX.lineTo(0.18,-0.72);CTX.stroke();CTX.restore();}
function drawWand(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.strokeStyle='#f8d36a';CTX.lineWidth=0.13;CTX.beginPath();CTX.moveTo(-0.65,0.75);CTX.lineTo(0.28,-0.18);CTX.stroke();for(let i=0;i<5;i++){const a=-Math.PI/2+i*(Math.PI*2/5);CTX.beginPath();CTX.moveTo(Math.cos(a)*0.12,Math.sin(a)*0.12-0.45);CTX.lineTo(Math.cos(a+Math.PI/5)*0.46,Math.sin(a+Math.PI/5)*0.46-0.45);CTX.lineTo(Math.cos(a+2*Math.PI/5)*0.12,Math.sin(a+2*Math.PI/5)*0.12-0.45);CTX.closePath();CTX.fillStyle=i%2?'#fff4a6':'#ffe284';CTX.fill();}CTX.restore();}
function drawPrinceBadge(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.fillStyle='#315ab8';CTX.fillRect(-0.28,-0.6,0.56,1.0);CTX.fillStyle='#d9ecff';CTX.fillRect(-0.08,-0.55,0.16,0.9);CTX.beginPath();CTX.arc(0,-0.9,0.24,0,Math.PI*2);CTX.fillStyle='#ffd9bf';CTX.fill();CTX.fillStyle='#f2d469';CTX.beginPath();CTX.moveTo(-0.4,-1.23);CTX.lineTo(-0.16,-1.0);CTX.lineTo(0,-1.22);CTX.lineTo(0.16,-1.0);CTX.lineTo(0.4,-1.23);CTX.lineTo(0.28,-0.88);CTX.lineTo(-0.28,-0.88);CTX.closePath();CTX.fill();CTX.restore();}
function drawClock(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.beginPath();CTX.arc(0,0,1,0,Math.PI*2);CTX.fillStyle='rgba(255,247,205,.95)';CTX.fill();CTX.lineWidth=0.1;CTX.strokeStyle='#d8b45d';CTX.stroke();for(let i=0;i<12;i++){const a=i*Math.PI/6;CTX.beginPath();CTX.moveTo(Math.cos(a)*0.72,Math.sin(a)*0.72);CTX.lineTo(Math.cos(a)*0.88,Math.sin(a)*0.88);CTX.stroke();}CTX.lineWidth=0.12;CTX.beginPath();CTX.moveTo(0,0);CTX.lineTo(0,-0.48);CTX.moveTo(0,0);CTX.lineTo(0.34,0);CTX.strokeStyle='#61517c';CTX.stroke();CTX.restore();}
function drawCoach(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.beginPath();CTX.arc(0,0,0.56,0,Math.PI*2);CTX.fillStyle='rgba(244,181,72,.94)';CTX.fill();CTX.beginPath();CTX.moveTo(-0.25,-0.1);CTX.quadraticCurveTo(0,-0.65,0.25,-0.1);CTX.lineWidth=0.09;CTX.strokeStyle='#fff5d1';CTX.stroke();glowCircle(-0.45,0.56,0.18,'#f1d284');glowCircle(0.45,0.56,0.18,'#f1d284');CTX.strokeStyle='#ad6a15';CTX.lineWidth=0.08;CTX.strokeRect(-0.26,-0.08,0.52,0.45);CTX.restore();}
function drawTiara(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.beginPath();CTX.moveTo(-1,0.42);CTX.quadraticCurveTo(-0.55,-0.22,-0.26,0.12);CTX.quadraticCurveTo(0,-0.52,0.26,0.12);CTX.quadraticCurveTo(0.55,-0.22,1,0.42);CTX.lineTo(1,0.72);CTX.lineTo(-1,0.72);CTX.closePath();CTX.fillStyle='rgba(171,226,255,0.75)';CTX.fill();CTX.strokeStyle='rgba(255,255,255,0.95)';CTX.lineWidth=0.08;CTX.stroke();glowCircle(0,-0.1,0.12,'#f9f7ff');glowCircle(-0.55,0.1,0.08,'#d6f2ff');glowCircle(0.55,0.1,0.08,'#d6f2ff');CTX.restore();}
function drawHeadband(x,y,s,angle=0){CTX.save();CTX.translate(x,y);CTX.rotate(angle);CTX.scale(s,s);CTX.beginPath();CTX.arc(0,0,1.1,Math.PI*1.05,Math.PI*1.95);CTX.lineWidth=0.2;CTX.strokeStyle='#78aaf8';CTX.stroke();CTX.restore();}
function drawSparkles(x,y,s,count=7){CTX.save();CTX.translate(x,y);for(let i=0;i<count;i++){const a=i*(Math.PI*2/count)+performance.now()/1100;const px=Math.cos(a)*s*(0.55+0.12*(i%2));const py=Math.sin(a)*s*(0.35+0.11*(i%3));CTX.save();CTX.translate(px,py);CTX.rotate(a);CTX.fillStyle=i%2?'rgba(255,245,176,.95)':'rgba(218,240,255,.95)';for(let j=0;j<4;j++){CTX.beginPath();CTX.moveTo(0,-s*0.11);CTX.lineTo(s*0.03,0);CTX.lineTo(0,s*0.11);CTX.lineTo(-s*0.03,0);CTX.closePath();CTX.fill();CTX.rotate(Math.PI/2);}CTX.restore();}CTX.restore();}
function drawBackdrop(name,w,h){
  CTX.save();
  if(name==='ballroom'){
    const g=CTX.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(106,80,182,.30)'); g.addColorStop(1,'rgba(245,225,255,.18)'); CTX.fillStyle=g; CTX.fillRect(0,0,w,h);
    CTX.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<4;i++){CTX.fillRect(w*(0.08+i*0.22),h*0.12,w*0.08,h*0.44);} 
    CTX.fillStyle='rgba(72,46,120,.22)'; CTX.fillRect(0,h*0.84,w,h*0.16);
  } else if(name==='stairs'){
    CTX.fillStyle='rgba(196,220,255,.20)'; CTX.fillRect(0,0,w,h);
    CTX.fillStyle='rgba(255,255,255,.18)'; for(let i=0;i<8;i++){CTX.fillRect(w*0.12,h*(0.88-i*0.055),w*0.76,h*0.03);} 
    CTX.strokeStyle='rgba(214,233,255,.35)'; CTX.lineWidth=4; CTX.beginPath(); CTX.moveTo(w*0.16,h*0.87); CTX.lineTo(w*0.03,h*0.28); CTX.moveTo(w*0.84,h*0.87); CTX.lineTo(w*0.97,h*0.28); CTX.stroke();
  } else if(name==='carriage'){
    const g=CTX.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(33,53,120,.42)'); g.addColorStop(1,'rgba(122,84,200,.16)'); CTX.fillStyle=g; CTX.fillRect(0,0,w,h);
    glowCircle(w*0.82,h*0.18,h*0.06,'rgba(255,248,210,.45)');
    for(let i=0;i<18;i++){glowCircle((i*139)%w,((i*77)%Math.floor(h*0.55))+12,1.6+(i%3),'rgba(255,255,255,.8)');}
    CTX.fillStyle='rgba(25,18,64,.35)'; CTX.fillRect(0,h*0.87,w,h*0.13);
    drawCoach(w*0.18,h*0.79,h*0.05,0);
  } else if(name==='garden'){
    const g=CTX.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(255,226,241,.25)'); g.addColorStop(1,'rgba(128,193,148,.18)'); CTX.fillStyle=g; CTX.fillRect(0,0,w,h);
    for(let i=0;i<9;i++){glowCircle((i*97)%w,h*0.93,h*0.07,'rgba(101,173,97,.22)'); glowCircle(((i*97)+24)%w,h*0.88,h*0.025,'rgba(255,148,180,.38)');}
  } else if(name==='window'){
    const g=CTX.createLinearGradient(0,0,0,h); g.addColorStop(0,'rgba(43,62,130,.35)'); g.addColorStop(1,'rgba(174,214,255,.12)'); CTX.fillStyle=g; CTX.fillRect(0,0,w,h);
    CTX.strokeStyle='rgba(234,247,255,.35)'; CTX.lineWidth=5; CTX.strokeRect(w*0.16,h*0.10,w*0.68,h*0.36); CTX.beginPath(); CTX.moveTo(w*0.50,h*0.10); CTX.lineTo(w*0.50,h*0.46); CTX.moveTo(w*0.16,h*0.28); CTX.lineTo(w*0.84,h*0.28); CTX.stroke();
    for(let i=0;i<15;i++){glowCircle((i*61)%Math.floor(w*0.62)+w*0.19,((i*47)%Math.floor(h*0.26))+h*0.14,1.8+(i%2),'rgba(255,255,255,.82)');}
  }
  CTX.restore();
}
function drawCinderellaTattoo(kind,x,y,s,angle){
  if(kind==='slipper') return drawGlassSlipper(x,y,s,angle);
  if(kind==='dress') return drawDressIcon(x,y,s,angle);
  if(kind==='fairy') return drawWand(x,y,s,angle);
  if(kind==='prince') return drawPrinceBadge(x,y,s,angle);
  if(kind==='clock') return drawClock(x,y,s,angle);
  if(kind==='coach') return drawCoach(x,y,s,angle);
  if(kind==='star') return drawSparkles(x,y,s,6);
}
function drawCompanion(kind,anchorX,anchorY,s,tilt){
  if(kind==='fairy'){ drawWand(anchorX,anchorY,s*0.65,tilt-0.45); emoji('🧚',anchorX+s*0.24,anchorY-s*0.18,s*0.62,0); }
  if(kind==='prince'){ drawPrinceBadge(anchorX,anchorY,s*0.42,0); }
  if(kind==='mice'){ emoji('🐭',anchorX-s*0.15,anchorY,s*0.48,0); emoji('🐭',anchorX+s*0.18,anchorY+s*0.04,s*0.38,0); }
  if(kind==='clock'){ drawClock(anchorX,anchorY,s*0.36,0); }
  if(kind==='coach'){ drawCoach(anchorX,anchorY,s*0.34,0); }
}
function drawCinderellaFace(lm,smile,index){
 const left=point(lm,234),right=point(lm,454),top=point(lm,10),chin=point(lm,152),eyeL=point(lm,33),eyeR=point(lm,263),mouth=point(lm,13);
 const faceW=distance(left,right), faceH=distance(top,chin);
 const tilt=Math.atan2(eyeR.y-eyeL.y,eyeR.x-eyeL.x);
 const cheekA=point(lm,205), cheekB=point(lm,425), forehead=point(lm,151);
 const tattooTargets=[cheekA, cheekB, forehead];
 if(state.cinderellaTattoo!=='none') tattooTargets.forEach((p,idx)=>drawCinderellaTattoo(state.cinderellaTattoo,p.x+(idx===2?0:idx===0?-faceW*0.02:faceW*0.02),p.y-(idx===2?faceH*0.01:0),Math.max(16,faceW*0.12),tilt));
 const centerX=(eyeL.x+eyeR.x)/2,centerY=(eyeL.y+eyeR.y)/2;
 if(state.cinderellaAccessory==='tiara') drawTiara(top.x,top.y-faceH*0.12,faceW*0.32,tilt);
 if(state.cinderellaAccessory==='headband') drawHeadband(top.x,top.y-faceH*0.03,faceW*0.25,tilt);
 if(state.cinderellaAccessory==='bow') emoji('💙',top.x-faceW*0.23,top.y-faceH*0.10,faceW*0.16,tilt);
 if(state.cinderellaAccessory==='sparkles') drawSparkles(top.x,top.y-faceH*0.11,faceW*0.22,7);
 drawDressIcon(centerX,chin.y+faceH*0.15,faceW*0.24,0);
 if(state.cinderellaCompanion!=='none') drawCompanion(state.cinderellaCompanion,left.x-faceW*0.24,chin.y-faceH*0.02,faceW*0.34,tilt);
 if(smile){ drawSparkles(right.x+faceW*0.16,top.y-faceH*0.02,faceW*0.17,5); }
 drawGlassSlipper(mouth.x+faceW*0.28, chin.y+faceH*0.06, faceW*0.08, tilt*0.2);
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
 if(state.activeTab==='cinderella') drawBackdrop(state.cinderellaBackdrop,w,h);
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
   state.cinderellaTattoo='none'; state.cinderellaCompanion='none'; state.cinderellaAccessory='none'; state.cinderellaBackdrop='ballroom';
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
