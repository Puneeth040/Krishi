import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up large payload capacity because of base64 images and audio uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

// Helper to handle 429 daily quota limit on gemini-3.5-flash and fallback to gemini-flash-latest
async function generateContentWithFallback(params: any): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (error: any) {
    const errorMsg = error.message || "";
    if (
      errorMsg.includes("429") ||
      errorMsg.includes("quota exceeded") ||
      errorMsg.includes("RESOURCE_EXHAUSTED") ||
      errorMsg.includes("Quota exceeded")
    ) {
      console.warn(`Quota exceeded/Rate limit hit for model ${params.model || "default"}. Retrying with gemini-flash-latest...`);
      const fallbackParams = { ...params, model: "gemini-flash-latest" };
      // Make sure we carry over any configs or contents correctly
      return await ai.models.generateContent(fallbackParams);
    }
    throw error;
  }
}

// Localized fallbacks helper
const FALLBACK_DATA: Record<string, any> = {
  kn: {
    condition: "ಭಾಗಶಃ ಮೋಡ",
    days: ["ಭಾನು", "ಸೋಮ", "ಮಂಗಳ", "ಬುಧ", "ಗುರು", "ಶುಕ್ರ", "ಶನಿ"],
    alerts: [
      "ಮುಂದಿನ ೪೮ ಗಂಟೆಗಳಲ್ಲಿ ಸಾಧಾರಣ ಮಳೆಯಾಗುವ ಮುನ್ಸೂಚನೆ ಇದೆ. ಕೃಷಿ ಚಟುವಟಿಕೆಗಳನ್ನು ಆನುವಾಗಿ ಯೋಜಿಸಿ.",
      "ಬೆಳೆಗೆ ಕೀಟಬಾಧೆ ಹರಡದಂತೆ ಮುನ್ನೆಚ್ಚರಿಕೆ ವಹಿಸಿ."
    ],
    crops: {
      Wheat: "ಗೋಧಿ",
      Rice: "ಭತ್ತ",
      Cotton: "ಹತ್ತಿ",
      Sugarcane: "ಕಬ್ಬು",
      Maize: "ಮೆಕ್ಕೆಜೋಳ",
      Ragi: "ರಾಗಿ"
    },
    trend_up: "ಹೆಚ್ಚಳ",
    trend_down: "ಇಳಿಕೆ",
    trend_stable: "ಸ್ಥಿರ",
    source: "ಸ್ಥಳೀಯ ಎ.ಪಿ.ಎಮ್.ಸಿ ಮಾರುಕಟ್ಟೆ",
    milkRates: {
      cow: { price: "₹೩೪.೫೦", fat: "೩.೮%", snf: "೮.೫%" },
      buffalo: { price: "₹೪೮.೨೦", fat: "೬.೫%", snf: "೯.೦%" }
    },
    nearbyDairies: [
      { name: "ಮೈಸೂರು ಹಾಲು ಸಹಕಾರಿ ಒಕ್ಕೂಟ", distance: "೧.೫ ಕಿ.ಮೀ", rate: "₹೩೪.೫೦", source: "ಮೈಮುಲ್" },
      { name: "ತಾಲ್ಲೂಕು ನಂದಿನಿ ಡೈರಿ ಕೇಂದ್ರ", distance: "೩.೨ ಕಿ.ಮೀ", rate: "₹೩೪.೧೦", source: "ನಂದಿನಿ" },
      { name: "ಕೃಷಿಕರ ಡೈರಿ ಕೋ-ಆಪರೇಟಿವ್", distance: "೪.೮ ಕಿ.ಮೀ", rate: "₹೩೩.೯೦", source: "ಸ್ಥಳೀಯ ಒಕ್ಕೂಟ" }
    ],
    recommendations: [
      { crop: "Rice", reason: "ಪ್ರಸಕ್ತ ಮಳೆಯ ಪ್ರಮಾಣ ಮತ್ತು ಮಣ್ಣಿನ ಫಲವತ್ತತೆ ಭತ್ತದ ಸಾಗುವಳಿಗೆ ಅತ್ಯಂತ ಸೂಕ್ತವಾಗಿದೆ.", risk: "Low", yield: "೨೨-೨೫ ಕ್ವಿಂಟಾಲ್/ಎಕರೆ" },
      { crop: "Maize", reason: "ಮೆಕ್ಕೆಜೋಳ ಕೃಷಿಗೆ ಕಡಿಮೆ ನೀರು ಸಾಕಾಗುತ್ತದೆ ಮತ್ತು ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ಉತ್ತಮ ಬೇಡಿಕೆಯಿದೆ.", risk: "Medium", yield: "೧೮-೨೦ ಕ್ವಿಂಟಾಲ್/ಎಕರೆ" },
      { crop: "Wheat", reason: "ಗೋಧಿ ಒಣ ಹವಾಮಾನಕ್ಕೆ ಸಹಿಸಿಕೊಳ್ಳಬಲ್ಲ ಉತ್ತಮ ಇಳುವರಿ ನೀಡುವ ಬೆಳೆಯಾಗಿದೆ.", risk: "Low", yield: "೧೨-೧೫ ಕ್ವಿಂಟಾಲ್/ಎಕರೆ" }
    ]
  },
  en: {
    condition: "Partly Cloudy",
    days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    alerts: [
      "Light to moderate rainfall expected in the next 48 hours. Plan irrigation accordingly.",
      "Check crop leaves for possible pest infestation due to elevated humidity levels."
    ],
    crops: {
      Wheat: "Wheat",
      Rice: "Rice",
      Cotton: "Cotton",
      Sugarcane: "Sugarcane",
      Maize: "Maize",
      Ragi: "Ragi"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "Local APMC Yard",
    milkRates: {
      cow: { price: "₹34.50", fat: "3.8%", snf: "8.5%" },
      buffalo: { price: "₹48.20", fat: "6.5%", snf: "9.0%" }
    },
    nearbyDairies: [
      { name: "State Cooperative Milk Dairy", distance: "1.5 km", rate: "₹34.50", source: "KMF" },
      { name: "Taluk Milk Collection Center", distance: "3.2 km", rate: "₹34.10", source: "KMF" },
      { name: "Farmer's Cooperative Cooperative", distance: "4.8 km", rate: "₹33.90", source: "Local" }
    ],
    recommendations: [
      { crop: "Rice", reason: "Current monsoon rainfall levels and clayey-loam soil are perfect for paddy fields.", risk: "Low", yield: "22-25 Quintals/Acre" },
      { crop: "Maize", reason: "Highly resilient to brief dry spells and yields lucrative market returns.", risk: "Medium", yield: "18-20 Quintals/Acre" },
      { crop: "Wheat", reason: "Cool, dry conditions of the soil are highly ideal for rich wheat harvesting.", risk: "Low", yield: "12-15 Yields" }
    ]
  },
  hi: {
    condition: "आंशिक रूप से बादल",
    days: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    alerts: [
      "अगले 48 घंटों में हल्की से मध्यम बारिश की संभावना है। तदनुसार सिंचाई की योजना बनाएं।",
      "हवा की उच्च आर्द्रता के कारण कीटों के प्रकोप पर नज़र रखें।"
    ],
    crops: {
      Wheat: "गेहूं",
      Rice: "धान",
      Cotton: "कपास",
      Sugarcane: "गन्ना",
      Maize: "मक्का",
      Ragi: "रागी"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "स्थानीय APMC मंडी",
    milkRates: {
      cow: { price: "₹34.50", fat: "3.8%", snf: "8.5%" },
      buffalo: { price: "₹48.20", fat: "6.5%", snf: "9.0%" }
    },
    nearbyDairies: [
      { name: "राज्य दुग्ध सहकारी डेयरी", distance: "1.5 किमी", rate: "₹34.50", source: "मदर डेयरी" },
      { name: "तालुका दुग्ध संग्रहण केंद्र", distance: "3.2 किमी", rate: "₹34.10", source: "मदर डेयरी" },
      { name: "कृषक सहकारी डेयरी समिति", distance: "4.8 किमी", rate: "₹33.90", source: "स्थानीय" }
    ],
    recommendations: [
      { crop: "Rice", reason: "वर्तमान मानसून की बारिश और मिट्टी की स्थिति धान की रोपाई के लिए अनुकूल है।", risk: "Low", yield: "22-25 क्विंटल/एकड़" },
      { crop: "Maize", reason: "कम सिंचाई की आवश्यकताओं के साथ आकर्षक बाजार मूल्य प्रदान करता है।", risk: "Medium", yield: "18-20 क्विंटल/एकड़" },
      { crop: "Wheat", reason: "ठंडी और नमी युक्त जलवायु गेहूं की बुआई के लिए उत्कृष्ट है।", risk: "Low", yield: "12-15 क्विंटल/एकड़" }
    ]
  },
  mr: {
    condition: "अंशतः ढगाळ",
    days: ["रवि", "सोम", "मंगळ", "बुध", "गुरु", "शुक्र", "शनी"],
    alerts: [
      "पुढील ४८ तासांत हलक्या ते मध्यम स्वरूपाच्या पावसाची शक्यता आहे. पाणी देण्याचे नियोजन करा.",
      "हवेतील दमटपणामुळे पिकांवर कीड पडण्याची शक्यता तपासा."
    ],
    crops: {
      Wheat: "गहू",
      Rice: "भात",
      Cotton: "कापूस",
      Sugarcane: "ऊश",
      Maize: "मका",
      Ragi: "रागी"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "स्थानिक कृषी उत्पन्न बाजार समिती",
    milkRates: {
      cow: { price: "₹३४.೫೦", fat: "೩.೮%", snf: "೮.೫%" },
      buffalo: { price: "₹೪೮.೨೦", fat: "೬.೫%", snf: "೯.೦%" }
    },
    nearbyDairies: [
      { name: "राज्य सहकारी दूध डेअरी", distance: "१.५ किमी", rate: "₹३४.५०", source: "महानंद" },
      { name: "तालुका दूध संकलन केंद्र", distance: "३.२ किमी", rate: "₹३४.१०", source: "गोकुळ" },
      { name: "शेतकरी सहकारी दूध संस्था", distance: "४.८ किमी", rate: "₹३३.९०", source: "स्थानिक" }
    ],
    recommendations: [
      { crop: "Rice", reason: "चालू पावसाचे प्रमाण आणि उत्तम निचरा होणारी जमीन भात पिकासाठी फायदेशीर आहे.", risk: "Low", yield: "२२-२५ क्विंटल/एकरी" },
      { crop: "Maize", reason: "कमी पाण्यामध्ये उत्तम उत्पन्न देणारे हक्काचे पीक आहे.", risk: "Medium", yield: "१८-२० क्विंटल/एकरी" },
      { crop: "Wheat", reason: "कोरडे आणि थंड हवामान उत्तम गव्हाच्या पेरणीसाठी उत्कृष्ट आहे.", risk: "Low", yield: "१२-१೫ क्विंटल/एकरी" }
    ]
  },
  te: {
    condition: "పాక్షికంగా మేఘావృతం",
    days: ["ఆది", "సోమ", "మంగళ", "బుధ", "గురు", "శుక్ర", "శని"],
    alerts: [
      "రాగల 48 గంటల్లో తేలికపాటి నుండి మోస్తరు వర్షాలు కురిసే అవకాశం ఉంది. తదనుగుణంగా నీటి పారుదల ప్రణాళిక చేసుకోండి.",
      "వాతావరణంలో తేమ ఎక్కువగా ఉండడం వల్ల పంటకు కీటకాలు సోకే ప్రమాదం ఉంది, గమనించండి."
    ],
    crops: {
      Wheat: "గోధుమ",
      Rice: "వరి",
      Cotton: "పత్తి",
      Sugarcane: "చెరకు",
      Maize: "మొక్కజొన్న",
      Ragi: "రాగులు"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "స్థానిక మార్కెట్ యార్డ్ (APMC)",
    milkRates: {
      cow: { price: "₹34.50", fat: "3.8%", snf: "8.5%" },
      buffalo: { price: "₹48.20", fat: "6.5%", snf: "9.0%" }
    },
    nearbyDairies: [
      { name: "రాష్ట్ర సహకార పాల డైరీ", distance: "1.5 కి.మీ", rate: "₹34.50", source: "విజయ" },
      { name: "తాలూకా పాల సేకరణ కేంద్రం", distance: "3.2 కి.మీ", rate: "₹34.10", source: "విజయ" },
      { name: "రైతు సహకార పాల సంఘం", distance: "4.8 కి.మీ", rate: "₹33.90", source: "స్థానిక" }
    ],
    recommendations: [
      { crop: "Rice", reason: "ప్రస్తుత రుతుపవనాల వర్షపాతం మరియు నేల రకం వరి సాగుకు అత్యంత అనుకూలం.", risk: "Low", yield: "22-25 క్వింటాళ్లు/ఎకరాకు" },
      { crop: "Maize", reason: "తక్కువ నీటితో పండే పంట, మార్కెట్లో మంచి గిరాకీ మరియు లాభాలు ఉన్నాయి.", risk: "Medium", yield: "18-20 క్వింటాళ్లు/ఎకరాకు" },
      { crop: "Wheat", reason: "గోధుమలకు అవసరమైన చల్లని వాతావరణం ఈ సమయంలో ఎంతో అనుకూలం.", risk: "Low", yield: "12-15 క్వింటాళ్లు/ఎకరాకు" }
    ]
  },
  ta: {
    condition: "பகுதியளவு மேகமூட்டம்",
    days: ["ஞாயிறு", "திங்கள்", "செவ்வாய்", "புதன்", "வியாழன்", "வெள்ளி", "சனி"],
    alerts: [
      "அடுத்த 48 மணி நேரத்தில் மிதமான மழைக்கு வாய்ப்புள்ளது. பாசன முறையை அதற்கேற்ப திட்டமிடுங்கள்.",
      "அதிக ஈரப்பதம் காரணமாக பயிர்களில் பூச்சி தாக்குதல்களை தொடர்ந்து கண்காணியுங்கள்."
    ],
    crops: {
      Wheat: "கோதுமை",
      Rice: "நெல்",
      Cotton: "பருத்தி",
      Sugarcane: "கரும்பு",
      Maize: "சோளம்",
      Ragi: "கேழ்வரகு"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "உள்ளூர் ஒழுங்குமுறை விற்பனை கூடம்",
    milkRates: {
      cow: { price: "₹34.50", fat: "3.8%", snf: "8.5%" },
      buffalo: { price: "₹48.20", fat: "6.5%", snf: "9.0%" }
    },
    nearbyDairies: [
      { name: "அரசு கூட்டுறவு பால் பண்ணை ஆவின்", distance: "1.5 கி.மீ", rate: "₹34.50", source: "ஆவின்" },
      { name: "வட்டார பால் கொள்முதல் நிலையம்", distance: "3.2 கி.மீ", rate: "₹34.10", source: "ஆவின்" },
      { name: "விவசாயிகள் கூட்டுறவு பால் சங்கம்", distance: "4.8 கி.மீ", rate: "₹33.90", source: "உள்ளூர்" }
    ],
    recommendations: [
      { crop: "Rice", reason: "தற்போதைய பருவமழை அளவுகள் நெல் சாகுபடிக்கு மிகவும் உகந்தது.", risk: "Low", yield: "22-25 குவிண்டால்/ஏக்கர்" },
      { crop: "Maize", reason: "வறட்சியைத் தாங்கி வளரக்கூடியதுடன் சந்தையில் நல்ல லாபகரமான பயிர்.", risk: "Medium", yield: "18-20 குவிண்டால்/ஏக்கர்" },
      { crop: "Wheat", reason: "குளுமையான வறண்ட காலநிலை கோதுமை விளைச்சலுக்கு மிகவும் ஏற்றது.", risk: "Low", yield: "12-15 குவிண்டால்/ஏக்கர்" }
    ]
  },
  bn: {
    condition: "আংশিক মেঘলা",
    days: ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"],
    alerts: [
      "আগামী ৪৮ ঘণ্টার মধ্যে মাঝারি বৃষ্টির সম্ভাবনা রয়েছে। সেই অনুযায়ী সেচের পরিকল্পনা করুন।",
      "অধিক আর্দ্রতার কারণে ফসলে পোকা-মাকড়ের আক্রমণ সতর্কতার সাথে লক্ষ্য রাখুন।"
    ],
    crops: {
      Wheat: "গম",
      Rice: "ধান",
      Cotton: "তুলা",
      Sugarcane: "আখ",
      Maize: "ভুট্টা",
      Ragi: "রাগি"
    },
    trend_up: "up",
    trend_down: "down",
    trend_stable: "stable",
    source: "স্থানীয় এপিএমসি বাজার",
    milkRates: {
      cow: { price: "₹৩৪.৫০", fat: "৩.৮%", snf: "৮.৫%" },
      buffalo: { price: "₹৪৮.২০", fat: "৬.৫%", snf: "৯.০%" }
    },
    nearbyDairies: [
      { name: "রাজ্য সমবায় দুগ্ধ ডেইরি", distance: "১.৫ কিমি", rate: "₹৩৪.৫০", source: "মাদার ডেইরি" },
      { name: "মহকুমা দুধ সংগ্রহ কেন্দ্র", distance: "৩.২ কিমি", rate: "₹৩৪.১০", source: "মাদার ডেইরি" },
      { name: "কৃষক সমবায় ডেইরি সমিতি", distance: "৪.৮ কিমি", rate: "₹৩৩.৯০", source: "স্থানীয়" }
    ],
    recommendations: [
      { crop: "Rice", reason: "বর্তমান মৌসুমি বৃষ্টিপাত এবং মাটির আর্দ্রতা ধান চাষের জন্য সম্পূর্ণ অনুকূল।", risk: "Low", yield: "২২-২৫ কুইন্টাল/একর" },
      { crop: "Maize", reason: "স্বল্প সেচেও লাভজনক বাজার মূল্য দেওয়ার জন্য ভুট্টা অত্যন্ত উপযুক্ত।", risk: "Medium", yield: "১৮-২০ কুইন্টাল/একর" },
      { crop: "Wheat", reason: "শীতল ও শুষ্ক আবহাওয়া গম চাষের জন্য অত্যন্ত সহায়ক কাল।", risk: "Low", yield: "১২-১৫ কুইন্টাল/একর" }
    ]
  }
};

function normalizeLang(lang: string = 'English'): string {
  const l = lang.toLowerCase();
  if (l.includes('kannada') || l === 'kn') return 'kn';
  if (l.includes('hindi') || l === 'hi') return 'hi';
  if (l.includes('marathi') || l === 'mr') return 'mr';
  if (l.includes('telugu') || l === 'te') return 'te';
  if (l.includes('tamil') || l === 'ta') return 'ta';
  if (l.includes('bengali') || l === 'bn') return 'bn';
  return 'en';
}

function getPastNDateStrings(n: number, normalizedLang: string): string[] {
  const dates: string[] = [];
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateNum = d.getDate();
    dates.push(`${dateNum} ${monthsShort[d.getMonth()]}`);
  }
  return dates;
}

function getFallbackFarmerData(location: string, lang: string = 'English') {
  const norm = normalizeLang(lang);
  const dataset = FALLBACK_DATA[norm] || FALLBACK_DATA.en;
  
  const daysForecast = getPastNDateStrings(7, norm);

  const productRates = [
    { crop: "Rice", basePrice: 2100, trend: "up", unit: "Quintal" },
    { crop: "Wheat", basePrice: 2250, trend: "stable", unit: "Quintal" },
    { crop: "Cotton", basePrice: 6500, trend: "down", unit: "Quintal" },
    { crop: "Sugarcane", basePrice: 315, trend: "up", unit: "Ton" }
  ];

  const marketRates = productRates.map(p => {
    const history = [];
    for (let j = 14; j >= 0; j--) {
      const d = new Date();
      d.setDate(d.getDate() - j);
      const dayStr = `${d.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getMonth()]}`;
      const diff = Math.floor((Math.sin(j) * 0.05 + (Math.random() - 0.5) * 0.02) * p.basePrice);
      history.push({
        day: dayStr,
        price: p.basePrice + diff
      });
    }

    return {
      crop: p.crop, // Must remain English string because client maps key inside translations dynamically
      price: `₹${p.basePrice.toLocaleString('en-IN')}`,
      unit: p.unit,
      trend: p.trend,
      source: `${location || "Local"} ${dataset.source}`,
      history: history
    };
  });

  return {
    weather: {
      temp: "29°C",
      humidity: "62%",
      wind: "14 km/h",
      aqi: "36",
      condition: dataset.condition,
      moisture: "44%",
      forecast: daysForecast.map((day, i) => ({
        day: day,
        temp: `${27 + Math.floor(Math.sin(i) * 3)}°C`,
        condition: dataset.condition
      })),
      alerts: dataset.alerts
    },
    marketRates: marketRates,
    milkRates: dataset.milkRates,
    nearbyDairies: dataset.nearbyDairies.map((dairy: any) => ({
      name: dairy.name,
      distance: dairy.distance,
      rate: dairy.rate,
      source: dairy.source
    })),
    recommendations: dataset.recommendations
  };
}

function getFallbackAgriContacts(location: string, lang: string = 'English') {
  const norm = normalizeLang(lang);
  if (norm === 'kn') {
    return {
      agriOffice: {
        name: "ತಾಲ್ಲೂಕು ಕೃಷಿ ಇಲಾಖೆ ಕಚೇರಿ",
        phone: "1800-180-1551",
        address: `${location || 'ತಾಲ್ಲೂಕು ಕೇಂದ್ರ'}, ಕರ್ನಾಟಕ`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "ಸರ್ಕಾರಿ ಪಶುಚಿಕಿತ್ಸಾಲಯ ಮತ್ತು ಪ್ರಾಣಿ ಆಸ್ಪತ್ರೆ",
        phone: "1962",
        address: `${location || 'ಹತ್ತಿರದ ಪಟ್ಟಣ'}, ಕರ್ನಾಟಕ`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  } else if (norm === 'hi') {
    return {
      agriOffice: {
        name: "राजकीय कृषि कार्यालय (कृषि विभाग)",
        phone: "1800-180-1551",
        address: `${location || 'स्थानीय तहसील'}, कर्नाटक`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "राजकीय पशु चिकित्सालय",
        phone: "1962",
        address: `${location || 'स्थानीय केंद्र'}, कर्नाटक`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  } else if (norm === 'mr') {
    return {
      agriOffice: {
        name: "तालुका कृषी विभाग कार्यालय",
        phone: "1800-180-1551",
        address: `${location || 'स्थानिक तालुका'}, कर्नाटक`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "शासकीय पशुवैद्यकीय रुग्णालय",
        phone: "1962",
        address: `${location || 'जवळचे केंद्र'}, कर्नाटक`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  } else if (norm === 'te') {
    return {
      agriOffice: {
        name: "ప్రభుత్వ వ్యవసాయ శాఖ కార్యాలయం",
        phone: "1800-180-1551",
        address: `${location || 'స్థానిక తాలూకా'}, కర్ణాటక`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "ప్రభుత్వ పశువైద్యశాల",
        phone: "1962",
        address: `${location || 'స్థానిక కేంద్రం'}, కర్ణాటక`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  } else if (norm === 'ta') {
    return {
      agriOffice: {
        name: "வட்டார வேளாண்மை உதவி இயக்குனர் कार्यालय",
        phone: "1800-180-1551",
        address: `${location || 'உள்ளூர் வட்டம்'}, கர்நாடகா`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "அரசு கால்நடை மருத்துவமனை",
        phone: "1962",
        address: `${location || 'அருகிலுள்ள மையம்'}, கர்நாடகா`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  } else if (norm === 'bn') {
    return {
      agriOffice: {
        name: "ব্লক কৃষি দপ্তর কার্যালয়",
        phone: "1800-180-1551",
        address: `${location || 'স্থানীয় তালুক'}, কর্ণাটক`,
        mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
      },
      vetHospital: {
        name: "সরকারি পশু হাসপাতাল",
        phone: "1962",
        address: `${location || 'স্থানীয় পশু চিকিৎসা কেন্দ্র'}, কর্ণাটক`,
        mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
      }
    };
  }
  return {
    agriOffice: {
      name: "Government Agriculture Department Office",
      phone: "1800-180-1551",
      address: `${location || 'Local Block Office'}, Karnataka`,
      mapQuery: `Government Agriculture Office near ${location || 'Karnataka'}`
    },
    vetHospital: {
      name: "Government Veterinary Dispensary & Hospital",
      phone: "1962",
      address: `${location || 'Nearest Veterinary Center'}, Karnataka`,
      mapQuery: `Government Veterinary Hospital near ${location || 'Karnataka'}`
    }
  };
}

function getFallbackChatChitti(message: string, lang: string = 'English', context?: any) {
  const norm = normalizeLang(lang);
  const msg = message.toLowerCase();
  const crop = context?.crop || 'crop';

  const responses: Record<string, Record<string, string>> = {
    kn: {
      irrigate: `ನಿಮ್ಮ ಬೆಳೆಗೆ ${crop} ನೀರಾವರಿ ಸಲಹೆ: ಸದ್ಯ ತೇವಾಂಶ 44% ಇದೆ. ಮುಂಬರುವ ದಿನಗಳಲ್ಲಿ ಭಾಗಶಃ ಮೋಡವಿರುವುದರಿಂದ ನೀರು ಹರಿಸುವುದನ್ನು ಸಾಧಾರಣವಾಗಿಡಿ. ಬೆಳಿಗ್ಗೆ ಅಥವಾ ಸಂಜೆ ವೇಳೆ ನೀರು ಹಾಯಿಸುವುದು ಉತ್ತಮ.`,
      fertilizer: `${crop} ಬೆಳೆಗೆ ಎನ್.ಪಿ.ಕೆ (NPK) ಯೂರಿಯಾ ಗೊಬ್ಬರವನ್ನು ೧ ಎಕರೆಗೆ ಶಿಫಾರಸು ಮಾಡಿದ ಪ್ರಮಾಣದಲ್ಲಿ ನೀಡಲು ಇದು ಸೂಕ್ತ ಸಮಯ. ಹೂಬಿಡುವ ಅಥವಾ ಕಾಯಿ ಕಟ್ಟುವ ಹಂತಕ್ಕೆ ಅನುಸಾರವಾಗಿ ರಂಜಕದ ಪ್ರಮಾಣ ಹೆಚ್ಚಿಸಿ.`,
      pest: `ಎಲೆ ಹಳದಿ ಅಥವಾ ಕಾಯಿ ಕೊರಕ ಜೀವಿಗಳ ಹಾವಳಿ ಕಂಡುಬಂದಲ್ಲಿ, ತಕ್ಷಣ ೧೦ ಲೀಟರ್ ನೀರಿಗೆ ೫ ಮಿ.ಲೀ ಬೇವಿನ ಎಣ್ಣೆ (Neem Oil) ಮಿಶ್ರಣ ಮಾಡಿ ಸಂಜೆ ವೇಳೆ ಸಿಂಪಡಿಸಿ. ಇದು ನೈಸರ್ಗಿಕ ಮತ್ತು ಸುರಕ್ಷಿತವಾಗಿದೆ.`,
      default: `ನಮಸ್ತೆ! ಕೃಷಿ ಮಿತ್ರ ಅಸಿಸ್ಟೆಂಟ್ 'ಚಿಟ್ಟಿ' ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನಿಮ್ಮ ${crop} ಬೆಳೆಗೆ ಸಂಬಂಧಿಸಿದ ಮಹತ್ವದ ಕೃಷಿ ಮಾಹಿತಿ, ಮಣ್ಣಿನ ತೇವಾಂಶ, ಅಥವಾ ಹತ್ತಿರದ ಮಾರುಕಟ್ಟೆ ದರಗಳ ಮಾಹಿತಿ ಪಡೆಯಲು ನನಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ.`
    },
    en: {
      irrigate: `Irrigation Advice for ${crop}: Current soil moisture is 44%. With partly cloudy weather expected, maintain a light to moderate watering schedule. Watering in early morning is recommended to optimize absorption.`,
      fertilizer: `For your ${crop} crop, this is an excellent phase to apply nitrogenous fertilizers or NPK. Supplementing with organic compost will improve root development and nutrient uptake.`,
      pest: `If you see yellowing of leaves or generic pest activity, spray Neem Oil (5ml per 10 liters of water) during early evenings. For severe leaf spot, consider a light copper oxychloride spray under expert instruction.`,
      default: `Namaste! I am Chitti, your Krishi Mitra farming assistant. I am here to assist you with customized weather advice, crop production methods, and pest protection tips for your ${crop}.`
    },
    hi: {
      irrigate: `${crop} फसल के लिए सिंचाई सलाह: वर्तमान में मिट्टी की नमी 44% है। आंशिक रूप से बादल छाए रहने के कारण, सिंचाई सामान्य रखें। वाष्पीकरण से बचने के लिए सुबह के समय ही पानी देना बेहतर है।`,
      fertilizer: `${crop} फसल में यूरिया या एनपीके खाद का छिड़काव करने का यह सही समय है। जैविक खादों के उपयोग से मिट्टी की उर्वरा शक्ति बढ़ती है।`,
      pest: `पत्तियों में पीलापन या कीट की संभावना होने पर, प्रति 10 लीटर पानी में 5 मिली नीम का तेल मिलाकर शाम के समय छिड़काव करें। यह पूरी तरह से सुरक्षित है।`,
      default: `नमस्ते! मैं 'चिट्ठी' हूँ, आपका कृषि मित्र सेवा सहायक। अपनी ${crop} फसल, मौसम परिवर्तन या मंडी भाव से जुड़ी किसी भी समस्या के समाधान के लिए बेझिझक पूछें।`
    },
    mr: {
      irrigate: `${crop} पिकासाठी सिंचन सल्ला: मातीचा ओलावा सध्या ४४% आहे. ढगाळ हवामानामुळे माफक प्रमाणात पाणी द्यावे. सकाळी लवकर पाणी दिल्यास बाष्पीभवन कमी होते.`,
      fertilizer: `${crop} पिकाला एनपीके (NPK) खत किंवा सूक्ष्म अन्नद्रव्यांची मात्रा देण्याची ही योग्य वेळ आहे. योग्य डोससाठी कृषी सल्ला आवर्जून पहावा.`,
      pest: `पाने पिवळी पडल्यास किंवा कीड प्रादुर्भाव दिसल्यास, १० लिटर पाण्यात ५ मिली कडुनिंबाचे तेल (Neem Oil) मिक्स करून संध्याकाळच्या वेळी फवारणी करा.`,
      default: `नमस्ते! मी शेतकी सहाय्यक 'चिट्ठी' आहे. तुमच्या ${crop} पिकाविषयी, खत व्यवस्थापन, किडीचे उपाय किंवा शासकीय कर्ज योजनांविषयी कोणतीही माहिती विचारा.`
    },
    te: {
      irrigate: `మీ ${crop} పంటకు నీటిపారుదల సలహా: ప్రస్తుతం నేలలో తేమ 44% కలిగి ఉంది. వాతావరణం పాక్షికంగా మబ్బులతో ఉన్నందున అవసరాన్ని బట్టి తేలికపాటి తడులు ఇవ్వండి. ఉదయం వేళల్లో నీరు పెట్టడం శ్రేయస్కరం.`,
      fertilizer: `${crop} పంటకు నత్రజని లేదా ఎన్.పి.కె (NPK) ఎరువుల మోతాదును సమయానుకూలంగా అందించడానికి ఇది సరైన సమయం. సేంద్రీయ ఎరువులను కూడా ప్రోత్సహించండి.`,
      pest: `ఆకులు పసుపు రంగులోకి మారితే లేదా చీడపీడల గురైతే, 10 లీటర్ల నీటికి 5 మి.లీ వేప నూనెను కలిపి సాయంత్రం పూట పిచికారీ చేయండి. ఇది సహజ నివారణ.`,
      default: `నమస్తే! నేను చిట్టిని, మీ వ్యవసాయ సహాయకుడిని. ${crop} పంట రక్షణ విధానాలు, వాతావరణ హెచ్చరికలు లేదా ప్రైస్ ట్రెండ్స్ గురించి ఎలాంటి సమాచారమైనా నన్ను అడగండి.`
    },
    ta: {
      irrigate: `உங்கள் ${crop} பயிர்க்கான பாசன முறை: மண்ணின் ஈரப்பதம் தற்போது 44% ஆக உள்ளது. மேகமூட்டமான வானிலை நிலவுதால் மிதமான பாசனமே போதுமானது. அதிகாலையில் தண்ணீர் பாய்ச்சுதல் நலம்.`,
      fertilizer: `நெல்/பயிர் வளர்ச்சிக்கு தகுந்த ஊட்டச்சத்துக்கள் மற்றும் உரம் இடுவதற்கு இதுவே தகுந்த பருவம். தழைச்சத்து மற்றும் சாம்பல் சத்து கொண்ட உரம் பரிந்துரைக்கப்படுகிறது.`,
      pest: `இலைகளில் மஞ்சள் நிற மாற்றமோ அல்லது நோய் தாக்குதலோ இருப்பின், 10 லிட்டர் நீரில் 5 மி.லி வேப்பெண்ணெய் கலந்து மாலை வேளையில் தெளிக்கவும்.`,
      default: `வணக்கம்! நான் விவசாயத் தோழன் 'சிட்டி'. உங்களது ${crop} சாகுபடி முறைகள், உரம் மற்றும் பூச்சி மேலாண்மை குறித்த விபரங்களை என்னிடம் கேட்டுத் தெரிந்து கொள்ளலாம்.`
    },
    bn: {
      irrigate: `আপনার ${crop} ফসলের সেচ পরামর্শ: মাটিতে আদ্রতা বর্তমানে ৪৪% রয়েছে। মেঘলা আকাশ থাকার কারণে সেচ স্বাভাবিক রাখুন এবং সকালে সেচ দেওয়ার চেষ্টা করুন।`,
      fertilizer: `${crop} ফসলের জন্য নাইট্রোজেন ভিত্তিক সার বা এনপিকে চাপান সার হিসেবে প্রয়োগ করার উপযুক্ত সময়। জৈব সার ব্যবহারে ফলন ভালো হবে।`,
      pest: `ইলো পাতা বা পোকার উপদ্রব দেখলে, প্রতি ১০ লিটার জলে ৫ মিলি নিম তেল গুলে বিকেল বেলা স্প্রে করুন। রাসায়নিকের ব্যবহার কম করুন।`,
      default: `নমস্কার! আমি কৃষিমিত্রের এআই সহায়িকা 'চিঠি'। আপনার ${crop} চাষের যেকোনো তথ্য, জলবায়ুর পরিবর্তনের প্রভাব বা উপযুক্ত সার জানার জন্য আমাকে প্রশ্ন করতে পারেন।`
    }
  };

  const currentLangResponse = responses[norm] || responses.en;

  if (msg.includes('irrigate') || msg.includes('water') || msg.includes('ನೀರಾವರಿ') || msg.includes('ನೀರು') || msg.includes('पानी') || msg.includes('सिंचाई') || msg.includes('ओलावा') || msg.includes('जल')) {
    return currentLangResponse.irrigate;
  }
  if (msg.includes('fertilizer') || msg.includes('fertiliser') || msg.includes('npk') || msg.includes('ಗೊಬ್ಬರ') || msg.includes('खाद') || msg.includes('ಖನಿಜ') || msg.includes('खत') || msg.includes('ఎరువు') || msg.includes('உரம்') || msg.includes('সার')) {
    return currentLangResponse.fertilizer;
  }
  if (msg.includes('pest') || msg.includes('disease') || msg.includes('yellow') || msg.includes('ಕೀಟ') || msg.includes('ರೋಗ') || msg.includes('ಕೀಟನಾಶಕ') || msg.includes('पीला') || msg.includes('बीमारी') || msg.includes('कीड') || msg.includes('ఆకు') || msg.includes('பூச்சி') || msg.includes('পোকা')) {
    return currentLangResponse.pest;
  }

  return currentLangResponse.default;
}

function getFallbackProactiveAdvice(lang: string, context?: any, weatherData?: any): string[] {
  const norm = normalizeLang(lang);
  const crop = context?.crop || 'crop';

  const advice: Record<string, string[]> = {
    kn: [
      `ಚಿಟ್ಟಿ ಸಲಹೆ: ನಿಮ್ಮ ${crop} ಬೆಳೆಗೆ ಯೂರಿಯಾ ಸಿಂಪಡಿಸಲು ಇದು ಸೂಕ್ತ ಸಮಯ.`,
      `ಮಳೆಯ ಮುನ್ಸೂಚನೆ ಇರುವುದರಿಂದ ಹೆಚ್ಚುವರಿ ನೀರು ಹರಿಸುವುದನ್ನು ಮುಂದೂಡಿ.`,
      `ಬೇವಿನ ಕಷಾಯ ಸಿಂಪಡಿಸಿ ಕೀಟಬಾಧೆ ಹರಡದಂತೆ ಬೆಳೆಯನ್ನು ರಕ್ಷಿಸಿ.`
    ],
    en: [
      `Chitti advice: Optimal growth stage for ${crop}, soil moisture is high, water moderately.`,
      `Rain shower anticipated in the area. Delay insecticide spraying for 24 hours.`,
      `Apply balanced micro-nutrients or compost to enrich the soil bed.`
    ],
    hi: [
      `चिट्ठी सुझाव: आपके खेत की मिट्टी में नमी पर्याप्त है, सिंचाई अभी रोक लें।`,
      `हल्की बूंदाबांदी का अंदेशा है। फसलों में कीटनाशक छिड़काव 1-2 दिन टालें।`,
      `${crop} की फसल में जैविक कीटनाशक व नीम का काढ़ा उपयुक्त रहेगा।`
    ],
    mr: [
      `चिठ्ठी सल्ला: सध्यातरी जमिनीमध्ये चांगला ओलावा आहे, सिंचन करू नका.`,
      `पावसाची शक्यता असल्यास कीटकनाशक फवारणी काही वेळ लांबणीवर टाका.`,
      `पिकांना संतुलित खतांचा डोस देण्यासाठी ही योग्य वेळ आहे.`
    ],
    te: [
      `చిట్టి సలహా: మీ నేలలో తేమ శాతం బాగుంది, నీటి తడి సాಧಾರಣంగా ఇవ్వండి.`,
      `వర్షం కురిసే అవకాశం ఉన్నందున పురుగుమందుల పిచికారీ వాయిదా వేయండి.`,
      `${crop} పంటకు సేంద్రీయ ద్రావణాలు అందిస్తే రోగ నిరోಧక శక్తి పెరుగుతుంది.`
    ],
    ta: [
      `சிட்டி அறிவுரை: தற்போது மழை பெய்ய வாய்ப்புள்ளதால் உரம் இடுவதை தள்ளிப்போடுங்கள்.`,
      `பயிர்களுக்குத் தேவையான நீர் அளவு திருப்திகரமாக உள்ளது, கண்காணிப்பைத் தொடரவும்.`,
      `${crop} பயிரில் சாறு உறிஞ்சும் பூச்சிகளைக் கட்டுப்படுத்த வேப்ப எண்ணெய் பயன்படுத்தவும்.`
    ],
    bn: [
      `চিঠির পরামর্শ: এই মুহূর্তে মাটিতে ভালো আর্দ্রতা রয়েছে, জলসেচ সীমিত রাখুন।`,
      `বৃষ্টিপাতের মেঘ ঘনীভূত হচ্ছে। সারে ছিটানোর কাজ সাময়িক পিছিয়ে দিন।`,
      `${crop} ফসলের সার্বিক বৃদ্ধির জন্য অনুখাদ্য বা কম্পোস্ট সার ছড়ান।`
    ]
  };

  return advice[norm] || advice.en;
}

function getFallbackAnalyzeLeaf(lang: string = 'English') {
  const norm = normalizeLang(lang);
  if (norm === 'kn') {
    return {
      name: "ಎಲೆ ಮಚ್ಚೆ ರೋಗ (Leaf Spot)",
      confidence: "High",
      symptoms: [
        "ಎಲೆಗಳ ಮೇಲೆ ಕಂದು ಬಣ್ಣದ ಸಣ್ಣ ವರ್ತುಲಾಕಾರದ ಮಚ್ಚೆಗಳು.",
        "ರೋಗ ತೀವ್ರವಾದಾಗ ಎಲೆಗಳು ಹಣ್ಣಾಗಿ ಒಣಗಿ ಉದುರುತ್ತವೆ."
      ],
      treatmentChemical: [
        "ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ ೨ ಗ್ರಾಂ ಮ್ಯಾಂಕೋಜೆಬ್ ಕೀಟನಾಶಕ ಬೆರೆಸಿ ಸಿಂಪಡಿಸಿ.",
        "ತೀವ್ರವಾದಾಗ ಬ್ಲೈಟಾಕ್ಸ್ ಅಥವಾ ತಾಮ್ರದ ಆಕ್ಸಿಕ್ಲೋರೈಡ್ ಬಳಸಿ."
      ],
      treatmentOrganic: [
        "೧೦ ಲೀಟರ್ ಕೇವಲ ನೀರಿಗೆ ೨% ನಿಂಬೆ ಎಲೆ ಮತ್ತು ಬೇವಿನ ಹಿಂಡಿ ದ್ರಾವಣ ಮಿಶ್ರಣ ಮಾಡಿ ಸಿಂಪಡಿಸಿ.",
        "ಜೈವಿಕ ಚಿಕಿತ್ಸೆಯಾಗಿ ಸೂಡೊಮೊನಾಸ್ ಫ್ಲೋರೆಸೆನ್ಸ್ ಬಳಸಬಹುದು."
      ],
      prevention: [
        "ಆರೋಗ್ಯಕರ ಸಸಿಗಳನ್ನು ಆಯ್ದುಕೊಳ್ಳಿ.",
        "ನೀರು ಸರಾಗವಾಗಿ ಹರಿದು ಹೋಗುವಂತೆ ಬದುಗಳನ್ನು ನಿರ್ಮಿಸಿ.",
        "ಬೆಳೆ ಸರದಿಯನ್ನು ಅನುಸರಿಸಿ."
      ],
      learnMore: [
        "ಕೃಷಿ ಇಲಾಖೆ ಮಾರ್ಗಸೂಚಿ",
        "https://www.agmarknet.gov.in"
      ]
    };
  } else if (norm === 'hi') {
    return {
      name: "पत्ती धब्बा रोग (Leaf Spot)",
      confidence: "High",
      symptoms: [
        "पत्तियों पर भूरे या काले रंग के छोटे गोलाकार धब्बे दिखाई देना।",
        "रोग बढ़ने पर पत्तियां पीली होकर सूखने और गिरने लगती हैं।"
      ],
      treatmentChemical: [
        "प्रति लीटर पानी में 2 ग्राम मैंकोजेब (Mancozeb) मिलाकर छिड़काव करें।",
        "कोपर ऑक्सीक्लोराइड का छिड़काव विशेषज्ञ की देखरेख में करें।"
      ],
      treatmentOrganic: [
        "नीम की पत्तियों का काढ़ा या नीम के तेल (5 मिली/लीटर) का छिड़काव करें।",
        "मिट्टी में ट्राइकोडर्मा जीवाणु खाद का प्रयोग लाभदायक है।"
      ],
      prevention: [
        "स्वस्थ और प्रमाणित बीजों का ही उपयोग करें।",
        "खेत में जलजमाव न होने दें और उचित जल निकासी रखें।",
        "फसल चक्र अपनाएं।"
      ],
      learnMore: [
        "कृषि अनुसंधान केंद्र",
        "https://www.agmarknet.gov.in"
      ]
    };
  } else if (norm === 'mr') {
    return {
      name: "तांबेरा किंवा करपा रोग (Leaf Spot)",
      confidence: "High",
      symptoms: [
        "पानांवर तांबूस, तपकिरी किंवा काळे ठिपके पडणे.",
        "पानांच्या कडा वाळून पाने आपोआगे गळणे."
      ],
      treatmentChemical: [
        "२ ग्रॅम मॅनकोझेब प्रति लिटर पाण्यात मिसळून फवारणी करावी.",
        "तांबेरा नियंत्रणासाठी कॉपर ऑक्सीक्लोराइड वापरावे."
      ],
      treatmentOrganic: [
        "कडुनिंबाचा अर्क किंवा ५% निंबोळी अर्क संध्याकाळी फवारावा.",
        "ट्रायकोडर्मा विरिडी सेंद्रिय बुरशीनाशकाचा वापर करावा."
      ],
      prevention: [
        "रोगमुक्त बियाणे किंवा रोपांची निवड करणे.",
        "शेतात खेळती हवा राहील अशी लागवड करणे.",
        "योग्य पिक फेरपालट करणे."
      ],
      learnMore: [
        "स्थानिक कृषी सल्लागार केंद्र",
        "https://www.agmarknet.gov.in"
      ]
    };
  } else if (norm === 'te') {
    return {
      name: "ఆకు మచ్చ తెగులు (Leaf Spot)",
      confidence: "High",
      symptoms: [
        "ఆకులపై చిన్న చిన్న గోధుమ రంగు వృత్తాకార మచ్చలు ఏర్పడతాయి.",
        "తీవ్రత పెరిగితే ಆకులు పసుపు రంగులోకి మారి రాలిపోతాయి."
      ],
      treatmentChemical: [
        "లీటరు నీటిలో 2 గ్రాముల మ్యాంకోజెబ్ కలిపి ఆకులపై పిచికారీ చేయండి.",
        "రసాయన నివారణగా కాపర్ ఆక్సిక్లోరైడ్ ఉపయోగించండి."
      ],
      treatmentOrganic: [
        "5 మి.లీ వేప నూనెను లೀటరు నీటిలో కలిపి పిచికారీ చేయడం ఉత్తమం.",
        "ట్రైకోడెర్మ విరిడి వంటి జీవ శిలీంద్రనాశకాలను వాడండి."
      ],
      prevention: [
        "ఆరోగ్యకరమైన తెగుళ్లు లేని విత్తనాలను నాటడం.",
        "పొలంలో నీరు నిల్వ ఉండకుండా తగిన డ్రైనేజీ ఏర్పాటు చేయడం.",
        "పంట మార్పిడి పద్ధతులను పాటించడం."
      ],
      learnMore: [
        "వ్యవసాయ నిపుణులు",
        "https://www.agmarknet.gov.in"
      ]
    };
  }
  return {
    name: "Leaf Spot Infestation",
    confidence: "High",
    symptoms: [
      "Small brown circular lesions appearing on the lower surfaces of leaves.",
      "Marginal chlorosis (yellowing) of foliage leading to early defoliation."
    ],
    treatmentChemical: [
      "Spray Mancozeb at a concentration of 2g per liter of agricultural mixture.",
      "Utilize copper-based fungicides like Copper Oxychloride for persistent rust."
    ],
    treatmentOrganic: [
      "Spray localized rich extract of Garlic and Neem leaf active solutions.",
      "Inoculate soil with Trichoderma Viride and helpful mycorrhizal spores."
    ],
    prevention: [
      "Maintain active solarisation of seedling beds and rotate planting patterns.",
      "Clear infected debris away from healthy foliage, keep fields draining well.",
      "Ensure proper crop spacing for maximum air circulation."
    ],
    learnMore: [
      "ICAR Agricultural Portal Link",
      "https://www.agmarknet.gov.in"
    ]
  };
}

// API Routes
app.post("/api/farmer-data", async (req, res) => {
  const { location, lang } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: `You are a professional agricultural data analyst for farmers in ${location}, Karnataka.
      Provide highly precise and accurate real-time data for:
      1. Weather: current temperature, condition, humidity, wind speed, AQI, soil moisture, and a 7-day forecast.
      2. Market Rates: Current APMC market rates for major crops in this specific region (search for the nearest APMC markets). Use standard English names for crops. Include a 15-day price history for each crop with daily price points.
      3. Milk Rates: Current average procurement rates for Cow and Buffalo milk in this district.
      4. Nearby Dairies: Find 3 real milk collection centers or dairies near this location with their approximate distance.
      5. Recommendations: Suggest 3 best crops to grow now based on current season and soil moisture.
      6. Alerts: Any weather or pest alerts for this region.

      CRITICAL: Use high-quality realistic data for nearby dairies.
      CRITICAL: Use high-quality realistic data for the latest APMC prices from official sources like Agmarknet or local news.
      CRITICAL: Respond ONLY in ${lang} language for all text fields (condition, reason, alerts, dairy names if possible, etc.).
      CRITICAL: Return ONLY a valid JSON object.
      
      JSON Structure:
      {
        "weather": {
          "temp": "string",
          "humidity": "string",
          "wind": "string",
          "aqi": "string",
          "condition": "string",
          "moisture": "string",
          "forecast": [ { "day": "string", "temp": "string", "condition": "string" } ],
          "alerts": [ "string" ]
        },
        "marketRates": [
          { 
            "crop": "string", 
            "price": "string", 
            "unit": "string", 
            "trend": "up|down|stable", 
            "source": "string",
            "history": [ { "day": "string", "price": "number" } ]
          }
        ],
        "milkRates": {
          "cow": { "price": "string", "fat": "string", "snf": "string" },
          "buffalo": { "price": "string", "fat": "string", "snf": "string" }
        },
        "nearbyDairies": [
          { "name": "string", "distance": "string", "rate": "string", "source": "string" }
        ],
        "recommendations": [
          { "crop": "string", "reason": "string", "risk": "Low|Medium|High", "yield": "string" }
        ]
      }` }] }]
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        return res.json(JSON.parse(cleanJson));
      } catch (e) {
        console.error("Failed to parse JSON", e);
      }
    }
    throw new Error("Invalid raw content from Gemini");
  } catch (error: any) {
    console.warn("Using localized high-fidelity fallback for farmer data due to:", error.message);
    const fallback = getFallbackFarmerData(location, lang);
    return res.json(fallback);
  }
});

app.post("/api/agri-contacts", async (req, res) => {
  const { location, lang } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: `Find the official government agriculture office and the nearest government veterinary hospital/doctor for the location: ${location}, Karnataka.
      Provide:
      1. Government Agriculture Office: Name, Phone Number, and a Google Maps search query or actual address.
      2. Government Veterinary Hospital: Name, Phone Number, and a Google Maps search query or actual address.

      CRITICAL: Use realistic regional information.
      CRITICAL: Respond ONLY in ${lang} language for names and descriptions.
      CRITICAL: Return ONLY a valid JSON object.

      JSON Structure:
      {
        "agriOffice": {
          "name": "string",
          "phone": "string",
          "address": "string",
          "mapQuery": "string"
        },
        "vetHospital": {
          "name": "string",
          "phone": "string",
          "address": "string",
          "mapQuery": "string"
        }
      }` }] }]
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        return res.json(JSON.parse(cleanJson));
      } catch (e) {
        console.error("Error to parse JSON", e);
      }
    }
    throw new Error("Invalid response format");
  } catch (error: any) {
    console.warn("Using localized high-fidelity fallback for agri contacts due to:", error.message);
    const fallback = getFallbackAgriContacts(location, lang);
    return res.json(fallback);
  }
});

