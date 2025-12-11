
import React, { useState } from 'react';
import { BriefingSettings, DAYS_OF_WEEK } from '../types';
import { X, Clock, Calendar, Mic, Power } from 'lucide-react';

interface BriefingSettingsProps {
  settings: BriefingSettings;
  onSave: (settings: BriefingSettings) => void;
  onClose: () => void;
}

export const BriefingSettingsModal: React.FC<BriefingSettingsProps> = ({ settings, onSave, onClose }) => {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [time, setTime] = useState(settings.time);
  const [days, setDays] = useState<number[]>(settings.days);

  const toggleDay = (dayIdx: number) => {
    if (days.includes(dayIdx)) {
      setDays(days.filter(d => d !== dayIdx));
    } else {
      setDays([...days, dayIdx].sort());
    }
  };

  const handleSave = () => {
    onSave({ enabled, time, days });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/> 
            자동 브리핑 설정
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between">
              <div>
                  <label className="font-bold text-gray-800 dark:text-white block">자동 실행</label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">설정된 시간에 자동으로 브리핑합니다.</p>
              </div>
              <button 
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 flex items-center justify-center ${enabled ? 'translate-x-6' : 'translate-x-0'}`}>
                      <Power className={`w-3 h-3 ${enabled ? 'text-indigo-600' : 'text-gray-400'}`} />
                  </div>
              </button>
          </div>

          <div className={`space-y-5 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              {/* Time Picker */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" /> 실행 시간
                </label>
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold text-lg"
                />
              </div>

              {/* Day Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" /> 반복 요일
                </label>
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-750 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    {DAYS_OF_WEEK.map((day, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleDay(idx)}
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${days.includes(idx)
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-gray-600'}
                            `}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {days.length === 0 ? '요일을 선택해주세요' : 
                     days.length === 7 ? '매일 실행됩니다' : 
                     days.map(d => DAYS_OF_WEEK[d]).join(', ') + '요일에 실행됩니다'}
                </p>
              </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-200 dark:shadow-none mt-2"
          >
            설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
