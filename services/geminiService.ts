import { GoogleGenAI, Modality } from '@google/genai';
import { VoiceName } from '../types';

// Base64 decode helper
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// PCM to AudioBuffer decoder
async function decodeAudioData(
  pcmData: Uint8Array,
  audioContext: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const numSamples = pcmData.length / 2;
  const audioBuffer = audioContext.createBuffer(numChannels, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const sample = (pcmData[i * 2] | (pcmData[i * 2 + 1] << 8));
    channelData[i] = sample < 32768 ? sample / 32768 : (sample - 65536) / 32768;
  }

  return audioBuffer;
}

// Web Speech API Fallback
const playFallbackTTS = (text: string, onStart?: () => void, onEnd?: () => void) => {
  console.log('Using fallback TTS');

  // 취소 후 재생 (중복 방지)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ko-KR';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  utterance.onstart = () => {
    if (onStart) onStart();
  };

  utterance.onend = () => {
    if (onEnd) onEnd();
  };

  utterance.onerror = (e) => {
    console.error('Fallback TTS error:', e);
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const playAnnouncement = async (
  text: string,
  voiceName: VoiceName,
  onStart?: () => void,
  onEnd?: () => void,
  existingContext?: AudioContext
) => {
  try {
    // Vite 환경변수에서 API 키 읽기
    const apiKey = import.meta.env.VITE_API_KEY || '';

    if (!apiKey) {
      console.warn("API Key 없음, Fallback TTS 사용");
      playFallbackTTS(text, onStart, onEnd);
      return;
    }

    const audioContext = existingContext || new (window.AudioContext || (window as any).webkitAudioContext)();

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("Gemini로부터 오디오 데이터를 받지 못했습니다.");
    }

    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      audioContext,
      24000,
      1
    );

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);

    source.onended = () => {
      if (onEnd) onEnd();
      if (!existingContext) {
        audioContext.close();
      }
    };

    if (onStart) onStart();
    source.start();

  } catch (error: any) {
    console.error("❌ 재생 오류:", error);

    // 에러 메시지 분석
    const errorMsg = error.message || JSON.stringify(error);

    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      // 할당량 초과 시 Fallback TTS 자동 실행
      console.log("Gemini Quota Exceeded. Switching to Fallback TTS.");
      playFallbackTTS(text, onStart, onEnd);
    } else if (errorMsg.includes('API Key')) {
      playFallbackTTS(text, onStart, onEnd);
    } else {
      // 기타 에러 시에도 Fallback 시도
      console.warn('Unknown TTS Error. Switching to Fallback TTS.');
      playFallbackTTS(text, onStart, onEnd);
    }
  }
};