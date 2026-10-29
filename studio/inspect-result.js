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

async function inspectChatGptImage() {
  const res = await openai.images.generate({
    model: "chatgpt-image-latest",
    prompt: "A beautiful Diwali diya lamp with golden warm sparklers",
    size: "1024x1024",
    n: 1
  });
  console.log("Keys in response data[0]:", Object.keys(res.data[0]));
  if (res.data[0].b64_json) console.log("b64_json length:", res.data[0].b64_json.length);
  if (res.data[0].url) console.log("url:", res.data[0].url);
}

inspectChatGptImage();
