let activeAudios = new Set<HTMLAudioElement>();

export function registerAudio(audio: HTMLAudioElement) {
  activeAudios.add(audio);
  audio.addEventListener('ended', () => {
    activeAudios.delete(audio);
  });
  audio.addEventListener('pause', () => {
    activeAudios.delete(audio);
  });
}

export function stopGlobalSpeech() {
  activeAudios.forEach(audio => {
    try {
      audio.pause();
    } catch (_) {}
  });
  activeAudios.clear();
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  
  // 1. Remove markdown styling (bold, italic)
  let cleaned = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1');

  // 2. Remove markdown headings and bullet characters
  cleaned = cleaned
    .replace(/^#+\s+/gm, '') // headings
    .replace(/^[-*+]\s+/gm, '') // bullet lists
    .replace(/^\d+\.\s+/gm, ''); // sequential lists

  // 3. Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, '');

  // 4. Expand common abbreviations to sound natural/human
  cleaned = cleaned
    .replace(/\bs\/o\b/gi, 'son of')
    .replace(/\bd\/o\b/gi, 'daughter of')
    .replace(/\bw\/o\b/gi, 'wife of')
    .replace(/\brtc\b/gi, 'R T C')
    .replace(/\bgovt\.\b/gi, 'government')
    .replace(/\bkg\b/gi, 'kilograms')
    .replace(/\bha\b/gi, 'hectares')
    .replace(/\bac\b/gi, 'acres')
    .replace(/\bvs\b/gi, 'versus');

  // 5. Clean emojis and bracket links (e.g. [Link](url) or [1])
  cleaned = cleaned
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\[\d+\]/g, '')
    // remove typical emojis that cause weird silences
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, '');

  return cleaned.trim();
}

export async function getFarmerData(location: string, lang: string = 'English') {
  const res = await fetch("/api/farmer-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, lang })
  });
  if (!res.ok) {
    throw new Error("Backend failed to fetch farmer data");
  }
  return await res.json();
}

export async function getAgriContacts(location: string, lang: string = 'English') {
  const res = await fetch("/api/agri-contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, lang })
  });
  if (!res.ok) {
    throw new Error("Backend failed to fetch agri contacts");
  }
  return await res.json();
}

export async function chatWithChitti(message: string, lang: string = 'English', context?: { crop?: string, location?: string, sowingDate?: string }) {
  const res = await fetch("/api/chat-chitti", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, lang, context })
  });
  if (!res.ok) {
    throw new Error("Backend failed to chat with Chitti");
  }
  const data = await res.json();
  return data.text;
}

export async function* chatWithChittiStream(
  message: string, 
  lang: string = 'English', 
  context?: { crop?: string, location?: string, sowingDate?: string }
) {
  const response = await fetch("/api/chat-chitti-stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, lang, context }),
  });

  if (!response.body) {
    throw new Error("No response body received from server");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine.startsWith("data: ")) continue;

      const rawData = cleanLine.slice(6).trim();
      if (rawData === "[DONE]") return;

      try {
        const parsed = JSON.parse(rawData);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        if (parsed.text) {
          yield { text: parsed.text };
        }
      } catch (err) {
        console.error("Error parsing stream chunk", err);
      }
    }
  }
}

export async function transcribeAudio(base64Audio: string) {
  const res = await fetch("/api/transcribe-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Audio })
  });
  if (!res.ok) {
    throw new Error("Backend failed to transcribe audio");
  }
  const data = await res.json();
  return data.text;
}

export async function analyzeLeaf(base64Image: string, lang: string = 'English') {
  const res = await fetch("/api/analyze-leaf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64Image, lang })
  });
  if (!res.ok) {
    throw new Error("Backend failed to analyze leaf");
  }
  return await res.json();
}

export async function generateSpeech(text: string) {
  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText) return null;

  try {
    const res = await fetch("/api/generate-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanedText })
    });
    if (res.ok) {
      const { base64Audio } = await res.json();
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const wavHeader = new ArrayBuffer(44);
        const view = new DataView(wavHeader);
        
        view.setUint32(0, 0x52494646, false);
        view.setUint32(4, 36 + len, true);
        view.setUint32(8, 0x57415645, false);
        view.setUint32(12, 0x666d7420, false);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, 24000, true);
        view.setUint32(28, 24000 * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        view.setUint32(36, 0x64617461, false);
        view.setUint32(40, len, true);
        
        const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
        return URL.createObjectURL(blob);
      }
    }
  } catch (err) {
    console.warn("Server TTS failed, using browser speech synthesis fallback:", err);
  }

  // Fallback to local browser speech synthesis
  if (typeof window !== "undefined" && window.speechSynthesis) {
    let langCode = 'en-IN';
    if (/[\u0C80-\u0CFF]/.test(cleanedText)) langCode = 'kn-IN';
    else if (/[\u0900-\u097F]/.test(cleanedText)) langCode = 'hi-IN';
    else if (/[\u0C00-\u0C7F]/.test(cleanedText)) langCode = 'te-IN';
    else if (/[\u0B80-\u0BFF]/.test(cleanedText)) langCode = 'ta-IN';
    else if (/[\u0980-\u09FF]/.test(cleanedText)) langCode = 'bn-IN';

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = langCode;
      window.speechSynthesis.speak(utterance);
    } catch (synthErr) {
      console.error("SpeechSynthesis speak failed:", synthErr);
    }

    // Return a dummy 1-second silencer WAV so the caller's Audio constructor and play() loop don't crash
    const dummyHeader = new ArrayBuffer(44);
    const view = new DataView(dummyHeader);
    view.setUint32(0, 0x52494646, false);
    view.setUint32(4, 36 + 2000, true);
    view.setUint32(8, 0x57415645, false);
    view.setUint32(12, 0x666d7420, false);
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true);
    view.setUint32(28, 8000 * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x64617461, false);
    view.setUint32(40, 2000, true);
    const dummyBytes = new Uint8Array(2000);
    const blob = new Blob([dummyHeader, dummyBytes], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
  return null;
}

export async function getProactiveAdvice(lang: string, context: { crop?: string, location?: string, sowingDate?: string }, weatherData: any) {
  const res = await fetch("/api/proactive-advice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lang, context, weatherData })
  });
  if (!res.ok) {
    throw new Error("Backend failed to fetch proactive advice");
  }
  return await res.json();
}
