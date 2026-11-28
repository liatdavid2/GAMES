// Hanukkah Face Magic • No photo uploads, accounts or analytics.
const $ = s => document.querySelector(s);
const video=$('#video'),canvas=$('#stage'),ctx=canvas.getContext('2d',{alpha:false});
const DATA = {
 tattoos:[
  ['none','ללא קעקוע',null,'🚫'],
  ['tattoo_menorah_rainbow','חנוכייה קשת בענן'],['tattoo_wand_dreidel','שרביט וסביבון קסומים'],
  ['tattoo_castle_rainbow','טירת נסיכת חנוכה'],['tattoo_dove_candle','יונה ונר קשת'],
  ['tattoo_menorah','חנוכייה פרחונית'],['tattoo_star_floral','מגן דוד עם פרחים'],
  ['tattoo_dreidel_bow','סביבון וסרט'],['tattoo_donut','סופגנייה מתוקה'],
  ['tattoo_stars','כוכבים מנצנצים'],['tattoo_candle_dove','נר ויונה'],
  ['tattoo_star_trail','שובל אור'],['tattoo_dreidels','סביבונים כחולים'],
  ['tattoo_shield','מגן חנוכה'],['tattoo_lion','אריה זהוב'],
  ['tattoo_menorah_gold','חנוכייה זהובה'],['tattoo_torch','לפיד האור'],['tattoo_coins','דמי חנוכה']
 ],
 headwear:[['none','בלי כובע',null,'🚫'],['crown_princess_star','כתר נסיכת חנוכה'],['headband_fairy_hanukkah','קשת פיית חנוכה'],['hat_rainbow_magic','כובע קשת קסום'],['headband_princess_rainbow','קשת נסיכות וסביבונים'],['crown_menorah','כתר חנוכייה'],['crown_star','כתר מגן דוד'],['crown_candles','כתר נרות'],['hat_magic','כובע קסמים'],['kippah','כיפה חגיגית'],['headband_dreidel','קשת סביבונים']],
 fun:[['none','בלי שפם',null,'🚫'],['moustache_dreidel','שפם סביבונים',null,'🥸'],['moustache_gold','שפם זהב',null,'〰️'],['moustache_fire','שפם להבות',null,'🔥'],['effect_stars','כוכבים עפים',null,'✨'],['effect_dreidel','סביבונים מסתובבים',null,'🌀'],['effect_coins','גשם מטבעות',null,'🪙'],['effect_fireworks','זיקוקי חנוכה',null,'🎆']]
};
const state={tab:'tattoos',tattoo:'tattoo_menorah_rainbow',headwear:'crown_princess_star',moustache:'none',effect:'effect_stars',tattooSize:1.05,headwearSize:1.05,tattooPosition:'both',facing:'user',running:false,stream:null,model:null,faces:null,lastVideoTime:-1,lastDetect:0,painting:false,pending:false};
const allAssetNames=[...new Set([...DATA.tattoos,...DATA.headwear].map(x=>x[0]).filter(x=>x!=='none'))];
const imgs={};
for(const name of allAssetNames){const im=new Image();im.src=`assets/${name}.png`;imgs[name]=im;}
const asset=(name)=>imgs[name]?.complete&&imgs[name]?.naturalWidth?imgs[name]:null;
function tabs(){document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.tab===state.tab);b.setAttribute('aria-selected',String(b.dataset.tab===state.tab));});
 const holder=$('#choices');holder.replaceChildren();
 const entries=DATA[state.tab];
 for(const [id,label,_,fallback] of entries){const btn=document.createElement('button');btn.className='choice';btn.type='button';btn.dataset.id=id;btn.setAttribute('aria-label',label);
 const im=imgs[id];if(im){const thumb=document.createElement('img');thumb.src=im.src;thumb.alt='';btn.append(thumb);}else{const icon=document.createElement('span');icon.className='icon';icon.textContent=fallback||'✨';btn.append(icon);}
 const caption=document.createElement('span');caption.textContent=label;btn.append(caption);holder.append(btn);
 btn.addEventListener('click',()=>{if(state.tab==='tattoos')state.tattoo=id;else if(state.tab==='headwear')state.headwear=id;else if(id.startsWith('moustache')||id==='none')state.moustache=id;else state.effect=state.effect===id?'none':id;refreshSelected();});}
 refreshSelected();}
