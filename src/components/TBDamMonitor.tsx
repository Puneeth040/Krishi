import React, { useState, useEffect } from 'react';
import { 
  Waves, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  AlertTriangle, 
  Activity, 
  RefreshCw, 
  Bell, 
  FileCode, 
  Download, 
  Check, 
  Copy, 
  X,
  Gauge,
  Calendar,
  CloudRain,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid 
} from 'recharts';
import { Language } from '../constants/translations';

// Dictionary of translations for TBDamMonitor
const monitorTranslations: Record<Language, {
  title: string;
  project: string;
  activeTelemetry: string;
  description: string;
  simulate: string;
  normal: string;
  flood: string;
  drought: string;
  autoRefresh: string;
  lastChecked: string;
  systemStatus: string;
  storagePercent: string;
  refreshFeed: string;
  inflow: string;
  outflow: string;
  waterLevel: string;
  totalStorage: string;
  dailyInflowTitle: string;
  dailyInflowSub: string;
  weeklyStorageTitle: string;
  weeklyStorageSub: string;
  inflowVolume: string;
  tmcIndex: string;
  offlineHeader: string;
  offlineDesc: string;
  offlineBadge: string;
  telemetryTab: string;
}> = {
  en: {
    title: "TB Dam Live Water Monitor",
    project: "Tungabhadra Reservoir Project",
    activeTelemetry: "TB Dam Active Telemetry",
    description: "Provides real-time hydro-station metrics, spillway details & total live storage index.",
    simulate: "Simulate Scenario",
    normal: "Normal",
    flood: "Flood",
    drought: "Drought",
    autoRefresh: "Auto-Refresh configured (15m Interval)",
    lastChecked: "Last checked",
    systemStatus: "System Status",
    storagePercent: "Live Storage Percent",
    refreshFeed: "Refresh Feed",
    inflow: "Inflow",
    outflow: "Outflow",
    waterLevel: "Water Level",
    totalStorage: "Total Storage",
    dailyInflowTitle: "Daily Inflow Trend",
    dailyInflowSub: "Cusecs Discharge over 7 days",
    weeklyStorageTitle: "Weekly Storage Index",
    weeklyStorageSub: "Active reservoir TMC index",
    inflowVolume: "Inflow Volume",
    tmcIndex: "TMC Index",
    offlineHeader: "Developer Android Integration Assets",
    offlineDesc: "Below are the implementation codes for Android. Includes XML Layouts, robust Kotlin API bindings using Retrofit, MVVM LiveData implementation, MPAndroidChart specifications, Cache mechanisms, and offline support models.",
    offlineBadge: "Offline state",
    telemetryTab: "Telemetry"
  },
  kn: {
    title: "ಟಿಬಿ ಜಲಾಶಯ ಲೈವ್ ಮಾನಿಟರ್",
    project: "ತುಂಗಭದ್ರಾ ಜಲಾಶಯ ಯೋಜನೆ",
    activeTelemetry: "ಟಿಬಿ ಅಣೆಕಟ್ಟು ಸಕ್ರಿಯ ಟೆಲಿಮೆಟ್ರಿ",
    description: "ನೈಜ-ಸಮಯದ ಜಲ-ವಿದ್ಯುತ್ ಕೇಂದ್ರದ ಮೆಟ್ರಿಕ್ಸ್, ಸ್ಪಿಲ್ವೇ ವಿವರಗಳು ಮತ್ತು ಒಟ್ಟು ಲೈವ್ ಸಂಗ್ರಹಣೆ ಸೂಚಿಯನ್ನು ಒದಗಿಸುತ್ತದೆ.",
    simulate: "ಪರಿಸ್ಥಿತಿಯ ಅನುಕರಣೆ",
    normal: "ಸಾಮಾನ್ಯ",
    flood: "ಪ್ರವಾಹ",
    drought: "ಬರಗಾಲ",
    autoRefresh: "ಸ್ವಯಂ-ನವೀಕರಣ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿದೆ (15ನಿಮಿಷ ವಿರಾಮ)",
    lastChecked: "ಕೊನೆಯದಾಗಿ ಪರಿಶೀಲಿಸಿದ್ದು",
    systemStatus: "ವ್ಯವಸ್ಥೆಯ ಸ್ಥಿತಿ",
    storagePercent: "ಲೈವ್ ಸಂಗ್ರಹಣೆ ಶೇಕಡಾವಾರು",
    refreshFeed: "ಮಾಹಿತಿ ನವೀಕರಿಸಿ",
    inflow: "ಒಳಹರಿವು",
    outflow: "ಹೊರಹರಿವು",
    waterLevel: "ನೀರಿನ ಮಟ್ಟ",
    totalStorage: "ಒಟ್ಟು ಸಂಗ್ರಹಣೆ",
    dailyInflowTitle: "ದೈನಂದಿನ ಒಳಹರಿವಿನ ಪ್ರವೃತ್ತಿ",
    dailyInflowSub: "7 ದಿನಗಳಲ್ಲಿ ಕ್ಯೂಸೆಕ್ಸ್ ಹೊರಸೂಸುವಿಕೆ",
    weeklyStorageTitle: "ವಾರದ ಸಂಗ್ರಹಣೆ ಸೂಚಿ",
    weeklyStorageSub: "ಸಕ್ರಿಯ ಜಲಾಶಯದ ಟಿಎಂಸಿ ಸೂಚಿ",
    inflowVolume: "ಒಳಹರಿವಿನ ಪ್ರಮಾಣ",
    tmcIndex: "ಟಿಎಂಸಿ ಸೂಚಿ",
    offlineHeader: "ಡೆವಲಪರ್ ಆಂಡ್ರಾಯ್ಡ್ ಇಂಟಿಗ್ರೇಷನ್ ಸ್ವತ್ತುಗಳು",
    offlineDesc: "ಕೆಳಗೆ ಆಂಡ್ರಾಯ್ಡ್‌ಗಾಗಿ ಅಳವಡಿಕೆ ಕೋಡ್‌ಗಳಿವೆ. ಎಕ್ಸ್‌ಎಂಎಲ್ ಲೇಔಟ್‌ಗಳು, ರೆಟ್ರೋಫಿಟ್ ಬಳಸುವ ರೋಬಸ್ಟ್ ಕೋಟ್ಲಿನ್ ಎಪಿಐ ಬೈಂಡಿಂಗ್‌ಗಳು, ಎಂವಿವಿಎಂ ಲೈವ್‌ಡೇಟಾ ಅಳವಡಿಕೆ, ಎಂಪೀಆಂಡ್ರಾಯ್ಡ್ ಚಾರ್ಟ್ ವಿಶೇಷಣಗಳು ಮತ್ತು ಕ್ಯಾಶ್ ಕಾರ್ಯವಿಧಾನಗಳನ್ನು ಒಳಗೊಂಡಿದೆ.",
    offlineBadge: "ಆಫ್‌ಲೈನ್ ಸ್ಥಿತಿ",
    telemetryTab: "ಲೈವ್ ಮಾಹಿತಿ"
  },
  hi: {
    title: "टीबी बांध लाइव वाटर मॉनिटर",
    project: "तुंगभद्रा जलाशय परियोजना",
    activeTelemetry: "टीबी बांध सक्रिय टेलीमेट्री",
    description: "वास्तविक समय के हाइड्रो-स्टेशन मेट्रिक्स, स्पिलवे विवरण और कुल लाइव भंडारण सूचकांक प्रदान करता है।",
    simulate: "परिदृश्य सिमुलेशन",
    normal: "सामान्य",
    flood: "बाढ़",
    drought: "सूखा",
    autoRefresh: "ऑटो-रिफ्रेश कॉन्फ़िगर किया गया (15 मिनट अंतराल)",
    lastChecked: "अंतिम जांच",
    systemStatus: "सिस्टम की स्थिति",
    storagePercent: "लाइव भंडारण प्रतिशत",
    refreshFeed: "फीड रिफ्रेश करें",
    inflow: "अंतर्वाह (Inflow)",
    outflow: "बहिर्वाह (Outflow)",
    waterLevel: "जल स्तर",
    totalStorage: "कुल भंडारण",
    dailyInflowTitle: "दैनिक अंतर्वाह रुझान",
    dailyInflowSub: "7 दिनों में क्युसेक डिस्चार्ज",
    weeklyStorageTitle: "साप्ताहिक भंडारण सूचकांक",
    weeklyStorageSub: "সক্রিয় জলাধার টিএমসি সূচক",
    inflowVolume: "अंतर्वाह मात्रा",
    tmcIndex: "टीएमसी इंडेक्स",
    offlineHeader: "डेवलपर एंड्रॉइड इंटीग्रेशन एसेट्स",
    offlineDesc: "नीचे एंड्रॉइड के लिए कार्यान्वयन कोड दिए गए हैं। इसमें XML लेआउट, रेट्रोफ़िट का उपयोग करके मजबूत कोटलिन एपीआई बाइंडिंग, एमवीवीएम लाइवडेटा कार्यान्वयन, एमपीएंड्रॉइडचार्ट विनिर्देश, कैश तंत्र शामिल हैं।",
    offlineBadge: "ऑफ़लाइन स्थिति",
    telemetryTab: "टेलीमेट्री"
  },
  te: {
    title: "టీబీ డ్యామ్ లైవ్ వాటర్ మానిటర్",
    project: "తుంగభద్ర జలాశయం ప్రాజెక్ట్",
    activeTelemetry: "టీబీ డ్యామ్ యాక్టివ్ టెలిమెట్రీ",
    description: "రియల్ టైమ్ హైడ్రో-స్టేషన్ మెట్రిక్స్, స్పిల్వే వివరాలు మరియు మొత్తం లైవ్ స్టోరేజ్ ఇండెక్స్‌ను అందిస్తుంది.",
    simulate: "పరిస్థితి అనుకరణ",
    normal: "సాధారణం",
    flood: "వరద",
    drought: "కరువు",
    autoRefresh: "ఆటో-రిఫ్రెష్ కాన్ఫిగర్ చేయబడింది (15 నిమి.ల విరామం)",
    lastChecked: "చివరిగా తనిఖీ చేయబడింది",
    systemStatus: "సిస్టమ్ స్థితి",
    storagePercent: "లైవ్ స్టోరేజ్ శాతం",
    refreshFeed: "ఫీడ్ రిఫ్రెష్ చేయండి",
    inflow: "ఇన్‌ఫ్లో (ఒకహరివు)",
    outflow: "అవుట్‌ఫ్లో (బహిర్గతం)",
    waterLevel: "నీటి మట్టం",
    totalStorage: "మొత్తం నిల్వ",
    dailyInflowTitle: "రోజువారీ ఇన్‌ఫ్లో ట్రెండ్",
    dailyInflowSub: "7 రోజులలో క్యూసెక్కుల ఉత్సర్గ",
    weeklyStorageTitle: "వారపు నిల్వ సూచిక",
    weeklyStorageSub: "యాక్టివ్ రిజర్వాయర్ టిఎమ్‌సి ఇండెక్స్",
    inflowVolume: "ఇన్‌ఫ్లో పరిమాణం",
    tmcIndex: "TMC ఇండెక్స్",
    offlineHeader: "డెవలపర్ ఆండ్రాయిడ్ ఇంటిగ్రేషన్ అసెట్స్",
    offlineDesc: "క్రింద ఆండ్రాయిడ్ కోసం అమలు కోడ్‌లు ఉన్నాయి. ఎక్స్‌ఎమ్‌ఎల్ లేఅవుట్‌లు, రెట్రోఫిట్ ఉపయోగించి బలమైన కోట్లిన్ యాపిఐ బైండింగ్‌లు, ఎమ్‌వివిఎమ్ లైవ్‌డేటా అమలు, ఎమ్‌పిఆండ్రాయిడ్‌చార్ట్ స్పెసిఫికేషన్‌లు, క్యాష్ విలేఖన పద్ధతులు ఉన్నాయి.",
    offlineBadge: "ఆఫ్‌లైన్ స్థితి",
    telemetryTab: "టెలిమెట్రీ"
  },
  ta: {
    title: "டிபி அணை லைவ் வாட்டர் மானிட்டர்",
    project: "துங்கபத்ரா நீர்த்தேக்கத் திட்டம்",
    activeTelemetry: "டிபி அணை ஆக்டிவ் டெலிமெட்ரி",
    description: "நிகழ்நேர நீர்மின் நிலைய அளவீடுகள், மதகு விவரங்கள் மற்றும் ஒட்டுமொத்த நேரடி சேமிப்பு குறியீட்டை வழங்குகிறது.",
    simulate: "சூழ்நிலை செயல்முறை",
    normal: "சாதாரண",
    flood: "வெள்ளம்",
    drought: "வறட்சி",
    autoRefresh: "தானியங்கு புதுப்பிப்பு கட்டமைக்கப்பட்டது (15 நிமி இடைவெளி)",
    lastChecked: "கடைசியாக சரிபார்க்கப்பட்டது",
    systemStatus: "அமைப்பின் நிலை",
    storagePercent: "நேரடி சேமிப்பு சதவீதம்",
    refreshFeed: "புதுப்பிக்கவும்",
    inflow: "நீர் வரத்து (Inflow)",
    outflow: "நீர் வெளியேற்றம் (Outflow)",
    waterLevel: "நீர் மட்டம்",
    totalStorage: "மொத்த சேমিப்பு",
    dailyInflowTitle: "தினசரி நீர் வரத்து போக்கு",
    dailyInflowSub: "7 நாட்களில் கன அடி நீர் வெளியேற்றம்",
    weeklyStorageTitle: "வாராந்திர சேமிப்பு குறியீடு",
    weeklyStorageSub: "செயலில் உள்ள நீர்த்தேக்க டிஎம்சி குறியீடு",
    inflowVolume: "நீர் வரத்து அளவு",
    tmcIndex: "டிஎம்சி குறியீடு",
    offlineHeader: "டெவலப்பர் ஆண்ட்ராய்டு ஒருங்கிணைப்பு சொத்துக்கள்",
    offlineDesc: "ஆண்ட்ராய்டுக்கான குறியீடுகள் கீழே உள்ளன. எக்ஸ்এমஎல் தளவமைப்புகள், ரெட்ரோஃபிட் பயன்படுத்தி வலுவான கோட்லின் ஏবিআই பிணைப்புகள், எம்விவிஎம் லைவ்டேட்டா, எம்பிஆண்ட்ராய்டுசார்ட் மற்றும் கேச் வழிமுறைகள் உள்ளன.",
    offlineBadge: "ஆஃப்லைன் நிலை",
    telemetryTab: "டெலிமெட்ரி"
  },
  mr: {
    title: "टीबी धरण लाईव्ह वॉटर मॉनिटर",
    project: "तुंगभद्रा जलाशय प्रकल्प",
    activeTelemetry: "टीबी धरण सक्रिय टेलिमेट्री",
    description: "रिअल-टाइम हायड्रो-स्टेशन मेट्रिक्स, सांडवा तपशील आणि एकूण थेट संचय निर्देशांक प्रदान करते.",
    simulate: "परिस्थितीचे अनुकरण",
    normal: "सामान्य",
    flood: "पूर",
    drought: "दुष्काळ",
    autoRefresh: "ऑटो-रिफ्रेश कॉन्फिगर केले (15 मिनिटे अंतर)",
    lastChecked: "शेवटची तपासणी",
    systemStatus: "प्रणाली स्थिती",
    storagePercent: "थेट संचय टक्केवारी",
    refreshFeed: "माहिती सुधारीत करा",
    inflow: "आवक पाणी (Inflow)",
    outflow: "जावक पाणी (Outflow)",
    waterLevel: "पाण्याची पातळी",
    totalStorage: "एकूण संचय",
    dailyInflowTitle: "दैनिक आवक कल",
    dailyInflowSub: "7 दिवसांत क्युसेक विसर्ग",
    weeklyStorageTitle: "साप्ताहिक संचय निर्देशांक",
    weeklyStorageSub: "सक्रिय जलाशय टीएमसी निर्देशांक",
    inflowVolume: "आवक पाण्याचे प्रमाण",
    tmcIndex: "टीएमसी इंडेक्स",
    offlineHeader: "डेव्हलपर अँड्रॉइड इंटिग्रेशन ॲसेट्स",
    offlineDesc: "खाली अँड्रॉइडसाठी अंमलबजावणी कोड दिले आहेत. यामध्ये एक्सएमएल लेआउट, रेट्रोफिट वापरून मजबूत कोटलिन एपीआय बाइंडिंग, एमव्हीव्हीएम लाइव्हडेटा, एमपीअँड्रॉइडचार्ट तपशील समाविष्ट आहेत.",
    offlineBadge: "ऑफलाईन स्थिती",
    telemetryTab: "टेलिमेट्री"
  },
  bn: {
    title: "টিবি বাঁধ লাইভ ওয়াটার মনিটর",
    project: "তুঙ্গভদ্রা জলাধার প্রকল্প",
    activeTelemetry: "টিবি বাঁধ সক্রিয় টেলিমেট্রি",
    description: "রিয়েল-টাইম জলবিদ্যুৎ কেন্দ্রের মেট্রিক্স, স্পিলওয়ে বিবরণ এবং মোট লাইভ স্টোরেজ সূচক সরবরাহ করে।",
    simulate: "পরিস্থিতি সিমুলেশন",
    normal: "স্বাভাবিক",
    flood: "বন্যা",
    drought: "খরা",
    autoRefresh: "স্বয়ংক্রিয় রিফ্রেশ কনফিগার করা হয়েছে (১৫ মিনিট অন্তর)",
    lastChecked: "শেষবার চেক করা হয়েছে",
    systemStatus: "সিস্টেমের অবস্থা",
    storagePercent: "লাইভ স্টোরেজ শতাংশ",
    refreshFeed: "ফিড রিফ্রেশ করুন",
    inflow: "জলপ্রবেশ (Inflow)",
    outflow: "জলনির্গমন (Outflow)",
    waterLevel: "জলের স্তর",
    totalStorage: "মোট ধারণ ক্ষমতা",
    dailyInflowTitle: "দৈনিক জলপ্রবেশের প্রবণতা",
    dailyInflowSub: "৭ দিনে কিউসেক নির্গমন",
    weeklyStorageTitle: "সাপ্তাহিক স্টোরেজ সূচক",
    weeklyStorageSub: "সক্রিয় জলাধার টিএমসি সূচক",
    inflowVolume: "জলপ্রবেশের পরিমাণ",
    tmcIndex: "টিএমসি সূচক",
    offlineHeader: "ডেভেলপার অ্যান্ড্রয়েড ইন্টিগ্রেশন সম্পদ",
    offlineDesc: "নিচে অ্যান্ড্রয়েডের জন্য বাস্তবায়ন কোড রয়েছে। এর মধ্যে XML লেআউট, রেট্রোফিট ব্যবহার করে শক্তিশালী কোটলিন এপিআই বাইন্ডিং, MVVM লাইভডেটা বাস্তবায়ন এবং এমপিঅ্যান্ড্রয়েডচার্ট স্পেসিফিকেশন রয়েছে।",
    offlineBadge: "অফলাইন মোড",
    telemetryTab: "টেলিমিত্রি"
  }
};

