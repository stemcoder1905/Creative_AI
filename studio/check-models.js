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

async function checkModels() {
  try {
    const list = await openai.models.list();
    console.log("Total models available to this key:", list.data.length);
    const names = list.data.map(m => m.id).filter(id => id.includes("dall") || id.includes("image") || id.includes("gpt"));
    console.log("Image/GPT models accessible:", names);
  } catch (err) {
    console.error("List models error:", err.message);
  }
}

checkModels();