function refreshSelected(){document.querySelectorAll('.choice').forEach(b=>{const id=b.dataset.id;const sel=state.tab==='tattoos'?state.tattoo===id:state.tab==='headwear'?state.headwear===id:id.startsWith('effect')?state.effect===id:state.moustache===id;b.classList.toggle('selected',sel);b.setAttribute('aria-pressed',String(sel));});}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;tabs();}));
$('#tattooSize').addEventListener('input',e=>state.tattooSize=Number(e.target.value)/100);
$('#headwearSize').addEventListener('input',e=>state.headwearSize=Number(e.target.value)/100);
document.querySelectorAll('input[name="tattooPosition"]').forEach(radio=>radio.addEventListener('change',e=>{if(e.target.checked)state.tattooPosition=e.target.value;}));
$('#resetButton').addEventListener('click',()=>{state.tattoo='none';state.headwear='none';state.moustache='none';state.effect='none';tabs();});
tabs();
function imageAt(name,x,y,width,height=0,angle=0,keepInFrame=false){const im=asset(name);if(!im)return;const h=height||width*im.naturalHeight/im.naturalWidth;let px=x,py=y;if(keepInFrame){const pad=6;px=Math.max(width/2+pad,Math.min(video.videoWidth-width/2-pad,px));py=Math.max(h/2+pad,Math.min(video.videoHeight-h/2-pad,py));}ctx.save();ctx.translate(px,py);ctx.rotate(angle);ctx.drawImage(im,-width/2,-h/2,width,h);ctx.restore();}
function pos(l,i){return {x:l[i].x*video.videoWidth,y:l[i].y*video.videoHeight};}
function span(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
function sparkle(x,y,r,t){ctx.save();ctx.translate(x,y);ctx.rotate(t);ctx.fillStyle='#fff6bf';ctx.shadowBlur=r*1.1;ctx.shadowColor='#ffd66d';ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.14,-r*.13,r*.32,0);ctx.quadraticCurveTo(r*.13,r*.13,0,r);ctx.quadraticCurveTo(-r*.13,r*.13,-r*.32,0);ctx.quadraticCurveTo(-r*.13,-r*.13,0,-r);ctx.fill();ctx.restore();}
function moustache(x,y,w,tilt,kind){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(w, w);
 const palette=kind==='moustache_fire'?['#ff9d29','#ffda58']:kind==='moustache_dreidel'?['#3e83ff','#f2c666']:['#ffe3a2','#bb751e'];
 for(const side of [-1,1]){ctx.save();ctx.scale(side,1);const grad=ctx.createLinearGradient(0,-.2,.55,.25);grad.addColorStop(0,palette[0]);grad.addColorStop(1,palette[1]);ctx.fillStyle=grad;ctx.strokeStyle='#fff8d2';ctx.lineWidth=.018;
 ctx.beginPath();ctx.moveTo(0,-.04);ctx.bezierCurveTo(.12,-.22,.28,-.23,.43,-.13);ctx.bezierCurveTo(.54,-.11,.54,-.26,.61,-.3);ctx.bezierCurveTo(.7,-.15,.62,.10,.41,.17);ctx.bezierCurveTo(.23,.26,.12,.05,0,.07);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
 ctx.restore();if(kind==='moustache_dreidel'){imageAt('tattoo_dreidels',x-w*.44,y-w*.1,w*.34,0,tilt,true);imageAt('tattoo_dreidels',x+w*.44,y-w*.1,w*.34,0,tilt,true);}if(kind==='moustache_fire'){sparkle(x-w*.56,y-w*.3,w*.07,0);sparkle(x+w*.55,y-w*.3,w*.07,0);}}
function faceEffects(landmarks,i,now){
 const left=pos(landmarks,234),right=pos(landmarks,454),forehead=pos(landmarks,10),chin=pos(landmarks,152),leftEye=pos(landmarks,33),rightEye=pos(landmarks,263),nose=pos(landmarks,2);
 const width=span(left,right),height=span(forehead,chin),rot=Math.atan2(rightEye.y-leftEye.y,rightEye.x-leftEye.x);
 const cheeks=[pos(landmarks,205),pos(landmarks,425)];
 if(state.tattoo!=='none'){
   const targets=state.tattooPosition==='forehead'?[pos(landmarks,151)]:state.tattooPosition==='right'?[cheeks[0]]:cheeks;
   for(let j=0;j<targets.length;j++){let p=targets[j];const w=width*(state.tattooPosition==='forehead'?.42:.57)*state.tattooSize;imageAt(state.tattoo,p.x,p.y,w,0,rot+(j===1?-.06:.06),true);}
 }
 if(state.headwear!=='none'){
   // Larger headgear follows the face; sticker sits above the forehead.
   let cy=forehead.y-height*(state.headwear==='kippah'?.33:.27);
   imageAt(state.headwear,forehead.x,cy,width*(state.headwear==='hat_magic'?1.42:state.headwear==='kippah'?1.06:1.36)*state.headwearSize,0,rot,true);
 }
 if(state.moustache!=='none') moustache(nose.x,nose.y+height*.105,width*.59*s,rot,state.moustache);
 if(state.effect!=='none'){
  const t=now*.001;
  for(let j=0;j<8;j++){
   const phase=t*.75+j*1.73+i*.7,xx=forehead.x+Math.cos(phase+j)*width*(.68+(j%3)*.12),yy=forehead.y+Math.sin(phase*1.4+j)*height*.60;
   if(state.effect==='effect_stars')sparkle(xx,yy,Math.max(3,width*.035)*(1+.25*Math.sin(phase)),phase);
   if(state.effect==='effect_dreidel')imageAt('tattoo_dreidels',xx,yy,width*.27,0,phase,true);
   if(state.effect==='effect_coins')imageAt('tattoo_coins',xx,yy,width*.20,0,phase,true);
   if(state.effect==='effect_fireworks'){for(let k=0;k<7;k++){const a=k*Math.PI*2/7+phase;ctx.strokeStyle=k%2?'#ffe08b':'#8dcaff';ctx.lineWidth=Math.max(1,width*.013);ctx.beginPath();ctx.moveTo(xx+Math.cos(a)*width*.05,yy+Math.sin(a)*width*.05);ctx.lineTo(xx+Math.cos(a)*width*.22,yy+Math.sin(a)*width*.22);ctx.stroke();}}
  }
 }
}
function draw(now=0){
 if(!state.running||video.readyState<2||!video.videoWidth)return;
 const cw=canvas.width,ch=canvas.height,vw=video.videoWidth,vh=video.videoHeight;
 ctx.fillStyle='#060b1d';ctx.fillRect(0,0,cw,ch);
 // Cover entire screen while matching MediaPipe coordinate system to cropped video.
 const scale=Math.max(cw/vw,ch/vh),dx=(cw-vw*scale)/2,dy=(ch-vh*scale)/2;
 ctx.save();ctx.translate(dx,dy);ctx.scale(scale,scale);
 if(state.facing==='user'){ctx.translate(vw,0);ctx.scale(-1,1);}
 ctx.drawImage(video,0,0,vw,vh);
 if(state.faces?.faceLandmarks?.length){state.faces.faceLandmarks.forEach((lm,i)=>faceEffects(lm,i,now));}
 ctx.restore();
 // Greeting in picture and live preview. Draw after mirrored camera, so Hebrew remains readable.
 const fontSize=Math.max(23,Math.min(cw*.067,49));ctx.font=`900 ${fontSize}px system-ui, Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
 const greetingY=ch-fontSize*0.9-12;ctx.shadowBlur=14;ctx.shadowColor='#ffb54c';ctx.lineWidth=Math.max(4,fontSize*.15);ctx.strokeStyle='#42245b';ctx.strokeText('✨ חנוכה שמח! ✨',cw/2,greetingY);ctx.fillStyle='#ffe5a0';ctx.fillText('✨ חנוכה שמח! ✨',cw/2,greetingY);ctx.shadowBlur=0;
}
let frameHandle=0;
function loop(now){if(!state.running)return;
 if(video.readyState>=2&&state.model&&video.currentTime!==state.lastVideoTime&&now-state.lastDetect>90){state.lastVideoTime=video.currentTime;state.lastDetect=now;
  try{state.faces=state.model.detectForVideo(video,now);}catch(e){console.warn('Face detection frame error',e);}
  const count=state.faces?.faceLandmarks?.length||0;$('#facesPill').textContent=count?`😊 ${count} פנים`:'🔎 מחפשים פנים';
 }
 if(video.readyState>=2)draw(now);
 frameHandle=requestAnimationFrame(loop);
}
// Size Canvas to the camera region (not the full window) now that the controls are above it.
function resizeCanvas(){
 const bounds=canvas.getBoundingClientRect();
 const ratio=Math.min(window.devicePixelRatio||1,2);
 const width=Math.max(1,Math.round(bounds.width*ratio));
 const height=Math.max(1,Math.round(bounds.height*ratio));
 if(canvas.width!==width || canvas.height!==height){canvas.width=width;canvas.height=height;}
}
window.addEventListener('resize',resizeCanvas);
if('ResizeObserver' in window){new ResizeObserver(resizeCanvas).observe($('#cameraZone'));}
resizeCanvas();
// Show/hide the selector to give more space to the camera without covering it.
$('#toggleOptions').addEventListener('click',()=>{
 const area=$('#optionArea');
 area.hidden=!area.hidden;
 const expanded=!area.hidden;
 $('#toggleOptions').setAttribute('aria-expanded',String(expanded));
 $('#toggleOptions').textContent=expanded?'⬆️ צמצום':'⬇️ בחירה';
 resizeCanvas();
});
function stop(){state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;}
async function openCam(){stop();const constraints={video:{facingMode:{ideal:state.facing},width:{ideal:1280},height:{ideal:720}},audio:false};
 let stream;try{stream=await navigator.mediaDevices.getUserMedia(constraints);}catch(e){if(e.name==='OverconstrainedError')stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});else throw e;}
 video.srcObject=stream;state.stream=stream;await video.play();
 if(!video.videoWidth)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('לא התקבלה תמונה מהמצלמה')),10000);video.addEventListener('loadedmetadata',()=>{clearTimeout(timer);resolve();},{once:true});});
 state.faces=null;state.lastVideoTime=-1;
}
// Face tracking loader adapted from the user's working face-magic.zip (makeLandmarker).
// Use the same three CDN/version attempts and the same GPU -> CPU fallback.
// The files are loaded into the browser, not uploaded to a server.
const MP_SOURCES = [
  {base:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22',version:'0.10.22'},
  {base:'https://unpkg.com/@mediapipe/tasks-vision@0.10.22',version:'0.10.22'},
  {base:'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21',version:'0.10.21'}
];
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
async function setupFaceModel(){
  if (state.pending || state.model) return;
  state.pending=true;
  $('#loading').hidden=false;
  $('#errorBox').hidden=true;
  const errors=[];
  try {
    for (const source of MP_SOURCES) {
      $('#loading').textContent=`טוענים זיהוי פנים (${source.version})... ✨`;
      try {
        // Exactly the package entry point used in the working game.
        const visionModule=await import(`${source.base}/vision_bundle.mjs`);
        const {FaceLandmarker,FilesetResolver}=visionModule;
        if (!FaceLandmarker || !FilesetResolver) throw new Error('FaceLandmarker חסר בספרייה שנטענה');
        const vision=await FilesetResolver.forVisionTasks(`${source.base}/wasm`);
        for (const delegate of ['GPU','CPU']) {
          try {
            state.model=await FaceLandmarker.createFromOptions(vision,{
              baseOptions:{modelAssetPath:FACE_MODEL_URL,delegate},
              runningMode:'VIDEO',numFaces:8,outputFaceBlendshapes:true
            });
            $('#facesPill').textContent='✅ הזיהוי מוכן';
            $('#errorBox').hidden=true;
            return;
          } catch(err) {
            errors.push(`${source.version} ${delegate}: ${String(err?.message||err).slice(0,180)}`);
          }
        }
      } catch(err) {
        errors.push(`${source.version}: ${String(err?.message||err).slice(0,180)}`);
      }
    }
    throw new Error(errors.join(' / ')||'לא הצלחנו לטעון את MediaPipe');
  } catch(err) {
    console.error('MediaPipe failed',err);
    $('#errorBox').hidden=false;
    $('#errorDetails').textContent=String(err?.message||err).slice(0,850);
    $('#facesPill').textContent='⚠️ אין זיהוי';
  } finally {
    state.pending=false;
    $('#loading').hidden=true;
  }
}
function cameraError(e){if(!window.isSecureContext)return 'פתחו דרך GitHub Pages בכתובת https:// ולא כקובץ file://';if(e.name==='NotAllowedError')return 'המצלמה חסומה: אפשרו גישה למצלמה בהגדרות האתר.';return String(e.message||e);}
$('#startButton').addEventListener('click',async()=>{$('#startButton').disabled=true;
 try{if(!navigator.mediaDevices?.getUserMedia)throw Error('נדרש HTTPS ודפדפן עם תמיכה במצלמה.');await openCam();state.running=true;$('#welcome').hidden=true;$('#saveButton').disabled=false;$('#shareButton').disabled=false;$('#flipButton').disabled=false;requestAnimationFrame(loop);void setupFaceModel();}
 catch(e){alert(cameraError(e));$('#startButton').disabled=false;}});
$('#retryButton').addEventListener('click',()=>void setupFaceModel());
$('#flipButton').addEventListener('click',async()=>{state.running=false;cancelAnimationFrame(frameHandle);const old=state.facing;state.facing=old==='user'?'environment':'user';try{await openCam();}catch(e){state.facing=old;try{await openCam();}catch(e2){alert(cameraError(e2));return;}}state.running=true;requestAnimationFrame(loop);});
function photoBlob(){return new Promise((resolve,reject)=>{draw(performance.now());canvas.toBlob(blob=>blob?resolve(blob):reject(Error('לא ניתן להכין תמונה')),'image/png');});}
async function savePhoto(){if(!state.running)return;try{const blob=await photoBlob();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`hanukkah-magic-${Date.now()}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}catch(e){alert(e.message);}}
$('#saveButton').addEventListener('click',savePhoto);
$('#shareButton').addEventListener('click',async()=>{if(!state.running)return;try{const blob=await photoBlob();const file=new File([blob],`hanukkah-magic-${Date.now()}.png`,{type:'image/png'});
 if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'חנוכה שמח!'});}
 else await savePhoto();
 }catch(e){if(e.name!=='AbortError')alert('לא ניתן לשתף כרגע, השתמשו בשמירת תמונה.');}});
window.addEventListener('pagehide',()=>{state.running=false;cancelAnimationFrame(frameHandle);stop();});
