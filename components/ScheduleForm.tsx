
import React, { useState, useEffect } from 'react';
import { ScheduleItem, Child, DAYS_OF_WEEK, Activity } from '../types';
import { X, Clock, Calendar, Repeat, BellRing, Trash2, UserMinus, Building2, Package, Car } from 'lucide-react';

interface ScheduleFormProps {
  childrenList: Child[];
  activities: Activity[];
  onSave: (item: Omit<ScheduleItem, 'id'>, isEdit: boolean) => void;
  onDelete?: () => void;
  onSkip?: () => void;
  onClose: () => void;
  initialDate?: { day: number, time: string };
  initialData?: ScheduleItem;
}

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  childrenList, 
  activities,
  onSave, 
  onDelete,
  onSkip,
  onClose, 
  initialDate,
  initialData 
}) => {
  const isEditMode = !!initialData;

  const [childId, setChildId] = useState(() => {
      if (initialData) return initialData.childId;
      return childrenList[0]?.id || '';
  });

  useEffect(() => {
    if (!childId && childrenList.length > 0) {
        setChildId(childrenList[0].id);
    }
  }, [childrenList, childId]);

  const [title, setTitle] = useState(() => initialData?.title || '');
  
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
      if (initialData) return [initialData.dayOfWeek];
      if (initialDate) return [initialDate.day];
      return [1]; // Default to Monday
  });

  const [startTime, setStartTime] = useState(() => initialData?.startTime || initialDate?.time || '14:00');
  
  const [endTime, setEndTime] = useState(() => {
      if (initialData) return initialData.endTime;
      if (initialDate) {
          const [h, m] = initialDate.time.split(':').map(Number);
          const endH = h + 1;
          return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      }
      return '15:00';
  });

  const [notifyMinutesBefore, setNotifyMinutesBefore] = useState(() => initialData?.notifyMinutesBefore ?? 10);
  const [pickupNotifyMinutesBefore, setPickupNotifyMinutesBefore] = useState(() => initialData?.pickupNotifyMinutesBefore);
  const [fee, setFee] = useState(() => initialData?.fee || 0);
  const [paymentCycleDay, setPaymentCycleDay] = useState(() => initialData?.paymentCycleDay || 1);
  const [supplies, setSupplies] = useState(() => initialData?.supplies || '');

  const toggleDay = (dayIdx: number) => {
    if (isEditMode) {
        setSelectedDays([dayIdx]);
        return;
    }

    if (selectedDays.includes(dayIdx)) {
      if (selectedDays.length === 1) return;
      setSelectedDays(selectedDays.filter(d => d !== dayIdx));
    } else {
      setSelectedDays([...selectedDays, dayIdx].sort());
    }
  };

  const handleActivityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const activity = activities.find(a => a.id === selectedId);
    if (activity) {
        setTitle(activity.name);
        setFee(activity.defaultFee);
        setPaymentCycleDay(activity.defaultPaymentDay);
        if (activity.supplies) setSupplies(activity.supplies);
    } else {
        setTitle('');
        setFee(0);
        setPaymentCycleDay(1);
        setSupplies('');
    }
  };

  const currentActivityId = activities.find(a => a.name === title)?.id || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!childId) {
        alert("자녀를 선택해주세요.");
        return;
    }
    if (!title.trim()) {
        alert("일정(학원)을 선택해주세요.");
        return;
    }
    if (selectedDays.length === 0) {
        alert("요일을 선택해주세요.");
        return;
    }

    const scheduleData = {
        childId,
        title,
        startTime,
        endTime,
        notifyMinutesBefore,
        pickupNotifyMinutesBefore,
        fee,
        paymentCycleDay,
        supplies
    };

    try {
        if (isEditMode) {
            onSave({
                ...scheduleData,
                dayOfWeek: selectedDays[0],
            }, true);
        } else {
            selectedDays.forEach(day => {
                onSave({
                    ...scheduleData,
                    dayOfWeek: day,
                }, false);
            });
        }
        onClose();
    } catch (err) {
        console.error("Failed to save schedule:", err);
        alert("일정 저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-750 sticky top-0 z-10">
          <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/> 
            {isEditMode ? '일정 수정' : '새 일정 추가'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">아이 선택</label>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {childrenList.map(child => (
                    <button
                        key={child.id}
                        type="button"
                        onClick={() => setChildId(child.id)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap
                            ${childId === child.id 
                                ? `${child.color} ring-2 ring-offset-1 ring-indigo-200 dark:ring-indigo-700` 
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}
                        `}
                    >
                        <span className={`w-2 h-2 rounded-full ${child.color.split(' ')[0].replace('100', '400')}`} />
                        <span className="font-medium text-sm">{child.name}</span>
                    </button>
                ))}
            </div>
            {childrenList.length === 0 && <p className="text-xs text-red-500 mt-1">등록된 자녀가 없습니다. 자녀를 먼저 등록해주세요.</p>}
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                학원/활동 선택
             </label>
             <select
                required
                value={currentActivityId}
                onChange={handleActivityChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
             >
                 <option value="">일정을 선택해주세요</option>
                 {activities.map(act => (
                     <option key={act.id} value={act.id}>{act.name}</option>
                 ))}
             </select>
             {activities.length === 0 && (
                 <p className="text-xs text-red-500 mt-1">
                     등록된 학원/활동이 없습니다. '학원 관리' 탭에서 먼저 등록해주세요.
                 </p>
             )}
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Package className="w-4 h-4 text-gray-500 dark:text-gray-400"/> 준비물
             </label>
             <input
                type="text"
                value={supplies}
                onChange={(e) => setSupplies(e.target.value)}
                placeholder="예: 실내화, 물통"
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
             />
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Repeat className="w-4 h-4 text-gray-500 dark:text-gray-400"/> {isEditMode ? '요일 변경' : '반복 요일 선택'}
             </label>
             <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${selectedDays.includes(idx)
                                ? 'bg-indigo-600 text-white shadow-md scale-110'
                                : 'bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-400'}
                        `}
                    >
                        {day}
                    </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" /> 시작 시간
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                 종료 시간
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <BellRing className="w-4 h-4 text-gray-500 dark:text-gray-400"/> 시작 알림 (미리 알림)
             </label>
             <div className="flex gap-2 flex-wrap">
                 {[0, 5, 10, 20, 30, 60].map(mins => (
                     <button
                        key={mins}
                        type="button"
                        onClick={() => setNotifyMinutesBefore(mins)}
                        className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                            ${notifyMinutesBefore === mins 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}
                        `}
                     >
                        {mins === 0 ? '정각' : `${mins}분 전`}
                     </button>
                 ))}
             </div>
          </div>

          <div>
             <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                <Car className="w-4 h-4 text-gray-500 dark:text-gray-400"/> 하원/픽업 알림 (종료 전)
             </label>
             <div className="flex gap-2 flex-wrap">
                 {[
                     { val: undefined, label: 'OFF' },
                     { val: 0, label: '정각' },
                     { val: 5, label: '5분 전' },
                     { val: 10, label: '10분 전' },
                     { val: 20, label: '20분 전' },
                     { val: 30, label: '30분 전' }
                 ].map(opt => (
                     <button
                        key={String(opt.val)}
                        type="button"
                        onClick={() => setPickupNotifyMinutesBefore(opt.val)}
                        className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                            ${pickupNotifyMinutesBefore === opt.val 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300' 
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'}
                        `}
                     >
                        {opt.label}
                     </button>
                 ))}
             </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 font-bold text-lg transition-all shadow-lg shadow-indigo-200 dark:shadow-none mt-2 active:scale-[0.98]"
          >
            {isEditMode ? '수정 내용 저장' : '일정 등록하기'}
          </button>
          
          {isEditMode && (
              <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                  <button
                    type="button"
                    onClick={() => { if(confirm('오늘(이번 주) 결석 처리하시겠습니까? 이번 알림이 울리지 않습니다.')) onSkip?.(); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium text-sm transition-colors"
                  >
                     <UserMinus className="w-4 h-4" />
                     결석
                  </button>
                  <button
                    type="button"
                    onClick={() => { if(confirm('이 일정을 영구적으로 삭제하시겠습니까?')) onDelete?.(); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium text-sm transition-colors"
                  >
                     <Trash2 className="w-4 h-4" />
                     삭제
                  </button>
              </div>
          )}
        </form>
      </div>
    </div>
  );
};