// Props
interface TBDamMonitorProps {
  lang: Language;
  onClose: () => void;
}

// Scenarios for interactive simulation/playgrounds
type StreamScenario = 'normal' | 'flood' | 'drought';

export function TBDamMonitor({ lang, onClose }: TBDamMonitorProps) {
  const mt = monitorTranslations[lang] || monitorTranslations['en'];
  const [scenario, setScenario] = useState<StreamScenario>('normal');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'monitor' | 'android'>('monitor');
  const [activeCodeTab, setActiveCodeTab] = useState<'xml' | 'kotlin' | 'retrofit' | 'chart'>('xml');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  // Real-time custom notifications matching requested alerts
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'info' | 'warning' | 'danger'; text: string; time: string }>>([
    {
      id: '1',
      type: 'info',
      text: lang === 'kn' ? 'ತುಂಗಭದ್ರಾ ಜಲಾಶಯದ ಪ್ರಸ್ತುತ ಒಳಹರಿವು ಸಹಜ ಸ್ಥಿತಿಯಲ್ಲಿದೆ.' : 'Tungabhadra reservoir inflow is currently stable and normal.',
      time: 'Just now'
    }
  ]);

  // Simulated live data parameters based on selected scenario
  const [telemetry, setTelemetry] = useState({
    inflow: 12500, // cusecs
    outflow: 9800,  // cusecs
    level: 1622.45, // feet (Max is 1633 ft)
    storage: 72.48, // TMC (Max is 105.78 TMC)
    capacityPercent: 68.5, // %
    status: 'Normal' as 'Normal' | 'Moderate' | 'Flood' | 'Drought',
  });

  // Trend data depending on scenario
  const [trends, setTrends] = useState<any[]>([]);

  // Function to simulate / fetch data with cached backup
  const updateTelemetry = (targetScenario: StreamScenario) => {
    setIsRefreshing(true);
    setTimeout(() => {
      let data = {
        inflow: 12500,
        outflow: 9800,
        level: 1622.45,
        storage: 72.48,
        capacityPercent: 68.5,
        status: 'Normal' as 'Normal' | 'Moderate' | 'Flood' | 'Drought',
      };

      const baseWeeklyStorage = [64, 65.2, 66.8, 67.4, 68.0, 68.2, 68.5];
      const baseDailyInflow = [11000, 11500, 12200, 11800, 12900, 12100, 12500];

      let newAlerts: typeof notifications = [];

      if (targetScenario === 'normal') {
        data = {
          inflow: Math.floor(11000 + Math.random() * 3000),
          outflow: Math.floor(9000 + Math.random() * 1500),
          level: +(1620 + Math.random() * 3).toFixed(2),
          storage: +(68 + Math.random() * 5).toFixed(2),
          capacityPercent: +(64 + Math.random() * 5).toFixed(1),
          status: 'Normal',
        };
        newAlerts = [{
          id: 'normal-' + Date.now() + '-' + Math.random(),
          type: 'info',
          text: lang === 'kn' 
            ? 'ತುಂಗಭದ್ರಾ ಜಲಾಶಯ: ನೀರಿನ ಹರಿವು ಉತ್ತಮ ಮತ್ತು ನಿಯಂತ್ರಿತವಾಗಿದೆ.' 
            : 'Tungabhadra Dam: Water flows are healthy and under full control.',
          time: 'Just updated'
        }];
      } else if (targetScenario === 'flood') {
        data = {
          inflow: Math.floor(58000 + Math.random() * 12000),
          outflow: Math.floor(52000 + Math.random() * 8000),
          level: +(1631.85 + Math.random() * 1.0).toFixed(2),
          storage: +(103.50 + Math.random() * 2.1).toFixed(2),
          capacityPercent: +(97.8 + Math.random() * 2.1).toFixed(1),
          status: 'Flood',
        };
        newAlerts = [
          {
            id: 'flood1-' + Date.now() + '-' + Math.random(),
            type: 'danger',
            text: lang === 'kn'
              ? '⚠️ ಅತ್ಯಧಿಕ ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ: ಒಳಹರಿವು 50,000 ಕ್ಯೂಸೆಕ್ ಮೀರಿದೆ! ನದಿ ಪಾತ್ರದ ಜನರು ಸುರಕ್ಷಿತ ಸ್ಥಳಕ್ಕೆ ತೆರಳಲು ಸೂಚನೆ.'
              : '⚠️ HEAVY INFLOW FLOOD ALERT: Inflow exceeds 50,000 Cusecs! Riverbank residents are advised to move to higher ground.',
            time: 'Active'
          },
          {
            id: 'flood2-' + Date.now() + '-' + Math.random(),
            type: 'warning',
            text: lang === 'kn'
              ? '📢 ಕ್ರೆಸ್ಟ್ ಗೇಟ್‌ಗಳ ಮೂಲಕ ಕಡಿತ ಪ್ರವಾಹ ಬಿಡುಗಡೆ: ನದಿ ಹರಿವು ಹೆಚ್ಚಾಗಿದೆ.'
              : '📢 Crest gate spillway discharge active. Downstream water level rising rapidly.',
            time: '10 mins ago'
          }
        ];
      } else if (targetScenario === 'drought') {
        data = {
          inflow: Math.floor(1200 + Math.random() * 400),
          outflow: Math.floor(2500 + Math.random() * 500),
          level: +(1592.15 + Math.random() * 2).toFixed(2),
          storage: +(18.40 + Math.random() * 2).toFixed(2),
          capacityPercent: +(17.4 + Math.random() * 2).toFixed(1),
          status: 'Drought',
        };
        newAlerts = [{
          id: 'drought-' + Date.now() + '-' + Math.random(),
          type: 'warning',
          text: lang === 'kn'
            ? '⚠️ ಕಡಿಮೆ ನೀರಿನ ಮಟ್ಟ ಎಚ್ಚರಿಕೆ: ಶೇಖರಣಾ ಸಾಮರ್ಥ್ಯ ಶೇ. 20 ಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ. ಕುಡಿಯುವ ನೀರಿಗೆ ಆದ್ಯತೆ.'
            : '⚠️ LOW WATER LEVEL ALERT: Storage falls below 20%. Drinking water conservation protocols active.',
          time: 'Critical'
        }];
      }

      setTelemetry(data);
      setNotifications(newAlerts);
      setLastUpdated(new Date());
      setIsRefreshing(false);
      
      // Cache values to localStorage for offline persistence as required
      localStorage.setItem('tb_dam_cache', JSON.stringify({
        telemetry: data,
        scenario: targetScenario,
        time: new Date().getTime(),
        alerts: newAlerts
      }));
    }, 800);
  };

  // Generate trend points for charts
  useEffect(() => {
    let baseInflow = 12000;
    let baseStorage = 70;
    if (scenario === 'flood') {
      baseInflow = 62000;
      baseStorage = 101;
    } else if (scenario === 'drought') {
      baseInflow = 1400;
      baseStorage = 19;
    }

    const weekdays = lang === 'kn' 
      ? ['ಸೋಮ', 'ಮಂಗಳ', 'ಬುಧ', 'ಗುರು', 'ಶುಕ್ರ', 'ಶನಿ', 'ಭಾನು']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const newTrends = weekdays.map((day, idx) => {
      // Simulate historical build up leading up to selected scenario
      const multiplier = 0.85 + (idx * 0.05) + (Math.random() * 0.1);
      return {
        day,
        inflow: Math.round(baseInflow * multiplier),
        storage: +(baseStorage * (0.9 + (idx * 0.02) + (Math.random() * 0.03))).toFixed(1)
      };
    });

    setTrends(newTrends);
  }, [scenario, lang]);

  // Load from offline cache on mount
  useEffect(() => {
    const cached = localStorage.getItem('tb_dam_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Ensure cache is not older than 1 day
        if (new Date().getTime() - parsed.time < 24 * 60 * 60 * 1000) {
          setTelemetry(parsed.telemetry);
          setScenario(parsed.scenario);
          if (parsed.alerts && parsed.alerts.length > 0) {
            setNotifications(parsed.alerts);
          }
          setLastUpdated(new Date(parsed.time));
        } else {
          updateTelemetry('normal');
        }
      } catch (e) {
        updateTelemetry('normal');
      }
    } else {
      updateTelemetry('normal');
    }

    // Auto-refresh every 15 minutes as requested
    const interval = setInterval(() => {
      updateTelemetry(scenario);
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get color configurations based on current inflow amount & status
  const getStatusConfig = () => {
    const inflow = telemetry.inflow;
    if (inflow >= 50000 || telemetry.status === 'Flood') {
      return {
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50 dark:bg-rose-950/30',
        border: 'border-rose-100 dark:border-rose-900/30',
        badge: 'bg-rose-500 text-white',
        text: lang === 'kn' ? 'ಪ್ರವಾಹ ಎಚ್ಚರಿಕೆ (Flood Alert)' : 'Flood Warning Active',
        progressColor: 'bg-rose-500'
      };
    } else if (inflow >= 20000 || telemetry.status === 'Moderate') {
      return {
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-100 dark:border-amber-900/30',
        badge: 'bg-amber-500 text-white',
        text: lang === 'kn' ? 'ಮಧ್ಯಮ ಒಳಹರಿವು (Moderate)' : 'Moderate Flow Rate',
        progressColor: 'bg-amber-500'
      };
    } else if (telemetry.status === 'Drought') {
      return {
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-950/30',
        border: 'border-orange-100 dark:border-orange-900/30',
        badge: 'bg-orange-500 text-white',
        text: lang === 'kn' ? 'ಅಲ್ಪ ಒಳಹರಿವು (Drought/Low Level)' : 'Drought / Low Storage',
        progressColor: 'bg-orange-500 font-mono'
      };
    }
    return {
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      badge: 'bg-emerald-500 text-white',
      text: lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಮಟ್ಟ (Normal)' : 'Normal Flow Stable',
      progressColor: 'bg-emerald-500'
    };
  };

  const statusStyle = getStatusConfig();

  // Kotlin Code, Layout code resources
  const androidXmlLayout = `<!-- res/layout/fragment_tb_dam_monitor.xml -->
<?xml version="1.0" encoding="utf-8"?>
<androidx.core.widget.NestedScrollView xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    android:layout_width="match_match"
    android:layout_height="match_parent"
    android:background="@color/bg_color_dark"
    android:fillViewport="true">

    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp">

        <!-- TB Dam Water Monitor Title Card -->
        <com.google.android.material.card.MaterialCardView
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            app:cardCornerRadius="24dp"
            app:cardElevation="2dp"
            android:backgroundTint="@color/blue_primary_dark">

            <LinearLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                android:orientation="vertical"
                android:padding="20dp">

                <TextView
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Tungabhadra Dam (TB Dam)"
                    android:textColor="@android:color/white"
                    android:textSize="20sp"
                    android:textStyle="bold" />

                <TextView
                    android:id="@+id/tvLastUpdated"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:text="Last updated: Fetching..."
                    android:textColor="#D1F2FF"
                    android:textSize="12sp"
                    android:layout_marginTop="4dp" />

                <TextView
                    android:id="@+id/tvFloodBadge"
                    android:layout_width="wrap_content"
                    android:layout_height="wrap_content"
                    android:layout_marginTop="12dp"
                    android:background="@drawable/badge_bg_green"
                    android:paddingHorizontal="12dp"
                    android:paddingVertical="4dp"
                    android:text="NORMAL"
                    android:textColor="@android:color/white"
                    android:textStyle="bold" />
            </LinearLayout>
        </com.google.android.material.card.MaterialCardView>

        <!-- Dynamic Grid (Inflow and Outflow Card) -->
        <GridLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:layout_marginTop="16dp"
            android:columnCount="2"
            android:rowCount="1">

            <!-- Inflow Card -->
            <com.google.android.material.card.MaterialCardView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_columnWeight="1"
                android:layout_marginEnd="8dp"
                app:cardCornerRadius="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="vertical"
                    android:padding="16dp">
                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Inflow (ಒಳಹರಿವು)"
                        android:textSize="12sp" />
                    <TextView
                        android:id="@+id/tvInflowValue"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="12,500 Cusecs"
                        android:textSize="18sp"
                        android:textStyle="bold"
                        android:textColor="@color/emerald_dark" />
                </LinearLayout>
            </com.google.android.material.card.MaterialCardView>

            <!-- Outflow Card -->
            <com.google.android.material.card.MaterialCardView
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                android:layout_columnWeight="1"
                android:layout_marginStart="8dp"
                app:cardCornerRadius="16dp">

                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="vertical"
                    android:padding="16dp">
                    <TextView
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="Outflow (ಹೊರಹರಿವು)"
                        android:textSize="12sp" />
                    <TextView
                        android:id="@+id/tvOutflowValue"
                        android:layout_width="wrap_content"
                        android:layout_height="wrap_content"
                        android:text="9,800 Cusecs"
                        android:textSize="18sp"
                        android:textStyle="bold"
                        android:textColor="@color/sky_cyan" />
                </LinearLayout>
            </com.google.android.material.card.MaterialCardView>
        </GridLayout>

        <!-- MPAndroidChart Line Chart container -->
        <com.github.mikephil.charting.charts.LineChart
            android:id="@+id/inflowChart"
            android:layout_width="match_parent"
            android:layout_height="240dp"
            android:layout_marginTop="20dp"
            android:background="#162232" />

    </LinearLayout>
</androidx.core.widget.NestedScrollView>`;

  const androidKotlinCode = `// ui/dam/TBDamMonitorFragment.kt
package com.agrisense.app.ui.dam

import android.os.Bundle
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import com.agrisense.app.R
import com.github.mikephil.charting.charts.LineChart
import com.github.mikephil.charting.data.Entry
import com.github.mikephil.charting.data.LineData
import com.github.mikephil.charting.data.LineDataSet

class TBDamMonitorFragment : Fragment(R.layout.fragment_tb_dam_monitor) {

    private val viewModel: TBDamViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val tvInflow = view.findViewById<TextView>(R.id.tvInflowValue)
        val tvOutflow = view.findViewById<TextView>(R.id.tvOutflowValue)
        val tvLastUpdated = view.findViewById<TextView>(R.id.tvLastUpdated)
        val lineChart = view.findViewById<LineChart>(R.id.inflowChart)

        // Observe LiveData from ViewModel (MVVM Architecture)
        viewModel.telemetryData.observe(viewLifecycleOwner) { data ->
            tvInflow.text = "\${data.inflow} Cusecs"
            tvOutflow.text = "\${data.outflow} Cusecs"
            tvLastUpdated.text = "Last updated: \${data.lastUpdatedString}"
            
            setupChart(lineChart, data.weeklyTrend)
        }

        viewModel.errorMsg.observe(viewLifecycleOwner) { error ->
            Toast.makeText(context, error, Toast.LENGTH_SHORT).show()
        }

        // Trigger network call using Retrofit
        viewModel.fetchLiveReservoirData()
    }

    private fun setupChart(lineChart: LineChart, trendList: List<TrendItem>) {
        val entries = ArrayList<Entry>()
        trendList.forEachIndexed { index, trend ->
            entries.add(Entry(index.toFloat(), trend.inflow.toFloat()))
        }

        val dataSet = LineDataSet(entries, "Inflow Trend (Cusecs)")
        dataSet.color = resources.getColor(R.color.sky_blue, null)
        dataSet.setCircleColor(resources.getColor(R.color.sky_blue_dark, null))
        dataSet.lineWidth = 3f
        dataSet.cubicIntensity = 0.2f
        dataSet.mode = LineDataSet.Mode.CUBIC_BEZIER

        lineChart.data = LineData(dataSet)
        lineChart.invalidate() // Refresh chart
    }
}`;

  const retrofitCode = `// api/TBDamApiService.kt
package com.agrisense.app.api

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Query

// Retrofit Interface for Tungabhadra Dam telemetry data
interface TBDamApiService {
    @GET("api/tb-dam/telemetry")
    suspend fun getLiveTelemetry(
        @Query("apiKey") key: String
    ): Response<TBDamResponse>
}

// Data Classes fitting the exact schema requested
data class TBDamResponse(
    val inflow: Int,
    val outflow: Int,
    val reservoirLevelFt: Double,
    val storagePercent: Double,
    val currentStorageTMc: Double,
    val timestamp: Long,
    val securityLevel: String,
    val alerts: List<String>
)`;

  const chartCode = `// build.gradle dependencies
dependencies {
    // Retrofit & Moshi converter for API parsing
    implementation 'com.squareup.retrofit2:retrofit:2.9.0'
    implementation 'com.squareup.retrofit2:converter-moshi:2.9.0'

    // MPAndroidChart Library for beautiful graphing
    implementation 'com.github.PhilJay:MPAndroidChart:v3.1.0'

    // Coroutines & Lifecycle components for MVVM architecture
    implementation 'androidx.lifecycle:lifecycle-viewmodel-ktx:2.6.1'
    implementation 'androidx.lifecycle:lifecycle-livedata-ktx:2.6.1'
}`;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xl z-50 flex items-center justify-center p-0 sm:p-6 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 15 }}
        className="bg-white dark:bg-slate-900 w-full h-full sm:h-auto max-w-5xl rounded-none sm:rounded-[2.5rem] border-0 sm:border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh] overflow-hidden"
      >
        {/* Navigation & Header */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-500/10 dark:bg-blue-400/20 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
              <Waves className="w-5.5 h-5.5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                {mt.title}
              </h3>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Gauge className="w-3 h-3 text-slate-400" />
                Hospet, Vijayanagara District, Karnataka
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto">
            <div className="bg-slate-200/60 dark:bg-slate-800 p-1 rounded-2xl flex gap-1 flex-1 md:flex-initial">
              <button
                onClick={() => setActiveTab('monitor')}
                className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all text-center flex-1 md:flex-initial ${
                  activeTab === 'monitor'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {mt.telemetryTab}
              </button>
              <button
                onClick={() => setActiveTab('android')}
                className={`px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 text-center flex-1 md:flex-initial ${
                  activeTab === 'android'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                Android SDK
              </button>
            </div>

            <button 
              onClick={onClose}
              className="p-2 bg-slate-200/50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {activeTab === 'monitor' ? (
            <div className="space-y-6 sm:space-y-8">
              
              {/* Alert Notification System */}
              <AnimatePresence>
                {notifications.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-3.5 shadow-sm ${
                      alert.type === 'danger'
                        ? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200'
                        : alert.type === 'warning'
                        ? 'bg-amber-50/90 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-200'
                        : 'bg-emerald-50/90 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200'
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      alert.type === 'danger' ? 'text-rose-600' : alert.type === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-bold leading-relaxed">{alert.text}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-black uppercase tracking-widest opacity-60">
                        <span>Alert Tier: {alert.type}</span>
                        <span>•</span>
                        <span>{alert.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Status Header Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                
                {/* Dam Card Header Info */}
                <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10 scale-150">
                    <Waves className="w-48 h-48" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/40 text-blue-100 px-2.5 py-1 rounded-full border border-blue-400/20 inline-block">
                        {mt.project}
                      </span>
                      <h4 className="text-xl sm:text-2xl font-black">{mt.activeTelemetry}</h4>
                      <p className="text-xs text-blue-100 font-medium max-w-lg leading-relaxed">
                        {mt.description}
                      </p>
                    </div>
                    
                    {/* Simulated Scenario Selectors */}
                    <div className="bg-slate-900/40 border border-white/10 p-2 rounded-2xl flex flex-col gap-1.5 z-10 w-full sm:w-auto">
                      <span className="text-[9px] font-bold text-center sm:text-left text-blue-200 uppercase tracking-widest block">{mt.simulate}</span>
                      <div className="grid grid-cols-3 sm:flex gap-1.5">
                        <button
                          onClick={() => { setScenario('normal'); updateTelemetry('normal'); }}
                          className={`px-2.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-colors text-center ${
                            scenario === 'normal' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {mt.normal}
                        </button>
                        <button
                          onClick={() => { setScenario('flood'); updateTelemetry('flood'); }}
                          className={`px-2.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-colors text-center ${
                            scenario === 'flood' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {mt.flood}
                        </button>
                        <button
                          onClick={() => { setScenario('drought'); updateTelemetry('drought'); }}
                          className={`px-2.5 py-1.5 text-[10px] font-extrabold rounded-lg transition-colors text-center ${
                            scenario === 'drought' ? 'bg-orange-500 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {mt.drought}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs text-blue-100 font-bold">
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : 'text-blue-300'}`} />
                      <span>{mt.autoRefresh}</span>
                    </div>
                    <span className="font-mono">
                      {mt.lastChecked}: {lastUpdated.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* State Card Index */}
                <div className={`p-5 sm:p-6 rounded-[2rem] border-2 flex flex-col justify-between ${statusStyle.bg} ${statusStyle.border}`}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block mb-1">
                      {mt.systemStatus}
                    </span>
                    <h5 className={`text-lg sm:text-xl font-black ${statusStyle.color}`}>
                      {statusStyle.text}
                    </h5>
                  </div>

                  <div className="mt-4 sm:mt-6">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-bold mb-1.5">
                      <span>{mt.storagePercent}</span>
                      <span className={statusStyle.color}>{telemetry.capacityPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ${statusStyle.progressColor}`} 
                        style={{ width: `${Math.min(telemetry.capacityPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => updateTelemetry(scenario)}
                    className="mt-4 w-full py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing && 'animate-spin'}`} />
                    {mt.refreshFeed}
                  </button>
                </div>
              </div>

              {/* Hydro Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                
                {/* INFLOW */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30 rounded-[1.8rem] sm:rounded-3xl border border-slate-100 dark:border-slate-800/60 relative overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-emerald-500/5">
                    <ArrowDownLeft className="w-20 h-20 sm:w-24 sm:h-24" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-3">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{mt.inflow}</span>
                    </div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none font-mono truncate">
                      {telemetry.inflow.toLocaleString()} 
                    </h4>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1.5 sm:mt-2">
                    Cusecs
                  </p>
                </div>

                {/* OUTFLOW */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30 rounded-[1.8rem] sm:rounded-3xl border border-slate-100 dark:border-slate-800/60 relative overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-sky-500/5">
                    <ArrowUpRight className="w-20 h-20 sm:w-24 sm:h-24" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-3">
                      <ArrowUpRight className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                      <span className="truncate">{mt.outflow}</span>
                    </div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none font-mono truncate">
                      {telemetry.outflow.toLocaleString()}
                    </h4>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-widest mt-1.5 sm:mt-2">
                    Cusecs
                  </p>
                </div>

                {/* RESERVOIR LEVEL */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30 rounded-[1.8rem] sm:rounded-3xl border border-slate-100 dark:border-slate-800/60 relative overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-indigo-500/5">
                    <Waves className="w-20 h-20 sm:w-24 sm:h-24" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-3">
                      <Waves className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">{mt.waterLevel}</span>
                    </div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none font-mono truncate">
                      {telemetry.level} 
                    </h4>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1.5 sm:mt-2">
                    Feet (FRL: 1633)
                  </p>
                </div>

                {/* ACTIVE CAPACITY STORAGE */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30 rounded-[1.8rem] sm:rounded-3xl border border-slate-100 dark:border-slate-800/60 relative overflow-hidden flex flex-col justify-between min-h-[120px] sm:min-h-[140px]">
                  <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 text-blue-500/5">
                    <Activity className="w-20 h-20 sm:w-24 sm:h-24" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-3">
                      <Activity className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="truncate">{mt.totalStorage}</span>
                    </div>
                    <h4 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-none font-mono truncate">
                      {telemetry.storage} 
                    </h4>
                  </div>
                  <p className="text-[9px] sm:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1.5 sm:mt-2">
                    TMC (Max: 105.78)
                  </p>
                </div>

              </div>

              {/* Dynamic Trend Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                
                {/* Chart 1: Daily Inflow Trend */}
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">{mt.dailyInflowTitle}</h5>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block leading-normal">{mt.dailyInflowSub}</span>
                    </div>
                    <div className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 self-start sm:self-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {mt.inflowVolume}
                    </div>
                  </div>

                  <div className="h-44 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <Tooltip contentStyle={{ borderRadius: '16px', background: '#0f172a', color: '#fff', border: 'none' }} />
                        <Area type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#inflowGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Weekly Storage Trend */}
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.8rem] sm:rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                    <div>
                      <h5 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">{mt.weeklyStorageTitle}</h5>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block leading-normal">{mt.weeklyStorageSub}</span>
                    </div>
                    <div className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 self-start sm:self-center">
                      <Waves className="w-3.5 h-3.5" />
                      {mt.tmcIndex}
                    </div>
                  </div>

                  <div className="h-44 sm:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <YAxis stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                        <Tooltip contentStyle={{ borderRadius: '16px', background: '#0f172a', color: '#fff', border: 'none' }} />
                        <Area type="monotone" dataKey="storage" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#storageGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            // Android Integration Resources & Manifest files as requested under Extra
            <div className="space-y-6">
              
              <div className="p-4 sm:p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row gap-4">
                <Cpu className="w-10 h-10 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-emerald-950 dark:text-white text-sm sm:text-base">{mt.offlineHeader}</h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                    {mt.offlineDesc}
                  </p>
                </div>
              </div>

              {/* Technical Code Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                {[
                  { id: 'xml', label: 'XML Layout', icon: FileCode },
                  { id: 'kotlin', label: 'Kotlin Fragment', icon: FileCode },
                  { id: 'retrofit', label: 'API Connection', icon: FileCode },
                  { id: 'chart', label: 'Gradle Config', icon: FileCode },
                ].map((tc) => (
                  <button
                    key={tc.id}
                    onClick={() => setActiveCodeTab(tc.id as any)}
                    className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                      activeCodeTab === tc.id
                        ? 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white'
                        : 'border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <tc.icon className="w-3.5 h-3.5" />
                    {tc.label}
                  </button>
                ))}
              </div>

              {/* Code Container */}
              <div className="relative rounded-[1.5rem] sm:rounded-[2rem] bg-slate-950 overflow-hidden border border-slate-850 shadow-md">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex flex-col xs:flex-row gap-2 xs:items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="truncate">
                    {activeCodeTab === 'xml' && 'fragment_tb_dam_monitor.xml'}
                    {activeCodeTab === 'kotlin' && 'TBDamMonitorFragment.kt'}
                    {activeCodeTab === 'retrofit' && 'TBDamApiService.kt'}
                    {activeCodeTab === 'chart' && 'build.gradle'}
                  </span>
                  <button
                    onClick={() => {
                      const code = activeCodeTab === 'xml' ? androidXmlLayout 
                        : activeCodeTab === 'kotlin' ? androidKotlinCode 
                        : activeCodeTab === 'retrofit' ? retrofitCode 
                        : chartCode;
                      handleCopy(code, activeCodeTab);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center justify-center gap-1.5 text-xs font-black transition-all border border-slate-800 hover:border-slate-700 hover:text-white self-end xs:self-auto flex-shrink-0"
                  >
                    {copiedText === activeCodeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 sm:p-6 font-mono text-[10px] sm:text-xs leading-relaxed text-slate-300 max-h-[400px] overflow-x-auto overflow-y-auto whitespace-pre">
                  {activeCodeTab === 'xml' && androidXmlLayout}
                  {activeCodeTab === 'kotlin' && androidKotlinCode}
                  {activeCodeTab === 'retrofit' && retrofitCode}
                  {activeCodeTab === 'chart' && chartCode}
                </div>
              </div>

              {/* Cache Details Card */}
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/60 rounded-[1.8rem] sm:rounded-3xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div>
                  <h5 className="font-black text-slate-900 dark:text-white text-sm sm:text-base">Offline Cache Strategy</h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Designed to function reliably even in heavy rainfall or low network speeds typical of rural farming belts. Telemetry uses standard SharedPreferences cache wrappers internally in Kotlin to display the last updated state when offline.
                  </p>
                </div>
                <div className="flex gap-4 sm:justify-end w-full sm:w-auto">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-center sm:justify-start">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className="block text-[9px] font-black uppercase text-slate-400">{mt.offlineBadge}</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">Supported</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="font-bold flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            TB Dam Live Water Monitor Component
          </span>
          <span className="font-bold font-mono">
            V1.2 Build Done
          </span>
        </div>

      </motion.div>
    </motion.div>
  );
}
