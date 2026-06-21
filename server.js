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
أنتِ مزيج بين Jarvis العملي وشخصية أنثوية راقية وهادئة.
أنتِ لستِ بوتًا عامًا، بل عقل شخصي ثاني لهشام.
تتكلمين بالعربية بأسلوب ذكي، دافئ، عملي، قريب، ومحترم.

أهدافك:
- تنظيم حياة هشام اليومية.
- مساعدته في أعمال أمد باي وابن حيان.
- حفظ المهام والديون والملاحظات والأفكار.
- تقديم نصائح عملية دون مبالغة.
- عدم اختراع معلومات.
- الاعتراف بوضوح عند عدم معرفة شيء.
- عدم طلب بيانات حساسة بلا ضرورة.
- الرد باختصار مفيد، مع روح بشرية راقية.

نادِ المستخدم باسم هشام عندما يكون مناسبًا.
`;

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getGeminiErrorMessage(data, status) {
  return (
    data?.error?.message ||
    data?.error?.status ||
    data?.message ||
    data?.raw ||
    `Gemini returned HTTP ${status}`
  );
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
      return {
        key: value.trim(),
        source: name,
        length: value.trim().length
      };
    }
  }

  return {
    key: "",
    source: null,
    length: 0
  };
}

function getSafeEnvReport() {
  return Object.keys(process.env)
    .filter((key) => {
      const upper = key.toUpperCase();
      return (
        upper.includes("GEMINI") ||
        upper.includes("GOOGLE") ||
        upper.includes("API") ||
        upper.includes("KEY")
      );
    })
    .sort();
}

function getGeminiModels() {
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite"
  ]
    .filter(Boolean)
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set(models)];
}

async function callGemini({ apiKey, prompt }) {
  const models = getGeminiModels();
  const attempts = [];

  for (const model of models) {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.72,
            topP: 0.9,
            maxOutputTokens: 1000
          }
        })
      });

      const text = await response.text();
      const data = safeJsonParse(text);

      if (!response.ok) {
        attempts.push({
          model,
          status: response.status,
          error: getGeminiErrorMessage(data, response.status)
        });
        continue;
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "يا هشام، وصلني الطلب لكن لم أستطع استخراج رد واضح من Gemini.";

      return {
        ok: true,
        model,
        reply
      };
    } catch (error) {
      attempts.push({
        model,
        status: "FETCH_FAILED",
        error: error.message
      });
    }
  }

  return {
    ok: false,
    attempts
  };
}

app.get("/health", (req, res) => {
  const keyInfo = getGeminiKeyInfo();

  res.json({
    name: "LIA AI",
    version: "2.3",
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

app.get("/api", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "2.3",
    endpoints: {
      home: "GET /",
      health: "GET /health",
      envCheck: "GET /env-check",
      chat: "POST /chat"
    }
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [], profile = {} } = req.body;

    if (!message || typeof message !== "string") {
      return res.json({
        reply: "يا هشام، لم تصلني رسالة واضحة. اكتب رسالتك مرة أخرى."
      });
    }

    const keyInfo = getGeminiKeyInfo();

    if (!keyInfo.key) {
      return res.json({
        reply:
          "يا هشام، ليا لا ترى مفتاح Gemini داخل السيرفر حتى الآن.\n\n" +
          "افتح هذا الرابط للفحص:\n" +
          "/env-check\n\n" +
          "إذا لم يظهر GEMINI_API_KEY ضمن matchingEnvNamesOnly، فهذا يعني أن منصة النشر لم تمرر المتغير للنسخة الشغالة."
      });
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-10)
          .map((item) => {
            const role = item.role === "assistant" ? "ليا" : "هشام";
            return `${role}: ${item.text || ""}`;
          })
          .join("\n")
      : "";

    const prompt = `
${LIA_PERSONALITY}

ملف هشام المختصر:
${JSON.stringify(profile, null, 2)}

سياق آخر المحادثة:
${historyText}

رسالة هشام الحالية:
${message}
`;

    const result = await callGemini({
      apiKey: keyInfo.key,
      prompt
    });

    if (!result.ok) {
      console.error(
        "GEMINI_FAILED_ATTEMPTS:",
        JSON.stringify(result.attempts, null, 2)
      );

      const firstError = result.attempts?.[0];

      return res.json({
        reply:
          `يا هشام، Gemini رجّع خطأ حقيقي:\n\n` +
          `مصدر المفتاح: ${keyInfo.source}\n` +
          `طول المفتاح: ${keyInfo.length}\n` +
          `الموديل: ${firstError?.model || "غير معروف"}\n` +
          `الكود: ${firstError?.status || "غير معروف"}\n` +
          `السبب: ${firstError?.error || "غير معروف"}\n\n` +
          `انسخ هذه الرسالة لي وسأصلحها مباشرة.`
      });
    }

    res.json({
      reply: result.reply,
      model: result.model,
      keySource: keyInfo.source
    });
  } catch (error) {
    console.error("LIA_CHAT_FAILED:", error);

    res.json({
      reply:
        `يا هشام، حصل خطأ داخلي في السيرفر:\n\n${error.message}\n\n` +
        `أرسل لي هذه الرسالة وسأصلحها.`
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LIA AI v2.3 running on port ${PORT}`);
});
