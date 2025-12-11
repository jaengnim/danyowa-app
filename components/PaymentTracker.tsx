
import React, { useState, useEffect } from 'react';
import { ScheduleItem, Child, Activity } from '../types';
import { CheckCircle, AlertCircle, CreditCard, PieChart, Calendar, Building2, GraduationCap, Baby, MoreHorizontal, Package, Plus, X, User } from 'lucide-react';

interface PaymentTrackerProps {
  schedules: ScheduleItem[];
  childrenList: Child[];
  activities: Activity[];
  onMarkPaid: (scheduleId: string, date: string) => void;
  onAddSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
}

// Helper to get category icon
const getCategoryIcon = (category: string) => {
    switch(category) {
        case 'ACADEMY': return Building2;
        case 'SCHOOL': return GraduationCap;
        case 'KINDERGARTEN': return Baby;
        default: return MoreHorizontal;
    }
};

type PaymentGroup = {
    key: string;
    childId: string;
    title: string;
    ids: string[];
    fees: number[];
    paymentCycleDays: number[];
    lastPaidDates: string[];
    supplies: string[];
};

export const PaymentTracker: React.FC<PaymentTrackerProps> = ({ schedules, childrenList, activities, onMarkPaid, onAddSchedule }) => {
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);

  // Add Payment Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enrollChildId, setEnrollChildId] = useState('');
  const [enrollActivityId, setEnrollActivityId] = useState('');
  const [enrollFee, setEnrollFee] = useState('');
  const [enrollPayDay, setEnrollPayDay] = useState('1');
  const [enrollPaidThisMonth, setEnrollPaidThisMonth] = useState(false);

  // Initialize modal defaults
  useEffect(() => {
    if (isAddModalOpen) {
        setEnrollChildId(childrenList[0]?.id || '');
        setEnrollActivityId(activities[0]?.id || '');
    }
  }, [isAddModalOpen, childrenList, activities]);

  // Update fee/payday when activity changes
  useEffect(() => {
      const act = activities.find(a => a.id === enrollActivityId);
      if (act) {
          setEnrollFee(act.defaultFee > 0 ? act.defaultFee.toString() : '');
          setEnrollPayDay(act.defaultPaymentDay > 0 ? act.defaultPaymentDay.toString() : '1');
      }
  }, [enrollActivityId, activities]);

  const handleEnrollSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!enrollChildId || !enrollActivityId) return;

      const act = activities.find(a => a.id === enrollActivityId);
      if (!act) return;

      onAddSchedule({
          childId: enrollChildId,
          title: act.name,
          dayOfWeek: 8, // Hidden day (not 0-6)
          startTime: '00:00',
          endTime: '00:00',
          notifyMinutesBefore: 0,
          pickupNotifyMinutesBefore: undefined,
          fee: Number(enrollFee) || 0,
          paymentCycleDay: Number(enrollPayDay) || 1,
          supplies: act.supplies,
          lastPaidDate: enrollPaidThisMonth ? new Date().toISOString().split('T')[0] : undefined
      });

      setIsAddModalOpen(false);
  };

  // Group schedules by Child + Title to create unique payment entries
  const groupedItems = schedules.reduce((acc, item) => {
      const key = `${item.childId}-${item.title}`;
      if (!acc[key]) {
          acc[key] = {
              key,
              childId: item.childId,
              title: item.title,
              ids: [],
              fees: [],
              paymentCycleDays: [],
              lastPaidDates: [],
              supplies: []
          };
      }
      acc[key].ids.push(item.id);
      acc[key].fees.push(item.fee);
      acc[key].paymentCycleDays.push(item.paymentCycleDay);
      if (item.lastPaidDate) acc[key].lastPaidDates.push(item.lastPaidDate);
      if (item.supplies) acc[key].supplies.push(item.supplies);
      
      return acc;
  }, {} as Record<string, PaymentGroup>);

  const uniquePaymentItems = Object.values(groupedItems).map((group: PaymentGroup) => {
      const maxFee = Math.max(...group.fees, 0);
      const cycleDay = group.paymentCycleDays.find(d => d > 0) || 1;
      const lastPaid = group.lastPaidDates.sort().pop();
      const matchedActivity = activities.find(a => a.name === group.title);

      return {
          ...group,
          fee: maxFee,
          paymentCycleDay: cycleDay,
          lastPaidDate: lastPaid,
          activity: matchedActivity
      };
  }).filter(item => item.fee > 0);

  const getChild = (id: string) => childrenList.find(c => c.id === id);

  const totalMonthlyFee = uniquePaymentItems.reduce((sum, item) => sum + item.fee, 0);
  
  const feesByChild = childrenList.map(child => {
      const total = uniquePaymentItems
        .filter(item => item.childId === child.id)
        .reduce((sum, item) => sum + item.fee, 0);
      return { ...child, total };
  }).filter(c => c.total > 0);

  const isPaidForCurrentCycle = (lastPaidDate?: string, cycleDay: number = 1) => {
    if (!lastPaidDate) return false;
    
    const today = new Date();
    let latestDueDate = new Date(today.getFullYear(), today.getMonth(), cycleDay);
    if (today.getDate() < cycleDay) {
        latestDueDate.setMonth(latestDueDate.getMonth() - 1);
    }
    latestDueDate.setHours(0, 0, 0, 0);

    const lastPaid = new Date(lastPaidDate);
    const lastPaidNormalized = new Date(lastPaid.getFullYear(), lastPaid.getMonth(), lastPaid.getDate());
    
    return lastPaidNormalized >= latestDueDate;
  };

  const handleConfirmPaid = () => {
      if (selectedGroupKey && paidDate) {
          const group = uniquePaymentItems.find(g => g.key === selectedGroupKey);
          if (group) {
              group.ids.forEach(id => {
                  onMarkPaid(id, paidDate);
              });
          }
          setSelectedGroupKey(null);
      }
  };

  const handleCancelPaid = (groupKey: string) => {
      if(confirm("납부 상태를 취소하시겠습니까?")) {
          const group = uniquePaymentItems.find(g => g.key === groupKey);
          if (group) {
              group.ids.forEach(id => {
                  onMarkPaid(id, "");
              });
          }
      }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-full flex flex-col relative animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <CreditCard className="w-5 h-5 mr-2 text-indigo-500" />
            학원비 납부 현황
        </h2>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
        >
            <Plus className="w-4 h-4" /> 납부 항목 추가
        </button>
      </div>

      {/* Add Enrollment Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl animate-fade-in-up p-6 w-full max-w-sm shadow-2xl border dark:border-gray-700">
                <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">학원비 납부 항목 추가</h3>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {childrenList.length === 0 || activities.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                        <p>등록된 자녀 또는 학원 목록이 없습니다.</p>
                        <p className="mt-2 text-xs">먼저 자녀와 학원을 등록해주세요.</p>
                    </div>
                ) : (
                    <form onSubmit={handleEnrollSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">자녀 선택</label>
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {childrenList.map(child => (
                                    <button
                                        key={child.id}
                                        type="button"
                                        onClick={() => setEnrollChildId(child.id)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all whitespace-nowrap ${enrollChildId === child.id ? `${child.color} ring-2 ring-indigo-200 dark:ring-indigo-800` : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${child.color.split(' ')[0].replace('100', '400')}`} />
                                        <span className="text-sm font-medium">{child.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">학원(활동) 선택</label>
                            <select 
                                value={enrollActivityId}
                                onChange={(e) => setEnrollActivityId(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl outline-none focus:border-indigo-500"
                            >
                                {activities.map(act => (
                                    <option key={act.id} value={act.id}>{act.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">비용</label>
                                <input 
                                    type="number" 
                                    value={enrollFee}
                                    onChange={(e) => setEnrollFee(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-right outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">결제일(매월)</label>
                                <div className="relative">
                                    <input 
                                        type="number"
                                        min="1" max="31"
                                        value={enrollPayDay}
                                        onChange={(e) => setEnrollPayDay(e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl text-center outline-none focus:border-indigo-500"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-gray-500">일</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                            <input 
                                type="checkbox" 
                                id="paidCheck"
                                checked={enrollPaidThisMonth}
                                onChange={(e) => setEnrollPaidThisMonth(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <label htmlFor="paidCheck" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                이번 달 납부 완료 처리
                            </label>
                        </div>

                        <button 
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            등록하기
                        </button>
                    </form>
                )}
            </div>
          </div>
      )}

      {selectedGroupKey && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl animate-fade-in-up p-6 w-full max-w-sm shadow-2xl border dark:border-gray-700">
              <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white text-center">납부일 선택</h3>
              <div className="flex justify-center mb-6">
                  <input 
                    type="date" 
                    value={paidDate} 
                    onChange={(e) => setPaidDate(e.target.value)}
                    className="p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl w-full shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
              </div>
              <div className="flex gap-3">
                  <button 
                    onClick={() => setSelectedGroupKey(null)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                      취소
                  </button>
                  <button 
                    onClick={handleConfirmPaid}
                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transition-colors"
                  >
                      확인
                  </button>
              </div>
            </div>
          </div>
      )}

      {/* Summary Section */}
      <div className="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/30 dark:to-gray-800 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
         <div className="flex justify-between items-end mb-3">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">이번 달 총 교육비</span>
            <span className="text-3xl font-bold text-indigo-900 dark:text-indigo-200">₩{totalMonthlyFee.toLocaleString()}</span>
         </div>
         
         <div className="w-full h-4 bg-white dark:bg-gray-700 rounded-full overflow-hidden flex shadow-inner border border-gray-100 dark:border-gray-600">
             {feesByChild.map((item, idx) => (
                 <div 
                    key={item.id}
                    style={{ width: `${(item.total / totalMonthlyFee) * 100}%` }}
                    className={`${item.color.replace('text-', 'bg-').split(' ')[0].replace('100', '400')}`}
                    title={`${item.name}: ${item.total.toLocaleString()}원`}
                 />
             ))}
         </div>
         <div className="flex gap-4 mt-3 flex-wrap">
             {feesByChild.map(item => (
                 <div key={item.id} className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                     <div className={`w-2.5 h-2.5 rounded-full ${item.color.replace('text-', 'bg-').split(' ')[0].replace('100', '400')}`} />
                     {item.name} ({Math.round((item.total / totalMonthlyFee) * 100)}%)
                 </div>
             ))}
         </div>
      </div>

      {uniquePaymentItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-12 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/50">
            <PieChart className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">등록된 유료 학원 일정이 없습니다.</p>
            <p className="text-xs mt-1">시간표 일정을 추가하거나 [납부 항목 추가]를 눌러 등록하세요.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-20 md:pb-0">
          {uniquePaymentItems.map(item => {
            const child = getChild(item.childId);
            const isPaid = isPaidForCurrentCycle(item.lastPaidDate, item.paymentCycleDay);
            const CategoryIcon = getCategoryIcon(item.activity?.category || 'OTHER');
            
            return (
              <div key={item.key} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all shadow-sm hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900 group">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full text-nowrap font-bold border ${child?.color.replace('bg-', 'bg-opacity-10 ').replace('text-', 'text-opacity-90 ')}`}>
                            {child?.name}
                        </span>
                        <div className="flex items-center gap-1.5 min-w-0">
                            {item.activity && <CategoryIcon className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
                            <span className="font-bold text-gray-800 dark:text-white truncate text-base">{item.title}</span>
                        </div>
                   </div>
                   <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-2">
                     <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md text-xs flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3 h-3 text-gray-400 dark:text-gray-500"/> 매월 {item.paymentCycleDay}일
                     </span>
                     <span className="font-bold text-gray-900 dark:text-gray-200 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-md text-xs text-indigo-700 dark:text-indigo-300">
                         ₩{item.fee.toLocaleString()}
                     </span>
                   </div>
                   {isPaid && item.lastPaidDate && (
                       <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-bold flex items-center gap-1">
                           <CheckCircle className="w-3 h-3" />
                           {new Date(item.lastPaidDate).toLocaleDateString()} 납부 완료
                       </div>
                   )}
                </div>

                <button
                  onClick={() => {
                      if (!isPaid) {
                          setPaidDate(new Date().toISOString().split('T')[0]);
                          setSelectedGroupKey(item.key);
                      } else {
                          handleCancelPaid(item.key);
                      }
                  }}
                  className={`ml-4 flex-shrink-0 flex flex-col items-center justify-center w-20 h-14 rounded-xl text-xs font-bold transition-all border ${
                    isPaid 
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30' 
                    : 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 shadow-sm'
                  }`}
                >
                  {isPaid ? (
                    <>
                      <CheckCircle className="w-5 h-5 mb-1" />
                      완료
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mb-1" />
                      미납
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
