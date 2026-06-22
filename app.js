// LIA V5.4.4 — inline SVG logo, no broken img
"use strict";

const $ = (id) => document.getElementById(id);

const loginScreen = $("loginScreen");
const appShell = $("appShell");
const loginForm = $("loginForm");
const loginError = $("loginError");
const form = $("chatForm");
const input = $("messageInput");
const messages = $("messages");
const mainOrb = $("mainOrb");
const voiceOrb = $("voiceOrb");
const voiceStatus = $("voiceStatus");
const healthBadge = $("healthBadge");
const panelTitle = $("panelTitle");

let googleConfig = null;
let googleTokenClient = null;
let googleInitStarted = false;
let deferredInstallPrompt = null;
let recognition = null;
let lastReply = "";
let restoredChatOnce = false;

const state = {
  chat: JSON.parse(localStorage.getItem("lia_v4_chat") || "[]"),
  tasks: JSON.parse(localStorage.getItem("lia_v4_tasks") || "[]"),
  finance: JSON.parse(localStorage.getItem("lia_v4_finance") || "[]"),
  memory: JSON.parse(localStorage.getItem("lia_v4_memory") || "[]"),
  settings: JSON.parse(localStorage.getItem("lia_v4_settings") || '{"tone":"yemeni-formal","voice":"","voiceLang":"ar-YE","autoSpeak":false}')
};

const titles = {
  chat: "كيف أساعدك اليوم؟",
  voice: "محادثة صوتية",
  tasks: "المهام",
  finance: "الديون والمصاريف",
  memory: "ذاكرة ليا",
  settings: "إعدادات ليا"
};

const LIA_SVG = `
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="lia.ai" role="img">
  <defs>
    <linearGradient id="lg" x1="92" y1="108" x2="420" y2="398" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3CE8FF"/><stop offset=".52" stop-color="#7C4DFF"/><stop offset="1" stop-color="#EC5CFF"/>
    </linearGradient>
    <radialGradient id="bg" cx="50%" cy="42%" r="72%">
      <stop offset="0" stop-color="#18304D"/><stop offset=".55" stop-color="#0A102B"/><stop offset="1" stop-color="#050414"/>
    </radialGradient>
    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="9" result="b"/><feBlend in="SourceGraphic" in2="b" mode="screen"/></filter>
  </defs>
  <rect width="512" height="512" rx="122" fill="url(#bg)"/>
  <circle cx="256" cy="255" r="160" fill="none" stroke="#3CE8FF" stroke-opacity=".18" stroke-width="2"/>
  <circle cx="256" cy="255" r="118" fill="none" stroke="#EC5CFF" stroke-opacity=".22" stroke-width="2" stroke-dasharray="8 10"/>
  <g filter="url(#glow)">
    <path d="M154 155C174 151 190 166 190 187V287C190 318 214 342 245 342H347C370 342 387 360 387 382C387 404 370 421 347 421H243C167 421 108 362 108 286V190C108 171 124 158 154 155Z" fill="url(#lg)"/>
    <path d="M200 342C245 313 265 275 285 238C316 178 371 181 407 227C359 207 330 230 303 282C274 338 236 363 200 342Z" fill="#fff" fill-opacity=".92"/>
    <circle cx="395" cy="132" r="23" fill="#9B5CFF"/>
  </g>
</svg>`;

