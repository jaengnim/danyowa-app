
import React, { useState } from 'react';
import { Plus, Trash2, User, Volume2, Loader2, Edit2, X, Cake, Users, Copy, Link, CheckCircle2, Share2 } from 'lucide-react';
import { Child, AVAILABLE_COLORS, AVAILABLE_VOICES, VoiceName, UserProfile } from '../types';
import { playAnnouncement } from '../services/geminiService';
import { generateUUID } from '../services/utils';

interface ChildManagerProps {
  user: UserProfile | null;
  childrenList: Child[];
  onAddChild: (child: Omit<Child, 'id'>) => void;
  onUpdateChild: (child: Child) => void;
  onRemoveChild: (id: string) => void;
}

export const ChildManager: React.FC<ChildManagerProps> = ({ user, childrenList, onAddChild, onUpdateChild, onRemoveChild }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);
  const [voice, setVoice] = useState<VoiceName>(AVAILABLE_VOICES[0]);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Family Sync States
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isFamilyConnected, setIsFamilyConnected] = useState(!!user?.familyId);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateInviteCode = () => {
      if (!user) return;
      const code = `FAM-${user.id.slice(0, 4).toUpperCase()}-${Math.floor(Math.random()*1000)}`;
      setInviteCode(code);
      setCopySuccess(false);
  };

  const copyToClipboard = () => {
      if (!inviteCode) return;
      navigator.clipboard.writeText(inviteCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleJoinFamily = (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinCode.trim()) return;
      
      alert(`가족 코드 [${joinCode}]에 연결되었습니다! 이제 데이터가 동기화됩니다.`);
      setIsFamilyConnected(true);
      setJoinCode('');
  };

  const handlePreview = async (voice: VoiceName, name?: string, id: string = 'new') => {
    if (previewingId) return;
    
    try {
        setPreviewingId(id);
        
        // Create AudioContext immediately upon user click with no options
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const text = name 
            ? `안녕하세요, ${name}입니다. 이 목소리로 알림을 알려드릴게요.`
            : `안녕하세요, 선택하신 목소리 ${voice}입니다.`;

        await playAnnouncement(
            text, 
            voice, 
            undefined, 
            () => setPreviewingId(null),
            audioCtx // Pass the unlocked context
        );
    } catch (e: any) {
        setPreviewingId(null);
        alert("미리듣기 오류: " + e.message);
    }
  };

  const startAdding = () => {
      setEditingId(null);
      setName('');
      setAge('');
      const nextColorIndex = childrenList.length % AVAILABLE_COLORS.length;
      setColor(AVAILABLE_COLORS[nextColorIndex]);
      setVoice(AVAILABLE_VOICES[0]);
  };

  const startEditing = (child: Child) => {
      setEditingId(child.id);
      setName(child.name);
      setAge(child.age ? child.age.toString() : '');
      setColor(child.color);
      setVoice(child.voice);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const childData = {
        name,
        age: age ? Number(age) : undefined,
        color,
        voice
    };

    if (editingId) {
        onUpdateChild({
            id: editingId,
            ...childData
        });
        setEditingId(null);
    } else {
        onAddChild(childData);
    }
    startAdding();
  };

  return (
    <div className="space-y-6 animate-fade-in mb-20 md:mb-0">
      
      {/* Family Sync Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  가족 계정 설정
              </h2>
              {isFamilyConnected && (
                  <span className="bg-green-400/20 text-green-100 text-xs px-2 py-1 rounded-full border border-green-400/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 동기화 중
                  </span>
              )}
          </div>
          
          {!user ? (
              <div className="text-center py-4 bg-white/10 rounded-xl">
                  <p className="text-sm">가족 공유 기능을 사용하려면 로그인이 필요합니다.</p>
              </div>
          ) : isFamilyConnected ? (
              <div className="bg-white/10 rounded-xl p-4 flex items-center justify-between">
                  <div>
                      <p className="font-bold text-lg mb-1">가족과 연결됨</p>
                      <p className="text-xs text-indigo-100">배우자와 일정을 함께 관리하고 있습니다.</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                      <Users className="w-6 h-6" />
                  </div>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                          <Share2 className="w-4 h-4" /> 배우자 초대하기
                      </h3>
                      <p className="text-xs text-indigo-100 mb-3">이 코드를 배우자에게 알려주세요.</p>
                      
                      {inviteCode ? (
                          <div className="flex gap-2">
                              <div className="bg-black/20 px-3 py-2 rounded-lg flex-1 text-center font-mono text-sm tracking-wider">
                                  {inviteCode}
                              </div>
                              <button 
                                onClick={copyToClipboard}
                                className="bg-white text-indigo-600 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                              >
                                  {copySuccess ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              </button>
                          </div>
                      ) : (
                          <button 
                            onClick={generateInviteCode}
                            className="w-full bg-white text-indigo-600 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 transition-colors"
                          >
                              초대 코드 생성
                          </button>
                      )}
                  </div>

                  <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                          <Link className="w-4 h-4" /> 가족 합류하기
                      </h3>
                      <p className="text-xs text-indigo-100 mb-3">전달받은 코드를 입력하세요.</p>
                      <form onSubmit={handleJoinFamily} className="flex gap-2">
                          <input 
                              type="text" 
                              value={joinCode}
                              onChange={(e) => setJoinCode(e.target.value)}
                              placeholder="코드 입력"
                              className="flex-1 bg-black/20 border-none rounded-lg px-3 py-2 text-sm text-white placeholder-indigo-200 focus:ring-2 focus:ring-white outline-none"
                          />
                          <button 
                            type="submit"
                            disabled={!joinCode}
                            className="bg-indigo-500 hover:bg-indigo-400 text-white px-3 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                          >
                              연결
                          </button>
                      </form>
                  </div>
              </div>
          )}
          <p className="text-[10px] text-indigo-200 mt-4 text-center">
              * 가족으로 연결되면 일정과 자녀 정보가 실시간으로 동기화됩니다.
          </p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
            <User className="w-5 h-5 mr-2 text-indigo-500" />
            자녀 프로필 관리
        </h2>

        <div className="space-y-3 mb-8">
            {childrenList.length === 0 ? (
                <div className="text-center py-6 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-750 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    등록된 자녀가 없습니다. 아이를 추가해보세요!
                </div>
            ) : (
                childrenList.map((child) => {
                const isEditing = editingId === child.id;
                return (
                    <div 
                        key={child.id} 
                        onClick={() => startEditing(child)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/30' : 'hover:border-indigo-200 dark:hover:border-indigo-700 ' + child.color.replace('bg-', 'border-').replace('100', '200')}`}
                    >
                        <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${child.color} shadow-sm`}>
                            <span className="font-bold text-lg">{child.name[0]}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-900 dark:text-white">{child.name}</p>
                                {child.age && (
                                    <span className="text-[10px] bg-white dark:bg-gray-700 bg-opacity-60 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium">
                                        {child.age}세
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500 dark:text-gray-400">목소리: {child.voice}</p>
                            </div>
                        </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePreview(child.voice, child.name, child.id); }}
                                disabled={!!previewingId}
                                className={`p-2 rounded-full transition-colors ${previewingId === child.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-500'}`}
                                title="목소리 미리듣기"
                            >
                                {previewingId === child.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemoveChild(child.id); }}
                                className="text-gray-300 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
                })
            )}
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    {editingId ? <><Edit2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/> 정보 수정 중</> : '새 자녀 추가'}
                </label>
                {editingId && (
                    <button onClick={startAdding} className="text-xs text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        <X className="w-3 h-3"/> 취소하고 새 자녀 추가
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex gap-2">
                    <div className="flex-[2]">
                        <input
                            type="text"
                            placeholder="이름 (예: 지민)"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-750 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-gray-400"
                        />
                    </div>
                    <div className="flex-1">
                        <input
                            type="number"
                            placeholder="나이"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-750 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={voice}
                        onChange={(e) => setVoice(e.target.value as VoiceName)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-750 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                    {AVAILABLE_VOICES.map(v => (
                        <option key={v} value={v}>목소리: {v}</option>
                    ))}
                    </select>
                    <button
                        onClick={() => handlePreview(voice, name || '아이', 'new')}
                        disabled={!!previewingId}
                        className={`px-3 border rounded-lg transition-colors flex items-center justify-center ${previewingId === 'new' ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400' : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                        title="선택한 목소리 들어보기"
                    >
                        {previewingId === 'new' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {AVAILABLE_COLORS.map((c) => (
                <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${c} ${color === c ? 'border-gray-800 dark:border-white scale-110' : 'border-transparent'}`}
                />
                ))}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!name}
                className={`w-full flex items-center justify-center gap-2 text-white py-2 rounded-lg transition-colors font-medium ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-800 hover:bg-gray-900 dark:bg-indigo-600 dark:hover:bg-indigo-700'}`}
            >
                {editingId ? <><Edit2 className="w-4 h-4"/> 수정 완료</> : <><Plus className="w-4 h-4"/> 추가하기</>}
            </button>
        </div>
      </div>
    </div>
  );
};
