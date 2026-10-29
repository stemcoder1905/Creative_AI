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

console.log("Testing with API Key:", apiKey.substring(0, 15) + "..." + apiKey.slice(-6));

const openai = new OpenAI({ apiKey });

async function test() {
  try {
    console.log("Sending test request to OpenAI DALL-E 3...");
    const res = await openai.images.generate({
      model: "dall-e-3",
      prompt: "A festive diya lamp glowing with golden light for Diwali festival poster",
      size: "1024x1024",
      n: 1
    });
    console.log(">>> SUCCESS! DALL-E 3 Generated URL:", res.data[0].url);
  } catch (err) {
    console.error(">>> FAILED! OpenAI Status:", err.status);
    console.error(">>> Error Message:", err.message);
    if (err.error) console.error(">>> Error Details:", JSON.stringify(err.error, null, 2));
  }
}

test();
