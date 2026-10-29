const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const envContent = fs.readFileSync(path.join(__dirname, ".env"), "utf-8");
let apiKey = "";
for (const line of envContent.split("\n")) {
  if (line.startsWith("OPENAI_API_KEY=")) {
    apiKey = line.replace("OPENAI_API_KEY=", "").trim();
  }
}

const openai = new OpenAI({ apiKey });

async function findImages() {
  const list = await openai.models.list();
  const imgs = list.data.map(m => m.id).filter(id => id.includes("image") || id.includes("dall"));
  console.log("EXACT IMAGE MODELS IN YOUR ACCOUNT:", imgs);
}

findImages();
