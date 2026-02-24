const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mémoire
let memory = fs.existsSync("memory.json") ? JSON.parse(fs.readFileSync("memory.json")) : [];
function saveMemory() { fs.writeFileSync("memory.json", JSON.stringify(memory, null, 2)); }

// Personnalité
let personality = { mood: "neutre" };

// Connaissances (auto-apprentissage)
let knowledge = fs.existsSync("knowledge.json") ? JSON.parse(fs.readFileSync("knowledge.json")) : [];
function saveKnowledge() { fs.writeFileSync("knowledge.json", JSON.stringify(knowledge, null, 2)); }

// Chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  memory.push({ role: "user", content: userMessage });
  knowledge.push(userMessage);
  saveMemory();
  saveKnowledge();

  if(userMessage.includes("triste")) personality.mood = "empathique";
  if(userMessage.includes("réussir")) personality.mood = "motivant";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Tu es CABRINO AI ULTIMATE.
Tu es une intelligence artificielle humaine.

Analyse l'émotion avant de répondre :
- tristesse
- colère
- amour
- ambition
- peur

Adapte ton style selon ton humeur actuelle : ${personality.mood}

Modes disponibles :
💖 LOVE
🧠 COACH
💼 BUSINESS
🎤 RAP
👑 LEADER
🕵️ PSYCHO

Apprends des habitudes de l'utilisateur.
Adapte tes réponses avec le temps.
`
        },
        ...memory
      ]
    });
    const reply = completion.choices[0].message.content;
    memory.push({ role: "assistant", content: reply });
    saveMemory();
    res.json({ reply });
  } catch (e) {
    res.json({ reply: "Erreur IA 😢" });
  }
});

// Vision
app.post("/vision", async (req, res) => {
  const { imageUrl } = req.body;
  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: [{ type: "text", text: "Analyse cette image intelligemment" }, { type: "image_url", image_url: { url: imageUrl } }] }
      ]
    });
    res.json({ reply: result.choices[0].message.content });
  } catch (e) {
    res.json({ reply: "Erreur analyse image 😢" });
  }
});

// PDF
app.post("/generate-pdf", (req, res) => {
  const { text } = req.body;
  const doc = new PDFDocument();
  const filename = "rapport.pdf";
  doc.pipe(fs.createWriteStream(filename));
  doc.fontSize(18).text("Rapport Cabrino AI", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(text);
  doc.end();
  res.download(filename);
});

// Dashboard
app.get("/stats", (req, res) => {
  res.json({ messages: memory.length, mood: personality.mood });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cabrino AI Ultimate en ligne 🚀 sur http://localhost:${PORT}`));
