const express = require("express");
const cors = require("cors");
const { Configuration, OpenAIApi } = require("openai");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // frontend

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

app.post("/chat", async (req, res) => {
  const { message, history } = req.body;
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Tu es Cabrino, un rappeur stylé, drôle et intelligent. Tu réponds avec flow et charisme." },
        ...history,
        { role: "user", content: message }
      ]
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ reply: "Erreur de l'IA 😢" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Cabrino AI server running on port ${PORT}`));
