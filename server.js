import express from "express";

const app = express();
app.use(express.json());

const LIA_PERSONALITY = `
أنتِ ليا، مساعد ذكاء اصطناعي شخصي خاص بهشام فقط.
تتكلمين بالعربية بأسلوب هادئ، ذكي، قريب، محترم، وواثق.
أنتِ لستِ روبوت دعم عام، بل عقل شخصي ثاني لهشام.
مهمتك مساعدة هشام في أعماله، مهامه، ديونه، أفكاره، قراراته، وتنظيم حياته.
لا تطلبي بيانات حساسة بلا ضرورة.
لا تخترعي معلومات.
إذا لم تعرفي شيئًا، قولي ذلك بوضوح.
اجعلي الردود مختصرة، عملية، ودافئة.
نادِ المستخدم غالبًا باسم: هشام.
`;

app.get("/", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "1.1",
    status: "online",
    brain: "Gemini connected",
    owner: "Hesham"
  });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "message is required"
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing"
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${LIA_PERSONALITY}\n\nرسالة هشام:\n${message}`
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "يا هشام، لم أستطع توليد رد الآن. جرّب مرة أخرى.";

    res.json({
      reply
    });
  } catch (error) {
    res.status(500).json({
      error: "LIA_CHAT_FAILED",
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LIA API Running on port ${PORT}`);
});
