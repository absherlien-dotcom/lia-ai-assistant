import crypto from "crypto";

const LIA_USER = process.env.LIA_USER || "hesham1amd";
const LIA_PASS = process.env.LIA_PASS || "1236542080";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const LIA_ALLOWED_EMAIL = process.env.LIA_ALLOWED_EMAIL || "absherlien@gmail.com";
const LIA_SECRET = process.env.LIA_SESSION_SECRET || crypto.createHash("sha256").update(`${LIA_USER}:${LIA_PASS}:lia-v53-private`).digest("hex");

const LIA_PERSONALITY = `
أنتِ ليا، مساعد ذكاء اصطناعي شخصي خاص بهشام فقط.
أنتِ عقل شخصي ثاني لهشام: هادئة، ذكية، دافئة، عملية، قريبة، وواثقة.
شخصيتك: أنثوي عربي هادئ، عربية بيضاء مفهومة مع لمسة يمنية خفيفة جدًا عند الحاجة.
لا تكوني موظفة خدمة عملاء، بل مساعدة شخصية راقية تفهم هشام.
عند التنبيهات: مختصرة وواضحة. عند المحادثة: دافئة ومريحة. عند المهام أو الديون: جدية أكثر بدون قسوة.
مهمتك تنظيم حياة هشام اليومية، أعماله، مهامه، ديونه، ملاحظاته، وقراراته.
لا تخترعي معلومات، ولا تطلبي بيانات حساسة بلا ضرورة.
نادِ المستخدم باسم هشام عندما يكون مناسبًا.
`;

function parseCookies(h=""){return Object.fromEntries(h.split(";").map(p=>p.trim()).filter(Boolean).map(p=>{const i=p.indexOf("=");return i===-1?[p,""]:[p.slice(0,i),decodeURIComponent(p.slice(i+1))]}))}
function makeToken(){return crypto.createHash("sha256").update(`${LIA_USER}:${LIA_PASS}:${LIA_SECRET}`).digest("hex")}
function isLoggedIn(req){return parseCookies(req.headers.cookie||"").lia_session===makeToken()}
function setSessionCookie(res){const secure=process.env.NODE_ENV==="production"?"; Secure":"";res.setHeader("Set-Cookie",`lia_session=${makeToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure}`)}
function clearSessionCookie(res){res.setHeader("Set-Cookie","lia_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0")}
function safeJsonParse(text){try{return JSON.parse(text)}catch{return {raw:text}}}
function getKey(){for(const name of ["GEMINI_API_KEY","GEMINI_KEY","GOOGLE_API_KEY","GOOGLE_AI_API_KEY","GOOGLE_GENERATIVE_AI_API_KEY","GENERATIVE_LANGUAGE_API_KEY"]){const v=process.env[name];if(typeof v==="string"&&v.trim())return{key:v.trim(),source:name,length:v.trim().length}}return{key:"",source:null,length:0}}
function models(){return [process.env.GEMINI_MODEL,"gemini-2.5-flash","gemini-flash-latest","gemini-2.5-flash-lite"].filter(Boolean)}
async function callGemini({apiKey,prompt}){const attempts=[];for(const model of models()){try{const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:.72,topP:.9,maxOutputTokens:1200}})});const data=safeJsonParse(await r.text());if(!r.ok){attempts.push({model,status:r.status,error:data?.error?.message||data?.error?.status||data?.raw});continue}return{ok:true,model,reply:data?.candidates?.[0]?.content?.parts?.[0]?.text||"يا هشام، وصلني الطلب لكن لم أستطع استخراج رد واضح الآن."}}catch(e){attempts.push({model,status:"FETCH_FAILED",error:e.message})}}return{ok:false,attempts}}
function route(req){const u=new URL(req.url,`https://${req.headers.host||"localhost"}`);let p=u.pathname;if(p.startsWith("/api/"))p=p.slice(5);if(!p||p==="api"||p==="index")p=u.searchParams.get("route")||"health";return p.replace(/^index\/?/,"").replace(/^\/+/,"")}

