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

async function callGemini({ apiKey, prompt }) {
  const models = [
    process.env.GEMINI_MODEL,
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-2.0-flash"
  ].filter(Boolean);

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
  res.json({
    name: "LIA AI",
    version: "2.1",
    status: "online",
    brain: "Gemini connected",
    owner: "Hesham",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL || "auto"
  });
});

app.get("/api", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "2.1",
    endpoints: {
      home: "GET /",
      health: "GET /health",
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

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.json({
        reply:
          "يا هشام، مفتاح Gemini غير موجود في Railway. أضف المتغير GEMINI_API_KEY من تبويب Variables."
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

    const result = await callGemini({ apiKey, prompt });

    if (!result.ok) {
      console.error("GEMINI_FAILED_ATTEMPTS:", JSON.stringify(result.attempts, null, 2));

      const firstError = result.attempts?.[0];

      return res.json({
        reply:
          `يا هشام، Gemini رجّع خطأ حقيقي:\n\n` +
          `الموديل: ${firstError?.model || "غير معروف"}\n` +
          `الكود: ${firstError?.status || "غير معروف"}\n` +
          `السبب: ${firstError?.error || "غير معروف"}\n\n` +
          `انسخ هذه الرسالة لي وسأصلحها مباشرة.`
      });
    }

    res.json({
      reply: result.reply,
      model: result.model
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
  console.log(`LIA AI v2.1 running on port ${PORT}`);
});
