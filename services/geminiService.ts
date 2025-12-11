export const playAnnouncement = async ( 
  text: string,  
  voiceName: VoiceName, 
  onStart?: () => void, 
  onEnd?: () => void, 
  existingContext?: AudioContext 
) => { 
  try { 
    // Vite 환경변수 방식으로 변경
    const apiKey = import.meta.env.VITE_API_KEY || 
                   (typeof __API_KEY__ !== 'undefined' ? __API_KEY__ : '');
 
    console.log('API Key 확인:', {
      length: apiKey?.length || 0,
      exists: !!apiKey,
      prefix: apiKey?.substring(0, 10) + '...' // 처음 10자만 로그
    });
 
    if (!apiKey) { 
      const msg = "❌ API Key 오류\n\n[Netlify 설정 확인]\n1. Site settings → Environment variables\n2. Key: VITE_API_KEY\n3. Value: 실제 API 키 입력\n4. Deploy settings에서 'Clear cache and deploy site' 클릭"; 
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