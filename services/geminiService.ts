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

    console.log('API Key 확인:', {
      length: apiKey?.length || 0,
      exists: !!apiKey,
      prefix: apiKey ? apiKey.substring(0, 10) + '...' : 'EMPTY'
    });

    if (!apiKey) {
      const msg = "❌ API Key 오류\n\n[Vercel 설정 확인]\n1. Project Settings → Environment Variables\n2. Key: VITE_API_KEY\n3. Value: 실제 Gemini API 키 입력\n4. Redeploy 실행";
      console.error(msg);
      alert(msg);
      if (onEnd) onEnd();
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
    alert(`오류 발생:\n${error.message || JSON.stringify(error)}`);
    if (onEnd) onEnd();
  }
};