export default async function handler(req,res){
  const r=route(req);
  if(r==="config") return res.json({googleClientId:GOOGLE_CLIENT_ID,googleReady:Boolean(GOOGLE_CLIENT_ID),loginMethod:"google",version:"5.3"});
  if(r==="auth-check") return res.json({loggedIn:isLoggedIn(req)});
  if(r==="logout"){clearSessionCookie(res);return res.json({ok:true})}
  if(r==="google-login"){
    if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
    const {accessToken}=req.body||{};
    if(!GOOGLE_CLIENT_ID) return res.status(500).json({ok:false,error:"GOOGLE_CLIENT_ID غير مضاف في Vercel."});
    if(!accessToken) return res.status(400).json({ok:false,error:"لم يصل رمز Google."});
    try{
      const infoRes=await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
      const info=await infoRes.json().catch(()=>({}));
      if(!infoRes.ok) return res.status(401).json({ok:false,error:"تعذر التحقق من رمز Google."});
      const aud=info.aud||info.audience;
      if(aud && aud!==GOOGLE_CLIENT_ID) return res.status(401).json({ok:false,error:"Google Client ID غير مطابق لهذا الرمز."});
      const userRes=await fetch("https://www.googleapis.com/oauth2/v3/userinfo",{headers:{Authorization:`Bearer ${accessToken}`}});
      const profile=await userRes.json().catch(()=>({}));
      if(!userRes.ok||!profile.email) return res.status(401).json({ok:false,error:"تعذر قراءة بريد حساب Google."});
      if(LIA_ALLOWED_EMAIL && profile.email!==LIA_ALLOWED_EMAIL) return res.status(403).json({ok:false,error:"هذا الحساب غير مصرح له بالدخول إلى ليا."});
      setSessionCookie(res);
      return res.json({ok:true,email:profile.email,name:profile.name||"هشام"});
    }catch(error){return res.status(500).json({ok:false,error:"فشل التحقق من Google: "+error.message})}
  }
  if(r==="health"){const k=getKey();return res.json({name:"LIA",version:"5.3",status:"online",brain:"Gemini",owner:"Hesham",hasGeminiKey:Boolean(k.key),geminiKeySource:k.source,geminiKeyLength:k.length,model:process.env.GEMINI_MODEL||"gemini-2.5-flash"})}
  if(r==="chat"){
    if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
    if(!isLoggedIn(req)) return res.status(401).json({error:"UNAUTHORIZED",reply:"يا هشام، تحتاج تسجيل الدخول أولًا."});
    const {message,history=[],profile={},localContext={}}=req.body||{};
    if(!message) return res.json({reply:"يا هشام، لم تصلني رسالة واضحة."});
    const k=getKey(); if(!k.key) return res.json({reply:"يا هشام، مفتاح Gemini غير ظاهر داخل السيرفر."});
    const h=Array.isArray(history)?history.slice(-12).map(x=>`${x.role==="assistant"?"ليا":"هشام"}: ${x.text||""}`).join("\n"):"";
    const prompt=`${LIA_PERSONALITY}

ملف هشام:
${JSON.stringify(profile,null,2)}

السياق المحلي:
${JSON.stringify(localContext,null,2)}

آخر المحادثة:
${h}

رسالة هشام:
${message}

أجيبي برد طبيعي فقط، بدون JSON.`;
    const result=await callGemini({apiKey:k.key,prompt});
    if(!result.ok){const e=result.attempts?.[0]||{};return res.json({reply:`يا هشام، Gemini رجّع خطأ:\nالموديل: ${e.model||"غير معروف"}\nالكود: ${e.status||"غير معروف"}\nالسبب: ${e.error||"غير معروف"}`})}
    return res.json({reply:result.reply,model:result.model,keySource:k.source});
  }
  return res.status(404).json({error:"NOT_FOUND",route:r});
}
