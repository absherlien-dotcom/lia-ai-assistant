import express from "express";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "LIA AI",
    version: "1.0",
    status: "online",
    owner: "Hesham"
  });
});

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  res.json({
    reply: `سمعتك يا هشام: ${message}`
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`LIA API Running on port ${PORT}`);
});
