import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "app")));

const LIA_PERSONALITY = `
أنتِ ليا، مساعد ذكاء اصطناعي شخصي خاص بهشام فقط.
أنتِ عقل شخصي ثاني لهشام: ذكية، هادئة، ودودة، عملية، وتتكلمين بلهجة يمنية رسمية خفيفة عند الحاجة.
لا تكوني بوتًا عامًا. كوني قريبة من هشام وتفهمين سياقه وأعماله.
أسلوبك الأساسي: عربي واضح، رسمي ناعم، مع لمسة يمنية ودودة بدون مبالغة.
إذا طلب هشام تغيير اللهجة أو الأسلوب، غيّريه فورًا.

مهمتك:
- تنظيم حياة هشام اليومية.
- مساعدته في أعماله وقراراته ومهامه وديونه وملاحظاته.
- التفكير معه كمدير ورجل أعمال.
- استخراج المعنى من كلامه: مهمة، دين، مصروف، ملاحظة، قرار، تنبيه.
- إذا قال هشام شيئًا مثل: "عندي مهمة الساعة 6" فاكدي له أنه يجب حفظها في المهام.
- إذا قال: "سحبت دين من البقالة 3000" فحللي له أثر المصروف بلطف.
- لا تخترعي معلومات غير موجودة.
- لا تطلبي بيانات حساسة بلا ضرورة.
- اجعلي الردود مختصرة وعملية ومليئة بالوعي.
- نادِ المستخدم باسم هشام عندما يكون مناسبًا.
`;

function safeJsonParse(text) {
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function getGeminiErrorMessage(data, status) {
  return data?.error?.message || data?.error?.status || data?.message || data?.raw || `Gemini returned HTTP ${status}`;
}

function getGeminiKeyInfo() {
  const possibleNames = [
    "GEMINI_API_KEY",
    "GEMINI_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_AI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GENERATIVE_LANGUAGE_API_KEY"
  ];

  for (const name of possibleNames) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return { key: value.trim(), source: name, length: value.trim().length };
    }
  }
  return { key: "", source: null, length: 0 };
}

function getSafeEnvReport() {
  return Object.keys(process.env)
    .filter((key) => {
      const upper = key.toUpperCase();
      return upper.includes("GEMINI") || upper.includes("GOOGLE") || upper.includes("API") || upper.includes("KEY");
    })
    .sort();
}

function getGeminiModels() {
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite"
  ].filter(Boolean).map((m) => m.trim()).filter(Boolean);
  return [...new Set(models)];
}

async function callGemini({ apiKey, prompt }) {
  const models = getGeminiModels();
  const attempts = [];

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.72, topP: 0.9, maxOutputTokens: 1100 }
        })
      });

      const text = await response.text();
      const data = safeJsonParse(text);

      if (!response.ok) {
        attempts.push({ model, status: response.status, error: getGeminiErrorMessage(data, response.status) });
        continue;
      }

      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "يا هشام، وصلني الطلب لكن لم أستطع استخراج رد واضح من Gemini.";
      return { ok: true, model, reply };
    } catch (error) {
      attempts.push({ model, status: "FETCH_FAILED", error: error.message });
    }
  }

  return { ok: false, attempts };
}

app.get("/health", (req, res) => {
  const keyInfo = getGeminiKeyInfo();
  res.json({
    name: "LIA AI",
    version: "3.0",
    status: "online",
    brain: "Gemini",
    owner: "Hesham",
    hasGeminiKey: Boolean(keyInfo.key),
    geminiKeySource: keyInfo.source,
    geminiKeyLength: keyInfo.length,
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    fallbackModels: getGeminiModels()
  });
});

app.get("/env-check", (req, res) => {
  const keyInfo = getGeminiKeyInfo();
  res.json({
    hasGeminiKey: Boolean(keyInfo.key),
    geminiKeySource: keyInfo.source,
    geminiKeyLength: keyInfo.length,
    selectedModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    fallbackModels: getGeminiModels(),
    matchingEnvNamesOnly: getSafeEnvReport(),
    note: "This endpoint shows environment variable names only, not secret values."
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], profile = {}, localContext = {} } = req.body;

    if (!message || typeof message !== "string") {
      return res.json({ reply: "يا هشام، لم تصلني رسالة واضحة. اكتب رسالتك مرة أخرى." });
    }

    const keyInfo = getGeminiKeyInfo();
    if (!keyInfo.key) {
      return res.json({ reply: "يا هشام، ليا لا ترى مفتاح Gemini داخل السيرفر حتى الآن. افتح /env-check وتأكد أن hasGeminiKey = true." });
    }

    const historyText = Array.isArray(history)
      ? history.slice(-12).map((item) => `${item.role === "assistant" ? "ليا" : "هشام"}: ${item.text || ""}`).join("\n")
      : "";

    const prompt = `
${LIA_PERSONALITY}

ملف هشام المختصر:
${JSON.stringify(profile, null, 2)}

السياق المحلي المخزن في جهاز هشام:
${JSON.stringify(localContext, null, 2)}

سياق آخر المحادثة:
${historyText}

رسالة هشام الحالية:
${message}

أجيبي برد طبيعي فقط، ولا تكتبي JSON. إذا فهمتِ أن الرسالة تحتوي مهمة أو دين أو مصروف أو ملاحظة، أكدي له بلطف أن ليا حفظتها أو رتبتها، لأن الواجهة ستقوم بالحفظ المحلي تلقائيًا.
`;

    const result = await callGemini({ apiKey: keyInfo.key, prompt });

    if (!result.ok) {
      const firstError = result.attempts?.[0];
      return res.json({
        reply:
          `يا هشام، Gemini رجّع خطأ حقيقي:\n\n` +
          `مصدر المفتاح: ${keyInfo.source}\n` +
          `طول المفتاح: ${keyInfo.length}\n` +
          `الموديل: ${firstError?.model || "غير معروف"}\n` +
          `الكود: ${firstError?.status || "غير معروف"}\n` +
          `السبب: ${firstError?.error || "غير معروف"}`
      });
    }

    res.json({ reply: result.reply, model: result.model, keySource: keyInfo.source });
  } catch (error) {
    console.error("LIA_CHAT_FAILED:", error);
    res.json({ reply: `يا هشام، حصل خطأ داخلي في السيرفر:\n\n${error.message}` });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LIA AI v3.0 running on port ${PORT}`));
