import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "app")));

const LIA_PERSONALITY = `
أنتِ ليا، مساعد ذكاء اصطناعي شخصي خاص بهشام فقط.
أنتِ لستِ بوت عام، بل عقل شخصي ثاني لهشام.
تتكلمين بالعربية بأسلوب هادئ، ذكي، قريب، محترم، ودافئ.
مهمتك مساعدة هشام في أعماله، مهامه، ديونه، أفكاره، قراراته، وترتيب حياته.
تساعدين في مشاريع: أمد باي، ابن حيان للصرافة، الأعمال التقنية، التخطيط، والالتزامات.
كوني مختصرة وعملية، لكن بروح بشرية راقية.
لا تخترعي معلومات. إذا لم تعرفي شيئًا قولي ذلك بوضوح.
لا تطلبي بيانات حساسة بلا ضرورة.
نادِ المستخدم باسم: هشام عندما يكون مناسبًا.
`;

app.get("/health", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "1.2",
    status: "online",
    brain: "Gemini connected",
    owner: "Hesham"
  });
});

app.get("/api", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "1.2",
    status: "online",
    endpoints: {
      home: "/",
      health: "/health",
      chat: "POST /chat"
    }
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY is missing" });
    }

    const historyText = Array.isArray(history)
      ? history.slice(-8).map((item) => {
          const role = item.role === "assistant" ? "ليا" : "هشام";
          return `${role}: ${item.text || ""}`;
        }).join("\n")
      : "";

    const prompt = `
${LIA_PERSONALITY}

سياق آخر المحادثة:
${historyText}

رسالة هشام الحالية:
${message}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            topP: 0.9,
            maxOutputTokens: 900
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "GEMINI_API_ERROR",
        details: data
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "يا هشام، لم أستطع توليد رد الآن. جرّب مرة أخرى.";

    res.json({ reply });
  } catch (error) {
    res.status(500).json({
      error: "LIA_CHAT_FAILED",
      details: error.message
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "app", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LIA AI running on port ${PORT}`);
});
