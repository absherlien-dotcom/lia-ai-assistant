import{requireAuth,getGeminiKeyInfo,LIA_PERSONALITY,callGemini}from"./_lib.js";export default async function handler(req,res){if(req.method!=="POST")return res.status(405).json({error:"METHOD_NOT_ALLOWED"});if(!requireAuth(req,res))return;try{const{message,history=[],profile={},localContext={}}=req.body||{};if(!message||typeof message!=="string")return res.json({reply:"يا هشام، لم تصلني رسالة واضحة. اكتب رسالتك مرة أخرى."});const keyInfo=getGeminiKeyInfo();if(!keyInfo.key)return res.json({reply:"يا هشام، ليا لا ترى مفتاح Gemini داخل السيرفر حتى الآن. افتح /api/env-check وتأكد أن hasGeminiKey = true."});const historyText=Array.isArray(history)?history.slice(-12).map(item=>{const role=item.role==="assistant"?"ليا":"هشام";return`${role}: ${item.text||""}`}).join("
"):"";const prompt=`${LIA_PERSONALITY}

ملف هشام المختصر:
${JSON.stringify(profile,null,2)}

السياق المحلي المخزن في جهاز هشام:
${JSON.stringify(localContext,null,2)}

سياق آخر المحادثة:
${historyText}

رسالة هشام الحالية:
${message}

أجيبي برد طبيعي فقط، ولا تكتبي JSON. إذا فهمتِ أن الرسالة تحتوي مهمة أو دين أو مصروف أو ملاحظة، أكدي له بلطف أن ليا حفظتها أو رتبتها، لأن الواجهة ستقوم بالحفظ المحلي تلقائيًا.`;const result=await callGemini({apiKey:keyInfo.key,prompt});if(!result.ok){const e=result.attempts?.[0];return res.json({reply:`يا هشام، Gemini رجّع خطأ حقيقي:

مصدر المفتاح: ${keyInfo.source}
طول المفتاح: ${keyInfo.length}
الموديل: ${e?.model||"غير معروف"}
الكود: ${e?.status||"غير معروف"}
السبب: ${e?.error||"غير معروف"}`})}res.json({reply:result.reply,model:result.model,keySource:keyInfo.source})}catch(error){res.json({reply:`يا هشام، حصل خطأ داخلي في السيرفر:

${error.message}`})}}