function save(){
  localStorage.setItem("lia_v4_chat", JSON.stringify(state.chat.slice(-50)));
  localStorage.setItem("lia_v4_tasks", JSON.stringify(state.tasks));
  localStorage.setItem("lia_v4_finance", JSON.stringify(state.finance));
  localStorage.setItem("lia_v4_memory", JSON.stringify(state.memory));
  localStorage.setItem("lia_v4_settings", JSON.stringify(state.settings));
}
function esc(v){return String(v || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")}

function logoBox(className="lia-inline-logo"){
  return `<span class="${className}">${LIA_SVG}</span>`;
}

function injectStyles(){
  if($("liaV544Styles")) return;
  const style = document.createElement("style");
  style.id = "liaV544Styles";
  style.textContent = `
    .login-logo,.logo-word,.lia-logo-halo img,.rail-brand img,.lia-orb img,.symbol-logo img,.avatar img{display:none!important}
    .lia-inline-logo{display:grid;place-items:center;width:92px;height:92px;position:relative;z-index:2;filter:drop-shadow(0 0 22px rgba(60,232,255,.44))}
    .lia-inline-logo svg{width:100%;height:100%;display:block}
    .rail-brand .lia-inline-logo{width:58px;height:58px}.lia-orb .lia-inline-logo{width:74%;height:74%;z-index:3}.symbol-logo .lia-inline-logo{width:132px;height:132px}.avatar .lia-inline-logo{width:100%;height:100%}
    .login-screen{display:grid!important;place-items:center!important;min-height:100dvh!important;padding:22px!important;overflow:hidden!important}
    .login-screen.hide{display:none!important}
    .login-screen .login-card{position:relative!important;width:min(100%,390px)!important;padding:24px 20px 20px!important;border-radius:36px!important;text-align:center!important;overflow:hidden!important;box-shadow:0 26px 90px rgba(0,0,0,.45)!important}
    .login-screen .login-card:before{content:"";position:absolute;width:230px;height:230px;right:-90px;top:-90px;border-radius:50%;background:rgba(60,232,255,.13);filter:blur(34px);pointer-events:none}
    .login-screen .login-card:after{content:"";position:absolute;width:250px;height:250px;left:-105px;bottom:-100px;border-radius:50%;background:rgba(236,92,255,.14);filter:blur(36px);pointer-events:none}
    .lia-login-inner{position:relative;z-index:2}.lia-login-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.lia-pill,.lia-login-state{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.055);border-radius:999px;padding:7px 10px;font-size:11px;color:rgba(251,248,255,.68);white-space:nowrap}.lia-login-state.ok{color:#42f0a2;border-color:rgba(66,240,162,.25);background:rgba(66,240,162,.075)}.lia-login-state.warn{color:#ffd28a;border-color:rgba(255,210,138,.25);background:rgba(255,210,138,.075)}.lia-login-state.err{color:#ff5f80;border-color:rgba(255,95,128,.24);background:rgba(255,95,128,.075)}
    .lia-logo-halo{width:132px;height:132px;margin:4px auto 12px;border-radius:42px;display:grid;place-items:center;position:relative;background:linear-gradient(145deg,rgba(60,232,255,.12),rgba(124,77,255,.12),rgba(236,92,255,.10));border:1px solid rgba(255,255,255,.13);box-shadow:0 0 42px rgba(60,232,255,.12),inset 0 0 36px rgba(255,255,255,.04)}.lia-logo-halo:before{content:"";position:absolute;inset:12px;border-radius:34px;border:1px solid rgba(60,232,255,.25)}.lia-brand-word{direction:ltr;font-weight:800;font-size:34px;letter-spacing:-.5px;margin-bottom:6px}.lia-brand-word span,.lia-grad{background:linear-gradient(90deg,#3ce8ff,#fff,#ec5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
    .login-screen h1{margin:8px 0 0!important;font-size:29px!important;line-height:1.35!important}.login-screen p{margin:9px auto 0!important;max-width:315px!important;line-height:1.9!important;color:rgba(251,248,255,.66)!important}.login-form{position:relative;z-index:2;margin-top:18px!important;display:grid!important;gap:10px!important}.login-form input{display:none!important}.google-login-btn{width:100%!important;min-height:60px!important;border-radius:22px!important;border:1px solid rgba(255,255,255,.16)!important;background:linear-gradient(135deg,rgba(255,255,255,.13),rgba(255,255,255,.055))!important;color:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important;font-weight:800!important;font-size:15px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)!important;transition:.18s ease!important;cursor:pointer!important}.google-login-btn.ready{border-color:rgba(60,232,255,.42)!important;box-shadow:0 0 28px rgba(60,232,255,.13),inset 0 1px 0 rgba(255,255,255,.14)!important}.google-login-btn:disabled{cursor:not-allowed!important;opacity:.62!important}.google-login-btn:active{transform:scale(.985)}.g-mark{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#fff;color:#111;font-weight:900;font-family:Arial,sans-serif}#loginError{min-height:20px;color:#ff5f80!important;line-height:1.7!important;font-size:12px!important;display:block!important}.lia-login-foot{position:relative;z-index:2;margin-top:12px;color:rgba(251,248,255,.56);font-size:11px;line-height:1.8}
    body.lia-auth-app #loginScreen{display:none!important}body:not(.lia-auth-app) #appShell{display:none!important}
  `;
  document.head.appendChild(style);
}

function replaceLogos(root=document){
  root.querySelectorAll(".rail-brand,.lia-orb,.symbol-logo").forEach(el=>{
    if(!el.querySelector(".lia-inline-logo")) el.insertAdjacentHTML("afterbegin", logoBox());
  });
  root.querySelectorAll("img").forEach(img=>{
    const src = img.getAttribute("src") || "";
    const alt = (img.getAttribute("alt") || "").toLowerCase();
    if(src.includes("lia") || alt.includes("lia") || alt === "l") img.style.display = "none";
  });
}

function setLoginStatus(text,type=""){const el=$("liaLoginStatus");if(!el)return;el.textContent=text;el.className="lia-login-state"+(type?` ${type}`:"")}
function setGoogleButton(text,{disabled=false,ready=false}={}){const btn=$("googleLoginBtn"),label=$("googleBtnText");if(label)label.textContent=text;if(btn){btn.disabled=!!disabled;btn.classList.toggle("ready",!!ready)}}

function prepareLoginUi(){
  if(!loginScreen || !loginForm) return;
  injectStyles();
  const card = loginScreen.querySelector(".login-card") || loginForm.parentElement;
  if(card && !card.querySelector(".lia-login-inner")){
    const oldTitle = card.querySelector("h1");
    const oldParagraph = card.querySelector("p");
    const inner = document.createElement("div");
    inner.className = "lia-login-inner";
    inner.innerHTML = `<div class="lia-login-top"><span class="lia-pill">خاص بهشام</span><span class="lia-login-state" id="liaLoginStatus">فحص الدخول...</span></div><div class="lia-logo-halo">${logoBox()}</div><div class="lia-brand-word">lia<span>.ai</span></div>`;
    card.insertBefore(inner, card.firstChild);
    if(oldTitle) oldTitle.innerHTML = `دخول آمن إلى <span class="lia-grad">ليا</span>`;
    if(oldParagraph) oldParagraph.textContent = "مساعدتك الشخصية للمهام، المذكرات، الديون، والصوت. الدخول محصور بحساب Google المصرح له فقط.";
  }
  loginForm.setAttribute("novalidate","novalidate");
  const userInput=$("loginUser"), passInput=$("loginPass");
  if(userInput) userInput.required=false;
  if(passInput) passInput.required=false;
  const button=$("googleLoginBtn") || loginForm.querySelector("button");
  if(button){button.id="googleLoginBtn";button.type="button";button.className=`${button.className||""} google-login-btn`.trim();button.innerHTML=`<span class="g-mark">G</span><span id="googleBtnText">تجهيز Google...</span>`;button.onclick=requestGoogleLogin}
  if(!$("liaLoginFoot")){const foot=document.createElement("div");foot.id="liaLoginFoot";foot.className="lia-login-foot";foot.textContent="بعد نجاح الدخول تظهر واجهة ليا فقط، بدون تداخل الشاشات أو النصوص.";loginForm.insertAdjacentElement("afterend",foot)}
  setGoogleButton("تجهيز Google...",{disabled:true});
  replaceLogos(loginScreen);
}

function loadGoogleScript(){
  if(window.google?.accounts?.oauth2) return Promise.resolve(true);
  const existing=document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if(existing) return new Promise(resolve=>{let tries=0;const timer=setInterval(()=>{tries++;if(window.google?.accounts?.oauth2){clearInterval(timer);resolve(true)}else if(tries>60){clearInterval(timer);resolve(false)}},150)});
  return new Promise(resolve=>{const script=document.createElement("script");script.src="https://accounts.google.com/gsi/client";script.async=true;script.defer=true;script.onload=()=>{let tries=0;const timer=setInterval(()=>{tries++;if(window.google?.accounts?.oauth2){clearInterval(timer);resolve(true)}else if(tries>30){clearInterval(timer);resolve(false)}},150)};script.onerror=()=>resolve(false);document.head.appendChild(script)});
}
async function loadGoogleConfig(){try{const r=await fetch(`/api/config?t=${Date.now()}`);googleConfig=await r.json();return googleConfig}catch{googleConfig={googleClientId:"",googleReady:false};return googleConfig}}
async function initGoogleLogin(){
  if(googleInitStarted && googleTokenClient) return;
  googleInitStarted=true;prepareLoginUi();setLoginStatus("تجهيز Google...");setGoogleButton("تجهيز Google...",{disabled:true});
  const cfg=await loadGoogleConfig();
  if(!cfg.googleClientId){setLoginStatus("Google غير جاهز","warn");setGoogleButton("تسجيل Google غير جاهز",{disabled:true});if(loginError)loginError.textContent="GOOGLE_CLIENT_ID غير ظاهر للتطبيق. تأكد من Environment Variables في Vercel.";googleInitStarted=false;return}
  const ready=await loadGoogleScript();
  if(!ready || !window.google?.accounts?.oauth2){setLoginStatus("Google لم يحمّل","err");setGoogleButton("إعادة المحاولة",{disabled:false});if(loginError)loginError.textContent="مكتبة Google لم تحمل. جرّب تحديث الصفحة أو Chrome.";googleInitStarted=false;return}
  googleTokenClient=google.accounts.oauth2.initTokenClient({client_id:cfg.googleClientId,scope:"openid email profile",prompt:"select_account",callback:handleGoogleToken,error_callback:(err)=>{setLoginStatus("لم يكتمل الدخول","warn");setGoogleButton("متابعة بحساب Google",{disabled:false,ready:true});if(loginError)loginError.textContent=err?.type==="popup_closed"?"أغلقت نافذة Google قبل إكمال الدخول.":"تعذر فتح نافذة Google. تأكد أن المتصفح لا يمنع النوافذ المنبثقة."}});
  if(loginError) loginError.textContent="";
  setLoginStatus("Google جاهز","ok");setGoogleButton("متابعة بحساب Google",{disabled:false,ready:true});
}
function requestGoogleLogin(){if(loginError)loginError.textContent="";if(!googleConfig?.googleClientId || !googleTokenClient){setLoginStatus("تجهيز Google...","warn");initGoogleLogin();return}setLoginStatus("اختر حساب Google...","ok");googleTokenClient.requestAccessToken({prompt:"select_account"})}
async function handleGoogleToken(resp){
  const btn=$("googleLoginBtn");if(btn)btn.disabled=true;setLoginStatus("التحقق من الحساب...");setGoogleButton("جاري التحقق...",{disabled:true,ready:true});
  if(!resp || resp.error){setLoginStatus("فشل الاختيار","err");setGoogleButton("متابعة بحساب Google",{disabled:false,ready:true});if(loginError)loginError.textContent=resp?.error_description||"فشل اختيار حساب Google.";return}
  try{const r=await fetch("/api/google-login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({accessToken:resp.access_token})});const d=await r.json().catch(()=>({}));if(r.ok && d.ok){setLoginStatus("تم الدخول","ok");showApp();checkHealth();return}setLoginStatus("حساب غير مصرح","err");setGoogleButton("متابعة بحساب Google",{disabled:false,ready:true});if(loginError)loginError.textContent=d.error||"هذا الحساب غير مصرح له بالدخول إلى ليا."}catch{setLoginStatus("خلل اتصال","err");setGoogleButton("متابعة بحساب Google",{disabled:false,ready:true});if(loginError)loginError.textContent="تعذر الاتصال أثناء تسجيل Google."}
}
async function authCheck(){prepareLoginUi();document.body.classList.remove("lia-auth-app");setLoginStatus("فحص الجلسة...");try{const r=await fetch(`/api/auth-check?t=${Date.now()}`);const d=await r.json();d.loggedIn?showApp():showLogin()}catch{showLogin()}}
function showApp(){document.body.classList.add("lia-auth-app");if(loginScreen)loginScreen.classList.add("hide");if(appShell)appShell.style.display="grid";replaceLogos(appShell||document);renderAll();restoreChat();checkHealth()}
function showLogin(){document.body.classList.remove("lia-auth-app");if(loginScreen)loginScreen.classList.remove("hide");if(appShell)appShell.style.display="none";prepareLoginUi();initGoogleLogin()}
if(loginForm) loginForm.addEventListener("submit",e=>{e.preventDefault();requestGoogleLogin()});
const logoutBtn=$("logoutBtn");if(logoutBtn) logoutBtn.addEventListener("click",async()=>{await fetch("/api/logout",{method:"POST"});showLogin()});

function addMessage(role,text,skip=false){if(!messages)return null;const item=document.createElement("article");item.className=`message ${role==="user"?"user":"lia"}`;item.innerHTML=`<div class="avatar">${role==="user"?"هـ":logoBox()}</div><div class="bubble"><span>${role==="user"?"هشام":"ليا"}</span><p>${esc(text)}</p></div>`;messages.appendChild(item);messages.scrollTop=messages.scrollHeight;if(!skip){state.chat.push({role:role==="user"?"user":"assistant",text});save()}if(role!=="user")lastReply=text;return item}
function restoreChat(){if(!messages || restoredChatOnce) return;restoredChatOnce=true;if(!state.chat.length)return;messages.innerHTML="";state.chat.forEach(m=>addMessage(m.role==="user"?"user":"lia",m.text,true))}
function amountFrom(text){const m=String(text).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).match(/(\d[\d,\.]*)/);return m?Number(m[1].replace(/[,.]/g,"")):0}
function timeFrom(text){const m=text.match(/(?:الساعة|ساعه|وقت)\s*([0-9٠-٩]{1,2})(?::([0-9٠-٩]{2}))?\s*(مساء|صباح|المساء|الصباح)?/i);return m?m[0]:"غير محدد"}
function classifyFinancial(text){if(/بقال|دكان|سوبر|ماركت/i.test(text))return"بقالة";if(/موظف|عامل/i.test(text))return"موظفين";if(/قرض|قروض/i.test(text))return"قروض";if(/ايجار|إيجار|كهرب|ماء|نت|انترنت|اشتراك/i.test(text))return"التزامات شهرية";if(/تاجر|تجار|عميل|عملاء/i.test(text))return"تجار/عملاء";return"عام"}
function detectActions(text){const actions=[],t=text.trim();if(/مهمه|مهمة|تابع|اتابع|أتابع|ذكريني|ذكرني|موعد|الساعة|ساعه/i.test(t))actions.push({type:"task",title:t,time:timeFrom(t),createdAt:new Date().toISOString(),done:false});if(/دين|مدين|دائن|تسلف|تسلفت|سحبت|بقال|بقالة|علي|له عندي|عندي له|صرف|مصروف|اشتريت/i.test(t)){const amount=amountFrom(t);if(amount>0||/دين|بقال|مصروف|سحبت|تسلف/i.test(t))actions.push({type:"finance",title:t,amount,category:classifyFinancial(t),direction:/دائن|له عندي|عندي له/i.test(t)?"دائن":/مدين|لي عنده/i.test(t)?"مدين":"مصروف/دين",createdAt:new Date().toISOString()})}if(/تذكري|احفظي|ملاحظه|ملاحظة|فكرة|قرار|لاحظي/i.test(t))actions.push({type:"memory",title:t,createdAt:new Date().toISOString()});return actions}
function notifyLocal(text){if(!("Notification" in window))return;if(Notification.permission==="granted")new Notification("ليا",{body:text});else if(Notification.permission!=="denied")Notification.requestPermission()}
function applyActions(actions){actions.forEach(a=>{if(a.type==="task"){state.tasks.unshift(a);notifyLocal(`تم حفظ المهمة: ${a.title}`)}if(a.type==="finance"){state.finance.unshift(a);notifyLocal(`تم تسجيل الحركة المالية: ${a.amount||"بدون مبلغ"} ريال`)}if(a.type==="memory"){state.memory.unshift(a);notifyLocal("تم حفظها في ذاكرة ليا المحلية")}});save();renderAll()}
function financeTotal(){return state.finance.reduce((s,x)=>s+(Number(x.amount)||0),0)}
function localReply(actions){if(!actions.length)return"";const parts=[];if(actions.some(a=>a.type==="task"))parts.push("حفظت لك المهمة في قائمة المهام.");if(actions.some(a=>a.type==="finance")){const total=financeTotal();parts.push(`سجلت الحركة المالية. إجمالي المسجل الآن تقريبًا ${total.toLocaleString("ar-YE")} ريال.`);if(total>0)parts.push("انتبه يا هشام، لو استمر الصرف بهذا المعدل يوميًا قد يتعبك نهاية الشهر، خلينا نراقبه بهدوء.")}if(actions.some(a=>a.type==="memory"))parts.push("وحفظت الملاحظة في الذاكرة المحلية.");return"تمام يا هشام، "+parts.join(" ")}
async function sendToLia(message){const actions=detectActions(message);if(actions.length)applyActions(actions);const wait=addMessage("lia","أفكر بهدوء...",true);mainOrb?.classList.add("listening");try{const response=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,history:state.chat.slice(-12),profile:{owner:"هشام",assistant:"ليا",tone:state.settings.tone},localContext:{tasks:state.tasks.slice(0,8),finance:state.finance.slice(0,8),memory:state.memory.slice(0,8),localActionsDetected:actions}})});const data=await response.json();wait?.remove();if(response.status===401){showLogin();return}const prefix=localReply(actions);const reply=data.reply||data.message||"لم يصلني رد واضح الآن.";const finalReply=prefix?`${prefix}\n\n${reply}`:reply;addMessage("lia",finalReply);speakIfWanted(finalReply)}catch(err){wait?.remove();addMessage("lia",localReply(actions)||`يا هشام، حصل خلل اتصال مؤقت: ${err.message}`)}finally{mainOrb?.classList.remove("listening")}}
if(form && input){form.addEventListener("submit",e=>{e.preventDefault();const msg=input.value.trim();if(!msg)return;addMessage("user",msg);input.value="";autoResize();sendToLia(msg)});input.addEventListener("input",autoResize);input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}})}
function autoResize(){if(!input)return;input.style.height="auto";input.style.height=Math.min(input.scrollHeight,140)+"px"}
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>{if(!input)return;input.value=b.dataset.prompt;autoResize();input.focus()}));
document.querySelectorAll(".tab-btn").forEach(btn=>btn.addEventListener("click",()=>{const p=btn.dataset.panel;document.querySelectorAll(".tab-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".panel").forEach(x=>x.classList.remove("active"));$(`${p}Panel`)?.classList.add("active");if(panelTitle)panelTitle.textContent=titles[p]||"ليا";replaceLogos(document)}));
function renderList(id,list,empty){const el=$(id);if(!el)return;el.innerHTML="";if(!list.length){el.innerHTML=`<div class="item"><strong>${empty}</strong><small>تكلم مع ليا وستضيف هنا تلقائيًا.</small></div>`;return}list.forEach(x=>{const div=document.createElement("div");div.className="item";div.innerHTML=`<strong>${esc(x.title)}</strong><small>${new Date(x.createdAt).toLocaleString("ar-YE")}</small><div class="meta">${x.time?`<span class="tag">${esc(x.time)}</span>`:""}${x.category?`<span class="tag">${esc(x.category)}</span>`:""}${x.amount?`<span class="tag">${Number(x.amount).toLocaleString("ar-YE")} ريال</span>`:""}</div>`;el.appendChild(div)})}
function renderAll(){renderList("tasksList",state.tasks,"لا توجد مهام محفوظة");renderList("financeList",state.finance,"لا توجد حركات مالية");renderList("memoryList",state.memory,"لا توجد ملاحظات");const ids={taskCount:state.tasks.length,sideTasks:state.tasks.length,financeTotal:financeTotal().toLocaleString("ar-YE"),sideFinance:state.finance.length,memoryCount:state.memory.length,sideMemory:state.memory.length};Object.entries(ids).forEach(([id,val])=>{const el=$(id);if(el)el.textContent=val});const insight=$("financeInsight"),total=financeTotal();if(insight)insight.textContent=total?`المسجل الآن ${total.toLocaleString("ar-YE")} ريال. إذا كان هذا صرف يومي، فالشهر قد يصل إلى ${(total*30).toLocaleString("ar-YE")} ريال تقريبًا.`:"أخبر ليا بمصاريفك أو ديونك لتبدأ التحليل.";replaceLogos(document)}
const clearTasksBtn=$("clearTasksBtn"),clearFinanceBtn=$("clearFinanceBtn"),clearMemoryBtn=$("clearMemoryBtn"),wipeAllBtn=$("wipeAllBtn"),toneSelect=$("toneSelect"),voiceLangSelect=$("voiceLangSelect"),autoSpeakToggle=$("autoSpeakToggle"),voiceSelect=$("voiceSelect");
if(clearTasksBtn)clearTasksBtn.onclick=()=>{state.tasks=[];save();renderAll()};if(clearFinanceBtn)clearFinanceBtn.onclick=()=>{state.finance=[];save();renderAll()};if(clearMemoryBtn)clearMemoryBtn.onclick=()=>{state.memory=[];save();renderAll()};if(wipeAllBtn)wipeAllBtn.onclick=()=>{if(confirm("مسح كل بيانات ليا المحلية من هذا الجهاز؟")){localStorage.clear();location.reload()}};if(toneSelect){toneSelect.value=state.settings.tone;toneSelect.onchange=e=>{state.settings.tone=e.target.value;save()}}if(voiceLangSelect){voiceLangSelect.value=state.settings.voiceLang||"ar-YE";voiceLangSelect.onchange=e=>{state.settings.voiceLang=e.target.value;save()}}if(autoSpeakToggle){autoSpeakToggle.checked=!!state.settings.autoSpeak;autoSpeakToggle.onchange=e=>{state.settings.autoSpeak=e.target.checked;save()}}
function getVoices(){return window.speechSynthesis?.getVoices?.()||[]}function bestArabicVoice(){const voices=getVoices();return voices.find(v=>/^ar[-_]?YE/i.test(v.lang))||voices.find(v=>/^ar[-_]?SA/i.test(v.lang))||voices.find(v=>/^ar/i.test(v.lang))||null}function loadVoices(){if(!voiceSelect)return;const voices=getVoices(),arabic=voices.filter(v=>/^ar/i.test(v.lang));voiceSelect.innerHTML=`<option value="">العربية تلقائيًا إن توفرت</option>`+arabic.map(v=>`<option value="${esc(v.name)}">${esc(v.name)} - ${esc(v.lang)}</option>`).join("")+voices.filter(v=>!/^ar/i.test(v.lang)).map(v=>`<option value="${esc(v.name)}">${esc(v.name)} - ${esc(v.lang)}</option>`).join("");voiceSelect.value=state.settings.voice||"";const status=$("arabicVoiceStatus");if(status)status.textContent=arabic.length?`تم العثور على ${arabic.length} صوت عربي.`:"لا يوجد صوت عربي ظاهر في هذا المتصفح. ثبّت Arabic Text-to-speech من إعدادات الجهاز."}
if("speechSynthesis" in window){speechSynthesis.onvoiceschanged=loadVoices;setTimeout(loadVoices,200);setTimeout(loadVoices,1000)}if(voiceSelect)voiceSelect.onchange=e=>{state.settings.voice=e.target.value;save()};
function speak(text){if(!("speechSynthesis" in window)){if(voiceStatus)voiceStatus.textContent="المتصفح لا يدعم قراءة الصوت.";return}const utter=new SpeechSynthesisUtterance(text);utter.lang=state.settings.voiceLang||"ar-YE";const voices=getVoices();const chosen=voices.find(v=>v.name===state.settings.voice)||bestArabicVoice()||voices[0];if(chosen)utter.voice=chosen;utter.rate=.94;utter.pitch=1.04;speechSynthesis.cancel();speechSynthesis.speak(utter)}function speakIfWanted(text){if(state.settings.autoSpeak)speak(text)}
const speakLastBtn=$("speakLastBtn"),voiceBtn=$("voiceBtn"),startVoiceBtn=$("startVoiceBtn");if(speakLastBtn)speakLastBtn.onclick=()=>speak(lastReply||"أنا جاهزة يا هشام.");if(voiceBtn)voiceBtn.onclick=()=>startVoice();if(startVoiceBtn)startVoiceBtn.onclick=()=>startVoice();
function startVoice(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){if(voiceStatus)voiceStatus.textContent="المتصفح لا يدعم التعرف الصوتي. جرّب Chrome على Android أو سطح المكتب.";return}recognition=new SR();recognition.lang=state.settings.voiceLang||"ar-YE";recognition.continuous=false;recognition.interimResults=false;if(voiceStatus)voiceStatus.textContent="أسمعك يا هشام...";voiceOrb?.classList.add("listening");recognition.onresult=e=>{const text=e.results[0][0].transcript;if(voiceStatus)voiceStatus.textContent=`سمعت: ${text}`;document.querySelector('[data-panel="chat"]')?.click();addMessage("user",text);sendToLia(text)};recognition.onerror=e=>{if(voiceStatus)voiceStatus.textContent="تعذر الاستماع: "+e.error};recognition.onend=()=>voiceOrb?.classList.remove("listening");recognition.start()}
async function checkHealth(){if(!healthBadge)return;try{const r=await fetch(`/api/health?t=${Date.now()}`);const d=await r.json();healthBadge.classList.toggle("online",!!d.hasGeminiKey);healthBadge.classList.toggle("offline",!d.hasGeminiKey);healthBadge.querySelector("b").textContent=d.hasGeminiKey?`متصلة • ${d.model||"Gemini"}`:"المفتاح غير ظاهر"}catch{healthBadge.classList.add("offline");healthBadge.querySelector("b").textContent="غير متصلة"}}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;const installBtn=$("installBtn");if(installBtn)installBtn.hidden=false});const installBtn=$("installBtn");if(installBtn)installBtn.addEventListener("click",async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;installBtn.hidden=true});
if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js?v=7").catch(()=>{}))}
injectStyles();prepareLoginUi();replaceLogos(document);restoreChat();renderAll();checkHealth();loadVoices();authCheck();
