const fs = require("fs");
const path = require("path");

const API_URL = process.env.TRANSLATION_API_URL || "https://longish-quaggy-carmen.ngrok-free.dev/v1";
const MODEL = process.env.TRANSLATION_MODEL || "hf.co/s3dev-ai/Falcon3-10B-Instruct-gguf:Q6_K";
const API_KEY = process.env.TRANSLATION_API_KEY || "";

const SRC_DIR = path.join(__dirname, "..", "src/locales");
const PT_BR_PATH = path.join(SRC_DIR, "pt-BR.json");
const ptBr = JSON.parse(fs.readFileSync(PT_BR_PATH, "utf-8"));
const keys = Object.keys(ptBr);

const TARGET_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "nl", name: "Dutch" },
  { code: "pt", name: "Portuguese (Portugal)" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "bn", name: "Bengali" },
  { code: "tr", name: "Turkish" },
  { code: "vi", name: "Vietnamese" },
  { code: "th", name: "Thai" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "tl", name: "Filipino" },
  { code: "pl", name: "Polish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ro", name: "Romanian" },
  { code: "hu", name: "Hungarian" },
  { code: "cs", name: "Czech" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "sv", name: "Swedish" },
  { code: "no", name: "Norwegian" },
  { code: "da", name: "Danish" },
  { code: "fi", name: "Finnish" },
  { code: "sk", name: "Slovak" },
  { code: "bg", name: "Bulgarian" },
  { code: "sr", name: "Serbian" },
  { code: "hr", name: "Croatian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lv", name: "Latvian" },
  { code: "et", name: "Estonian" },
  { code: "sl", name: "Slovenian" },
  { code: "ka", name: "Georgian" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "kk", name: "Kazakh" },
  { code: "uz", name: "Uzbek" },
  { code: "ne", name: "Nepali" },
  { code: "si", name: "Sinhala" },
  { code: "my", name: "Burmese" },
  { code: "km", name: "Khmer" },
  { code: "mn", name: "Mongolian" },
  { code: "am", name: "Amharic" },
  { code: "sw", name: "Swahili" },
  { code: "af", name: "Afrikaans" },
  { code: "ca", name: "Catalan" },
  { code: "gl", name: "Galician" },
  { code: "eu", name: "Basque" },
  { code: "bs", name: "Bosnian" },
  { code: "sq", name: "Albanian" },
  { code: "mk", name: "Macedonian" },
  { code: "fa", name: "Persian" },
  { code: "ur", name: "Urdu" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "as", name: "Assamese" },
  { code: "sd", name: "Sindhi" },
  { code: "bo", name: "Tibetan" },
  { code: "dz", name: "Dzongkha" },
  { code: "fy", name: "Frisian" },
  { code: "ga", name: "Irish" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "cy", name: "Welsh" },
  { code: "mt", name: "Maltese" },
  { code: "is", name: "Icelandic" },
  { code: "lb", name: "Luxembourgish" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "zu", name: "Zulu" },
  { code: "xh", name: "Xhosa" },
  { code: "st", name: "Sesotho" },
  { code: "tn", name: "Tswana" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "sn", name: "Shona" },
  { code: "so", name: "Somali" },
  { code: "ku", name: "Kurdish" },
  { code: "ps", name: "Pashto" },
  { code: "jw", name: "Javanese" },
  { code: "su", name: "Sundanese" },
  { code: "ceb", name: "Cebuano" },
  { code: "hmn", name: "Hmong" },
  { code: "ht", name: "Haitian Creole" },
  { code: "la", name: "Latin" },
  { code: "mi", name: "Maori" },
  { code: "haw", name: "Hawaiian" },
  { code: "yi", name: "Yiddish" },
];

async function translateBatch(texts, targetLang) {
  const systemMsg = `You are a translator API. You must translate the given Portuguese JSON object to ${targetLang}.
You must respond with ONLY a valid JSON object containing the translated key-value pairs. 
Start your response exactly with { and end exactly with }. 
Do not output markdown blocks or any other text. Example: {"Bom dia": "Good morning"}`;
  
  const userMsg = JSON.stringify(texts, null, 2);

  const response = await fetch(`${API_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      temperature: 0.1,
      max_tokens: 32000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from API");

  // Extract JSON from response (handle possible markdown wrapping)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response: " + content.substring(0, 200));
  
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  console.log(`Translating ${keys.length} keys to ${TARGET_LANGUAGES.length} languages...`);
  console.log(`API: ${API_URL}, Model: ${MODEL}\n`);

  // Process languages in batches of 2 for speed (avoid rate limits)
  for (let i = 0; i < TARGET_LANGUAGES.length; i++) {
    const lang = TARGET_LANGUAGES[i];
    const filePath = path.join(SRC_DIR, `${lang.code}.json`);

    // Skip if already exists
    if (fs.existsSync(filePath)) {
      console.log(`  SKIP ${lang.code} (${lang.name}) — already exists`);
      continue;
    }

    console.log(`  Translating ${lang.code} (${lang.name})...`);

    try {
      // Split keys into batches of 20 to avoid token limits on local LLM context windows
      const batchSize = 20;
      const translations = {};

      for (let b = 0; b < keys.length; b += batchSize) {
        const batch = keys.slice(b, b + batchSize);
        const batchObj = {};
        batch.forEach((k) => { batchObj[k] = ptBr[k]; });

        console.log(`    Batch ${b / batchSize + 1}/${Math.ceil(keys.length / batchSize)}...`);
        const result = await translateBatch(batchObj, lang.name);
        Object.assign(translations, result);

        // Small delay between batches
        if (b + batchSize < keys.length) {
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), "utf-8");
      console.log(`    ✓ Saved ${Object.keys(translations).length} translations to ${lang.code}.json`);
    } catch (err) {
      console.error(`    ✗ FAILED: ${err.message}`);
    }

    // Small delay between languages
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log("\nDone! All translations generated.");
}

main().catch(console.error);
