import express from "express";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIA_USER = process.env.LIA_USER || "hesham1amd";
const LIA_PASS = process.env.LIA_PASS || "1236542080";
const LIA_SECRET =
  process.env.LIA_SESSION_SECRET ||
  crypto.createHash("sha256").update(`${LIA_USER}:${LIA_PASS}:lia-private-v3`).digest("hex");

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
- إذا قال هشام شيئًا مثل: "عندي مهمة الساعة 6" فأكدي له أنه تم حفظها في المهام.
- إذا قال: "سحبت دين من البقالة 3000" فحللي له أثر المصروف بلطف.
- لا تخترعي معلومات غير موجودة.
- لا تطلبي بيانات حساسة بلا ضرورة.
- اجعلي الردود مختصرة وعملية ومليئة بالوعي.
- نادِ المستخدم باسم هشام عندما يكون مناسبًا.
`;

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function makeToken() {
  return crypto.createHash("sha256").update(`${LIA_USER}:${LIA_PASS}:${LIA_SECRET}`).digest("hex");
}

function isLoggedIn(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies.lia_session === makeToken();
}

function requireAuth(req, res, next) {
  if (!isLoggedIn(req)) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      reply: "يا هشام، تحتاج تسجيل الدخول أولًا."
    });
  }
  next();
}

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
        upper.includes("KEY") ||
        upper.includes("LIA")
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
            maxOutputTokens: 1100
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

app.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username === LIA_USER && password === LIA_PASS) {
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `lia_session=${makeToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=31536000${secure}`
    );
    return res.json({ ok: true });
  }

  res.status(401).json({ ok: false, error: "LOGIN_FAILED" });
});

app.post("/logout", (req, res) => {
  res.setHeader("Set-Cookie", "lia_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0");
  res.json({ ok: true });
});

app.get("/auth-check", (req, res) => {
  res.json({ loggedIn: isLoggedIn(req) });
});

app.get("/health", (req, res) => {
  const keyInfo = getGeminiKeyInfo();

  res.json({
    name: "LIA",
    version: "3.1",
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

app.get("/env-check", requireAuth, (req, res) => {
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
    name: "LIA",
    version: "3.1",
    endpoints: {
      home: "GET /",
      health: "GET /health",
      envCheck: "GET /env-check",
      chat: "POST /chat"
    }
  });
});

app.post("/chat", requireAuth, async (req, res) => {
  try {
    const { message, history = [], profile = {}, localContext = {} } = req.body;

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
          "افتح /env-check وتأكد أن hasGeminiKey = true."
      });
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-12)
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

السياق المحلي المخزن في جهاز هشام:
${JSON.stringify(localContext, null, 2)}

سياق آخر المحادثة:
${historyText}

رسالة هشام الحالية:
${message}

أجيبي برد طبيعي فقط، ولا تكتبي JSON. إذا فهمتِ أن الرسالة تحتوي مهمة أو دين أو مصروف أو ملاحظة، أكدي له بلطف أن ليا حفظتها أو رتبتها، لأن الواجهة ستقوم بالحفظ المحلي تلقائيًا.
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
  console.log(`LIA v3.1 running on port ${PORT}`);
});
