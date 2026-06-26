import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Target, Eye, Award, X, Sparkles, Check, GraduationCap } from 'lucide-react';
import { Language } from '../constants/translations';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, lang }) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  // Localized Texts for Aim, Vision, and Founder
  const contentMap: Record<Language, {
    title: string;
    founderLabel: string;
    founderName: string;
    founderDegree: string;
    aimTitle: string;
    aimDesc: string;
    visionTitle: string;
    visionDesc: string;
    closeBtn: string;
    dontShowText: string;
    welcomeMsg: string;
  }> = {
    en: {
      title: "Namaste & Welcome!",
      founderLabel: "FOUNDER",
      founderName: "Puneeth Chowdary",
      founderDegree: "BE in Electronics and Communication Engineering",
      aimTitle: "Krishi Mitra – Aim",
      aimDesc: "To empower farmers with modern agricultural knowledge, technology, and support services that improve productivity, reduce costs, and promote sustainable farming practices.",
      visionTitle: "Krishi Mitra – Vision",
      visionDesc: "To become a trusted partner for every farmer by creating a smart, sustainable, and profitable agricultural ecosystem that enhances rural livelihoods and contributes to food security and environmental conservation.",
      closeBtn: "Explore Krishi Mitra",
      dontShowText: "Don't show this of startup again",
      welcomeMsg: "Empowering hands that feed the nation with state-of-the-art agricultural assist tools."
    },
    kn: {
      title: "ನಮಸ್ಕಾರ ಮತ್ತು ಸುಸ್ವಾಗತ ಕೃಷಿ ಮಿತ್ರಕ್ಕೆ!",
      founderLabel: "ಸ್ಥಾಪಕರು",
      founderName: "ಪುನೀತ್ ಚೌದರಿ",
      founderDegree: "ಬಿ.ಇ. (ಎಲೆಕ್ಟ್ರಾನಿಕ್ಸ್ ಮತ್ತು ಕಮ್ಯುನಿಕೇಷನ್ ಇಂಜಿನಿಯರಿಂಗ್)",
      aimTitle: "ಕೃಷಿ ಮಿತ್ರ – ಗುರಿ (Aim)",
      aimDesc: "ರೈತರಿಗೆ ಆಧುನಿಕ ಕೃಷಿ ಜ್ಞಾನ, ತಂತ್ರಜ್ಞಾನ ಮತ್ತು ಬೆಂಬಲ ಸೇವೆಗಳ ಮೂಲಕ ಅಧಿಕ ಉತ್ಪಾದನೆ, ವೆಚ್ಚ ಕಡಿತ ಮತ್ತು ಸುಸ್ಥಿರ ಕೃಷಿ ಪದ್ಧತಿಗಳನ್ನು ಉತ್ತೇಜಿಸಿ ಸಬಲೀಕರಣಗೊಳಿಸುವುದು ಕೃಷಿ ಮಿತ್ರದ ಆಶಯ ಮತ್ತು ಮುಖ್ಯ ಗುರಿಯಾಗಿದೆ.",
      visionTitle: "ಕೃಷಿ ಮಿತ್ರ – ದೂರದೃಷ್ಟಿ (Vision)",
      visionDesc: "ಗ್ರಾಮೀಣ ಜನರ ಆರ್ಥಿಕ ಅಭಿವೃದ್ಧಿ, ಆಹಾರ ಭದ್ರತೆ ಮತ್ತು ಪರಿಸರ ಸಂರಕ್ಷಣೆಗೆ ಕೊಡುಗೆ ನೀಡುವ ಮೂಲಕ ಪ್ರತಿಯೊಬ್ಬ ರೈತರ ಅತ್ಯಂತ ನಂಬಿಕಸ್ಥ ವಿಶ್ವಾಸಾರ್ಹ ಪಾಲುದಾರ ಕೃಷಿ ಮಿತ್ರನಾಗುವುದು ನಮ್ಮ ದೃಷ್ಟಿಕೋನ ಹಾಗೂ ಸಂಕಲ್ಪವಾಗಿದೆ.",
      closeBtn: "ಕೃಷಿ ಮಿತ್ರ ಅನ್ವೇಷಿಸಿ",
      dontShowText: "ಮುಂದಿನ ಬಾರಿ ಇದನ್ನು ತೋರಿಸಬೇಡಿ",
      welcomeMsg: "ದೇಶಕ್ಕೆ ಅನ್ನ ನೀಡುವ ರೈತನ ಕೈಗಳಿಗೆ ಅತ್ಯಾಧುನಿಕ ಸಹಾಯಕ ಪರಿಕರಗಳನ್ನು ಒದಗಿಸುವ ಪ್ರಾಮಾಣಿಕ ಪ್ರಯತ್ನ."
    },
    hi: {
      title: "नमस्ते और स्वागत है!",
      founderLabel: "संस्थापक",
      founderName: "पुनीत चौधरी",
      founderDegree: "बी.ई. (इलेक्ट्रॉनिक्स और कम्युनिकेशन इंजीनियरिंग)",
      aimTitle: "कृषि मित्र – उद्देश्य (Aim)",
      aimDesc: "किसानों को आधुनिक कृषि ज्ञान, तकनीक और सहायता सेवाओं के साथ सशक्त बनाना जिससे उत्पादकता में सुधार हो, लागत कम हो और टिकाऊ कृषि प्रथाओं को बढ़ावा मिले।",
      visionTitle: "कृषि मित्र – दृष्टिकोण (Vision)",
      visionDesc: "एक स्मार्ट, टिकाऊ और लाभदायक कृषि पारिस्थितिकी तंत्र बनाकर हर किसान का भरोसेमंद साथी बनना, जो ग्रामीण आजीविका को बढ़ाए और खाद्य सुरक्षा तथा पर्यावरण संरक्षण में योगदान दे।",
      closeBtn: "कृषि मित्र का अन्वेषण करें",
      dontShowText: "स्टार्टअप पर दोबारा न दिखाएं",
      welcomeMsg: "राष्ट्र का भरण-पोषण करने वाले हाथों को अत्याधुनिक कृषि प्रणालियों से सशक्त बनाना।"
    },
    mr: {
      title: "नमस्ते आणि सुस्वागतम!",
      founderLabel: "संस्थापक",
      founderName: "पुनीत चौधरी",
      founderDegree: "बी.ई. (इलेक्ट्रॉनिक्स आणि कम्युनिकेशन इंजिनिअरिंग)",
      aimTitle: "कृषी मित्र – ध्येय (Aim)",
      aimDesc: "शेतकऱ्यांना आधुनिक कृषी ज्ञान, तंत्रज्ञान आणि सहाय्यक सेवांद्वारे सक्षम करणे ज्यामुळे उत्पादकता वाढेल, खर्च कमी होईल आणि शाश्वत शेती पद्धतींना चालना मिळेल.",
      visionTitle: "कृषी मित्र – दृष्टीकोन (Vision)",
      visionDesc: "एक स्मार्ट, शाश्वत आणि फायदेशीर कृषी परिसंस्था निर्माण करून प्रत्येक शेतकऱ्याचा विश्वासू भागीदार बनणे, ज्यामुळे ग्रामीण जीवनमान सुधारेल आणि अन्न सुरक्षा तसेच पर्यावरण संवर्धनात हातभार लागेल.",
      closeBtn: "कृषी मित्र शोधा",
      dontShowText: "पुन्हा दाखवू नका",
      welcomeMsg: "अन्नदात्यांच्या हातांना आधुनिक तंत्रज्ञानाची जोड देऊन सशक्त बनवणे."
    },
    te: {
      title: "నమస్కారం & సుస్వాగతం!",
      founderLabel: "వ్యవస్థాపకుడు",
      founderName: "పునీత్ చౌదరి",
      founderDegree: "బి.ఇ. (ఎలక్ట్రానిక్స్ అండ్ కమ్యూనికేషన్ ఇంజనీరింగ్)",
      aimTitle: "కృషి మిత్ర – లక్ష్యం (Aim)",
      aimDesc: "రైతులకు ఆధునిక వ్యవసాయ జ్ఞానం, సాంకేతికత మరియు సహాయక సేవల ద్వారా ఉత్పాదకతను మెరుగుపరచడం, ఖర్చులను తగ్గించడం మరియు స్థిరమైన వ్యవసాయ పద్ధతులను ప్రోత్సహించడమే మా లక్ష్యం.",
      visionTitle: "కృషి మిత్ర – విజన్ (Vision)",
      visionDesc: "గ్రామీణ జీవనోపాధిని మెరుగుపరచడం మరియు ఆహార భద్రత, పర్యావరణ పరిరక్షణకు తోడ్పడటం ద్వారా ప్రతి రైతుకు నమ్మకమైన భాగస్వామిగా మారడమే మా విజన్.",
      closeBtn: "కృషి మిత్రను అన్వేషించండి",
      dontShowText: "పరిచయాన్ని మళ్లీ చూపించవద్దు",
      welcomeMsg: "దేశ ప్రగతికి వెన్నెముక అయిన రైతు చేతులకు అధునాతన వ్యవసాయ సహాయక సాంకేతిక పరిజ్ఞానాన్ని అందించడం."
    },
    ta: {
      title: "வணக்கம் & நல்வரவு!",
      founderLabel: "நிறுவனர்",
      founderName: "புனீத் சவுத்ரி",
      founderDegree: "பி.இ. (எலக்ட்ரானிக்ஸ் மற்றும் கம்யூனிகேஷன் இன்ஜினியரிங்)",
      aimTitle: "கிருஷி மித்ரா – நோக்கம் (Aim)",
      aimDesc: "விவசாயிகளுக்கு நவீன விவசாய அறிவு, தொழில்நுட்பம் மற்றும் ஆதரவு சேவைகளை வழங்கி, உற்பத்தியை மேம்படுத்தி, செலவுகளைக் குறைத்து, நிலையான விவசாய முறைகளை ஊக்குவிப்பதே எங்களின் குறிக்கோள்.",
      visionTitle: "கிருஷி மித்ரா – தொலைநோக்கு (Vision)",
      visionDesc: "கிராமப்புற வாழ்வாதாரத்தை மேம்படுத்தி, உணவுப் பாதுகாப்பு மற்றும் சுற்றுச்சூழல் பாதுகாப்பிற்கு பங்களிக்கும் வகையில், ஒரு ஸ்மார்ட், நிலையான மற்றும் இலாபகரமான விவசாய சுற்றுச்சூழல் அமைப்பை உருவாக்குவதன் மூலம் ஒவ்வொரு விவசாயிக்கும் நம்பகமான பங்காளியாக மாறுவது.",
      closeBtn: "கிருஷி மித்ராவை ஆராயுங்கள்",
      dontShowText: "மீண்டும் காட்ட வேண்டாம்",
      welcomeMsg: "நாட்டின் பசியை போக்கும் உழவர்களின் கைகளுக்கு நவீன வேளாண் தொழில்நுட்பங்களை கொண்டு சேர்ப்பது."
    },
    bn: {
      title: "নমস্কার ও সুস্বাগতম!",
      founderLabel: "প্রতিষ্ঠাতা",
      founderName: "পুনীত চৌধুরী",
      founderDegree: "বি.ই. (ইলেক্ট্রনিক্স এবং কমিউনিকেশন ইঞ্জিনিয়ারিং)",
      aimTitle: "কৃষি মিত্র – লক্ষ্য (Aim)",
      aimDesc: "কৃষকদের আধুনিক কৃষি জ্ঞান, প্রযুক্তি এবং সহায়তা পরিষেবার মাধ্যমে ক্ষমতায়ন করা যা উৎপাদনশীলতা বৃদ্ধি করে, খরচ কমায় এবং টেকসই চাষাবাদের প্রচার করে।",
      visionTitle: "কৃষি মিত্র – দৃষ্টিভঙ্গি (Vision)",
      visionDesc: "একটি স্মার্ট, টেকসই এবং লাভজনক কৃষি বাস্তুতন্ত্র তৈরি করে প্রতিটি কৃষকের বিশ্বস্ত অংশীদার হওয়া যা গ্রামীণ জীবিকাকে উন্নত করে এবং খাদ্য নিরাপত্তা ও পরিবেশ সংরক্ষণে অবদান রাখে।",
      closeBtn: "কৃষি মিত্র অন্বেষণ করুন",
      dontShowText: "স্টার্টআপে পুনরায় প্রদর্শন করবেন না",
      welcomeMsg: "দেশের অন্নদাতাদের জন্য সবচেয়ে নির্ভরযোগ্য মোবাইল কৃষি বন্ধু এবং পরামর্শক।"
    }
  };

  const curr = contentMap[lang] || contentMap.en;

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('km_welcome_seen_forever2', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col my-auto"
      >
        {/* Animated Background Ornaments */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 pb-0 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Krishi Mitra Identity</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[70vh] relative z-10">
          
          {/* Welcome Branding */}
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {curr.title}
            </h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              {curr.welcomeMsg}
            </p>
          </div>

          {/* Founder Section */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-emerald-50/50 dark:from-slate-900 dark:to-slate-950 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Visual Icon/Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md text-xl font-black font-mono">
                PC
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white dark:border-slate-900">
                <Award className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded text-[9px] font-black tracking-widest uppercase mb-1">
                {curr.founderLabel}
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5 ring-offset-emerald-500">
                {curr.founderName}
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1 leading-normal">
                <GraduationCap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="break-words">{curr.founderDegree}</span>
              </p>
            </div>
          </div>

          {/* Aim & Vision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* AIM CARD */}
            <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 dark:border-emerald-500/20 flex flex-col justify-between hover:border-emerald-500/20 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h5 className="text-base font-black text-emerald-950 dark:text-emerald-200 mb-2 leading-none">
                  {curr.aimTitle}
                </h5>
                <p className="text-xs font-medium text-slate-600 dark:text-emerald-300/80 leading-relaxed">
                  {curr.aimDesc}
                </p>
              </div>
            </div>

            {/* VISION CARD */}
            <div className="p-6 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/20 flex flex-col justify-between hover:border-indigo-500/20 transition-all">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                  <Eye className="w-5 h-5" />
                </div>
                <h5 className="text-base font-black text-indigo-950 dark:text-indigo-200 mb-2 leading-none">
                  {curr.visionTitle}
                </h5>
                <p className="text-xs font-medium text-slate-600 dark:text-indigo-300/80 leading-relaxed">
                  {curr.visionDesc}
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Action Bottom Section */}
        <div className="p-6 pt-0 border-t border-slate-50 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center sm:justify-between gap-4 relative z-10">
          <label className="flex items-center gap-2.5 cursor-pointer group select-none self-start sm:self-center">
            <div className="relative">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                dontShowAgain 
                  ? 'bg-emerald-600 border-emerald-600 text-white' 
                  : 'border-slate-300 hover:border-emerald-500 dark:border-slate-700'
              }`}>
                {dontShowAgain && <Check className="w-3.5 h-3.5 stroke-[4px]" />}
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {curr.dontShowText}
            </span>
          </label>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 dark:shadow-none"
          >
            <span>{curr.closeBtn}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
