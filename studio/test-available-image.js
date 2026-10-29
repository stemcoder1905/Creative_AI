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

async function testModel(modelName) {
  try {
    console.log(`Testing model "${modelName}"...`);
    const res = await openai.images.generate({
      model: modelName,
      prompt: "A beautiful Diwali diya lamp with golden sparklers and warm glowing lights, poster design",
      size: "1024x1024",
      n: 1
    });
    console.log(`>>> SUCCESS with ${modelName}! URL:`, res.data[0].url);
    return true;
  } catch (e) {
    console.log(`>>> ${modelName} failed:`, e.status, e.message);
    return false;
  }
}

async function run() {
  const models = ['gpt-image-1', 'chatgpt-image-latest', 'gpt-image-1-mini', 'gpt-image-2', 'dall-e-2'];
  for (const m of models) {
    const ok = await testModel(m);
    if (ok) break;
  }
}

run();
