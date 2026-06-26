import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, X, Mic, Square, Volume2, VolumeX } from 'lucide-react';
import { chatWithChittiStream, generateSpeech, transcribeAudio, stopGlobalSpeech, registerAudio } from '@/src/services/gemini';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { GenerateContentResponse } from '@google/genai';

import { translations, Language } from '../constants/translations';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function Chatbox({ 
  lang, 
  onClose,
  crop,
  location,
  sowingDate
}: { 
  lang: Language, 
  onClose: () => void,
  crop?: string,
  location?: string,
  sowingDate?: string
}) {
  const t = translations[lang];
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t.subWelcome }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isActiveRef = useRef(true);
  
  // TTS Queue Logic
  const ttsQueueRef = useRef<string[]>([]);
  const processedSentencesRef = useRef<Set<string>>(new Set());
  const isProcessingQueueRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    isActiveRef.current = true;
    return () => {
      isActiveRef.current = false;
      stopSpeaking();
      stopGlobalSpeech();
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const stopSpeaking = () => {
    stopGlobalSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    ttsQueueRef.current = [];
    processedSentencesRef.current.clear();
    isProcessingQueueRef.current = false;
    setIsSpeaking(false);
  };

  const processTTSQueue = async () => {
    if (isProcessingQueueRef.current || ttsQueueRef.current.length === 0 || isMuted || !isActiveRef.current) return;
    
    isProcessingQueueRef.current = true;
    setIsSpeaking(true);

    while (ttsQueueRef.current.length > 0 && isActiveRef.current) {
      const text = ttsQueueRef.current.shift();
      if (!text) continue;

      try {
        const audioUrl = await generateSpeech(text);
        if (!isActiveRef.current) break;
        if (audioUrl) {
          await new Promise<void>((resolve, reject) => {
            if (!isActiveRef.current) {
              resolve();
              return;
            }
            const audio = new Audio(audioUrl);
            registerAudio(audio);
            audioRef.current = audio;
            audio.onended = () => {
              audioRef.current = null;
              resolve();
            };
            audio.onerror = (e) => {
              console.error("Audio playback error", e);
              audioRef.current = null;
              resolve(); // Resolve to avoid blocking queue
            };
            audio.play().catch(resolve);
          });
        }
      } catch (err) {
        console.error("TTS Queue processing error:", err);
      }
    }

    if (isActiveRef.current) {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
    }
  };

  const queueSentence = (fullText: string) => {
    if (isMuted) return;
    
    // Split by common sentence terminators
    const sentences = fullText.split(/([.!?।])\s+/);
    let currentSentence = "";
    
    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      if (part.match(/[.!?।]/)) {
        const completeSentence = (currentSentence + part).trim();
        if (completeSentence && !processedSentencesRef.current.has(completeSentence)) {
          processedSentencesRef.current.add(completeSentence);
          ttsQueueRef.current.push(completeSentence);
          processTTSQueue();
        }
        currentSentence = "";
      } else {
        currentSentence = part;
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Audio visualizer setup
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const updateLevel = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average);
        requestAnimationFrame(updateLevel);
      };
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          handleVoiceCommand(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
        setAudioLevel(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      updateLevel();
      stopSpeaking();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert(t.micError);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceCommand = async (base64Audio: string) => {
    setIsLoading(true);
    try {
      const transcription = await transcribeAudio(base64Audio);
      if (transcription) {
        handleSend(transcription);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Transcription failed:", err);
      setIsLoading(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageToSend = textOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    stopSpeaking();
    if (!textOverride) setInput('');
    
    setMessages(prev => [...prev, { role: 'user', content: messageToSend.trim() }]);
    setIsLoading(true);

    try {
      const langMap: Record<string, string> = {
        en: 'English', hi: 'Hindi', mr: 'Marathi', te: 'Telugu', ta: 'Tamil', kn: 'Kannada', bn: 'Bengali'
      };
      
      const stream = await chatWithChittiStream(messageToSend.trim(), langMap[lang] || 'English', { crop, location, sowingDate });
      
      setIsLoading(false);
      let fullResponse = '';
      
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullResponse += text;
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.content = fullResponse;
          }
          return newMessages;
        });

        // Queue sentences as they arrive
        queueSentence(fullResponse);
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
          lastMsg.isStreaming = false;
        }
        return newMessages;
      });

      // Handle any remaining text that didn't end with a terminator
      if (fullResponse && !isMuted) {
        const remaining = fullResponse.trim();
        if (remaining && !processedSentencesRef.current.has(remaining)) {
          // Check if the last part is actually a sentence or just the end of the text
          const lastSentences = remaining.split(/[.!?।]\s+/);
          const lastPart = lastSentences[lastSentences.length - 1];
          if (lastPart && !processedSentencesRef.current.has(lastPart)) {
            ttsQueueRef.current.push(lastPart);
            processTTSQueue();
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: t.chatError }]);
      setIsLoading(false);
    }
  };

  const replayLastResponse = async () => {
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAssistantMsg && lastAssistantMsg.content && !isSpeaking) {
      setIsSpeaking(true);
      const audioUrl = await generateSpeech(lastAssistantMsg.content);
      if (!isActiveRef.current) {
        setIsSpeaking(false);
        return;
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        registerAudio(audio);
        audioRef.current = audio;
        audio.onended = () => {
          if (isActiveRef.current) setIsSpeaking(false);
        };
        audio.play().catch(() => {
          if (isActiveRef.current) setIsSpeaking(false);
        });
      } else {
        setIsSpeaking(false);
      }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="fixed bottom-20 right-4 w-[calc(100vw-2rem)] sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col z-50 overflow-hidden"
    >
      <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full bg-white/20 flex items-center justify-center transition-all",
            isSpeaking && "ring-4 ring-white/30 scale-110"
          )}>
            <Bot className={cn("w-6 h-6", isSpeaking && "animate-pulse")} />
          </div>
          <div>
            <h3 className="font-semibold">{t.chittiAI}</h3>
            <span className="text-xs text-emerald-100 flex items-center gap-1">
              {isSpeaking ? (
                <span className="flex items-center gap-1">
                  <Mic className="w-3 h-3 animate-bounce" />
                  {t.chittiSpeaking}
                </span>
              ) : (
                <>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  {t.online}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setIsMuted(!isMuted);
            }} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title={isMuted ? t.unmute : t.mute}
          >
            {isMuted ? <VolumeX className="w-5 h-5 opacity-50" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[80%] p-3 rounded-2xl text-sm shadow-sm",
              msg.role === 'user' 
                ? "bg-emerald-600 text-white rounded-tr-none" 
                : "bg-white text-zinc-800 border border-zinc-100 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-zinc-100 shadow-sm">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-zinc-100">
        <div className="flex flex-col gap-3">
          {isRecording && (
            <div className="flex items-center justify-center gap-1 h-8">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    height: [8, Math.max(8, audioLevel * (0.5 + Math.random())), 8],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity, 
                    delay: i * 0.05 
                  }}
                  className="w-1 bg-emerald-500 rounded-full"
                />
              ))}
              <span className="ml-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest animate-pulse">
                {t.listening}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative group">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? t.listening : t.askChitti}
                disabled={isRecording}
                className="w-full bg-zinc-100 border-none rounded-2xl pl-4 pr-12 py-3 text-sm text-zinc-900 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 transition-all"
              />
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all",
                  isRecording 
                    ? "bg-red-500 text-white shadow-lg shadow-red-200" 
                    : "text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50"
                )}
                title={isRecording ? t.stopRecording : t.voiceCommand}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || (!input.trim() && !isRecording)}
              className="p-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-emerald-100"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