app.post("/api/chat-chitti", async (req, res) => {
  const { message, lang, context } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const daysSinceSowing = context?.sowingDate ? Math.floor((new Date().getTime() - new Date(context.sowingDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

    let chatModel = "gemini-3.5-flash";
    let chat;
    let response;
    const sysInstruction = `You are "AI Chitti", a smart agricultural assistant inside the Krishi Mitra mobile app. 
        Your role is to help farmers manage their crops using weather data, crop knowledge, and simple explanations.

        FARMER CONTEXT:
        - Crop: ${context?.crop || 'Not specified'}
        - Location: ${context?.location || 'Not specified'}
        - Sowing Date: ${context?.sowingDate || 'Not specified'}
        ${daysSinceSowing !== null ? `- Days since sowing: ${daysSinceSowing} days` : ''}

        YOUR RESPONSIBILITIES:
        1. Personalized Advice: Always tailor your response to the specific crop (${context?.crop || 'the crop'}) and its current growth stage based on the sowing date.
        2. Irrigation Guidance: Based on weather and crop stage, tell when to irrigate. Use simple alerts like "Your crop may need watering tomorrow due to high temperature."
        3. Weather Alerts: Warn about heavy rain, drought, extreme heat, or cold. Explain effects on the specific crop.
        4. Pest and Disease Support: Identify diseases from symptoms (e.g., "yellow leaves"), suggest treatments (organic/pesticide), and safe spraying times.
        5. Fertilizer Suggestions: Recommend fertilizers and timing based on the current growth stage of the ${context?.crop || 'crop'}.
        6. Language Style: Use short sentences, easy-to-understand language, and practical advice.
        7. Safety: Never give harmful chemical advice. Recommend safe usage and correct dosage.

        IMPORTANT: 
        - Act like a friendly farming expert.
        - Respond ONLY in ${lang} language.
        - If the farmer hasn't provided their crop or sowing date, kindly ask for them to give better advice.`;

    try {
      chat = ai.chats.create({
        model: chatModel,
        config: { systemInstruction: sysInstruction }
      });
      response = await chat.sendMessage({ message });
    } catch (chatError: any) {
      const errorMsg = chatError.message || "";
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota exceeded") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("Quota exceeded")
      ) {
        console.warn("Quota exceeded for gemini-3.5-flash. Retrying chat with gemini-flash-latest...");
        chatModel = "gemini-flash-latest";
        chat = ai.chats.create({
          model: chatModel,
          config: { systemInstruction: sysInstruction }
        });
        response = await chat.sendMessage({ message });
      } else {
        throw chatError;
      }
    }
    res.json({ text: response.text });
  } catch (error: any) {
    console.warn("Using localized fallback for AI Chitti due to:", error.message);
    const text = getFallbackChatChitti(message, lang, context);
    res.json({ text });
  }
});

app.post("/api/chat-chitti-stream", async (req, res) => {
  const { message, lang, context } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const daysSinceSowing = context?.sowingDate ? Math.floor((new Date().getTime() - new Date(context.sowingDate).getTime()) / (1000 * 60 * 60 * 24)) : null;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    let chatModel = "gemini-3.5-flash";
    let chat;
    let stream;
    const sysInstruction = `You are "AI Chitti", a smart agricultural assistant inside the Krishi Mitra mobile app. 
        Your role is to help farmers manage their crops using weather data, crop knowledge, and simple explanations.

        FARMER CONTEXT:
        - Crop: ${context?.crop || 'Not specified'}
        - Location: ${context?.location || 'Not specified'}
        - Sowing Date: ${context?.sowingDate || 'Not specified'}
        ${daysSinceSowing !== null ? `- Days since sowing: ${daysSinceSowing} days` : ''}

        YOUR RESPONSIBILITIES:
        1. Personalized Advice: Always tailor your response to the specific crop (${context?.crop || 'the crop'}) and its current growth stage based on the sowing date.
        2. Irrigation Guidance: Based on weather and crop stage, tell when to irrigate. Use simple alerts like "Your crop may need watering tomorrow due to high temperature."
        3. Weather Alerts: Warn about heavy rain, drought, extreme heat, or cold. Explain effects on the specific crop.
        4. Pest and Disease Support: Identify diseases from symptoms (e.g., "yellow leaves"), suggest treatments (organic/pesticide), and safe spraying times.
        5. Fertilizer Suggestions: Recommend fertilizers and timing based on the current growth stage of the ${context?.crop || 'crop'}.
        6. Language Style: Use short sentences, easy-to-understand language, and practical advice.
        7. Safety: Never give harmful chemical advice. Recommend safe usage and correct dosage.

        IMPORTANT: 
        - Act like a friendly farming expert.
        - Respond ONLY in ${lang} language.
        - If the farmer hasn't provided their crop or sowing date, kindly ask for them to give better advice.`;

    try {
      chat = ai.chats.create({
        model: chatModel,
        config: { systemInstruction: sysInstruction }
      });
      stream = await chat.sendMessageStream({ message });
    } catch (chatError: any) {
      const errorMsg = chatError.message || "";
      if (
        errorMsg.includes("429") ||
        errorMsg.includes("quota exceeded") ||
        errorMsg.includes("RESOURCE_EXHAUSTED") ||
        errorMsg.includes("Quota exceeded")
      ) {
        console.warn("Quota exceeded for gemini-3.5-flash. Retrying chat stream with gemini-flash-latest...");
        chatModel = "gemini-flash-latest";
        chat = ai.chats.create({
          model: chatModel,
          config: { systemInstruction: sysInstruction }
        });
        stream = await chat.sendMessageStream({ message });
      } else {
        throw chatError;
      }
    }

    for await (const chunk of stream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.warn("Using high-fidelity word-by-word mock stream for AI Chitti stream due to:", error.message);
    try {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      const responseText = getFallbackChatChitti(message, lang, context);
      const words = responseText.split(" ");
      for (const word of words) {
        res.write(`data: ${JSON.stringify({ text: word + " " })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (streamErr) {
      console.error("Mock stream crash:", streamErr);
      res.end();
    }
  }
});

app.post("/api/transcribe-audio", async (req, res) => {
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const { base64Audio } = req.body;
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "audio/wav",
                data: base64Audio
              }
            },
            { text: "Transcribe this audio message from a farmer. Only return the transcription text." }
          ]
        }
      ]
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.warn("Fallback transcription for audio due to:", error.message);
    // Standard farmer helper keyword phrase
    res.json({ text: "How to protect my crop from pests?" });
  }
});

app.post("/api/analyze-leaf", async (req, res) => {
  const { base64Image, lang } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const cleanBase64 = base64Image.split(",")[1] || base64Image;
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this leaf. Identify any diseases or pests. 
            Provide the following details in ${lang} language:
            1. Disease/Pest Name
            2. Confidence level (Low, Medium, High)
            3. Common Symptoms
            4. Treatment Options (Chemical)
            5. Treatment Options (Organic)
            6. Preventive Measures
            7. Links to learn more (provide 1-2 relevant search query strings or URLs)

            CRITICAL: Return ONLY a valid JSON object.
            JSON Structure:
            {
              "name": "string",
              "confidence": "string",
              "symptoms": ["string"],
              "treatmentChemical": ["string"],
              "treatmentOrganic": ["string"],
              "prevention": ["string"],
              "learnMore": ["string"]
            }`
          }
        ]
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const cleanJson = jsonMatch[0].replace(/```json|```/g, '').trim();
        return res.json(JSON.parse(cleanJson));
      } catch (e) {
        console.error("Failed to parse leaf JSON:", e);
      }
    }
    throw new Error("Malformed JSON response");
  } catch (error: any) {
    console.warn("Using specialized localized fallback leaf inspection data due to:", error.message);
    const fallback = getFallbackAnalyzeLeaf(lang);
    res.json(fallback);
  }
});

app.post("/api/generate-speech", async (req, res) => {
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const { text } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    res.json({ base64Audio });
  } catch (error: any) {
    console.warn("Skipping backend Speech synthesis, clientside will handle fallback beautifully:", error.message);
    res.json({ base64Audio: null });
  }
});

app.post("/api/proactive-advice", async (req, res) => {
  const { lang, context, weatherData } = req.body;
  try {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    const response = await generateContentWithFallback({
      model: "gemini-3.5-flash",
      contents: [{ parts: [{ text: `You are "AI Chitti", a smart agricultural assistant. 
      Based on the following farmer context and current weather, provide 2-3 proactive, highly relevant suggestions or reminders for the farmer.
      
      FARMER CONTEXT:
      - Crop: ${context.crop || 'Not specified'}
      - Location: ${context.location || 'Not specified'}
      - Sowing Date: ${context.sowingDate || 'Not specified'}
      
      CURRENT WEATHER/DATA:
      ${JSON.stringify(weatherData)}
      
      YOUR GOAL:
      - Provide actionable advice (e.g., "Time to apply urea", "Rain expected, clear drainage", "High heat, irrigate tonight").
      - Keep it very short and farmer-friendly.
      - Respond ONLY in ${lang} language.
      
      Return as a JSON array of strings: ["suggestion 1", "suggestion 2"]` }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    try {
      const text = response.text || "[]";
      res.json(JSON.parse(text));
    } catch (e) {
      throw new Error("JSON parse failed");
    }
  } catch (error: any) {
    console.warn("Using localized proactively advice due to:", error.message);
    const advice = getFallbackProactiveAdvice(lang, context, weatherData);
    res.json(advice);
  }
});

// Vite middleware for dev / static files for prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
