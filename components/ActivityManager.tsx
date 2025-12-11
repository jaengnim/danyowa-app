
import React, { useState } from 'react';
import { Activity } from '../types';
import { Plus, Trash2, Building2, GraduationCap, Baby, MoreHorizontal, Edit2, Phone, MapPin, User, Package } from 'lucide-react';
import { generateUUID } from '../services/utils';

interface ActivityManagerProps {
  activities: Activity[];
  onAddActivity: (activity: Omit<Activity, 'id'>) => void;
  onUpdateActivity: (activity: Activity) => void;
  onRemoveActivity: (id: string) => void;
}

const CATEGORIES = [
  { id: 'ACADEMY', label: '학원', icon: Building2, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { id: 'SCHOOL', label: '학교', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { id: 'KINDERGARTEN', label: '유치원/어린이집', icon: Baby, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300' },
  { id: 'OTHER', label: '기타 활동', icon: MoreHorizontal, color: 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-300' },
] as const;

export const ActivityManager: React.FC<ActivityManagerProps> = ({ activities, onAddActivity, onUpdateActivity, onRemoveActivity }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Activity['category']>('ACADEMY');
  const [fee, setFee] = useState('');
  const [paymentDay, setPaymentDay] = useState('');
  
  const [teacher, setTeacher] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [supplies, setSupplies] = useState('');

  const startAdding = () => {
    setEditingId(null);
    setName('');
    setCategory('ACADEMY');
    setFee('');
    setPaymentDay('');
    setTeacher('');
    setPhone('');
    setAddress('');
    setSupplies('');
    setIsFormOpen(true);
  };

  const startEditing = (activity: Activity) => {
    setEditingId(activity.id);
    setName(activity.name);
    setCategory(activity.category);
    setFee(activity.defaultFee > 0 ? activity.defaultFee.toString() : '');
    setPaymentDay(activity.defaultPaymentDay > 0 ? activity.defaultPaymentDay.toString() : '');
    setTeacher(activity.teacher || '');
    setPhone(activity.phone || '');
    setAddress(activity.address || '');
    setSupplies(activity.supplies || '');
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name,
      category,
      defaultFee: Number(fee) || 0,
      defaultPaymentDay: Number(paymentDay) || 1,
      teacher,
      phone,
      address,
      supplies
    };

    if (editingId) {
        onUpdateActivity({ ...data, id: editingId });
    } else {
        onAddActivity(data);
    }

    setIsFormOpen(false);
    setEditingId(null);
    setName('');
  };

  const getCategoryInfo = (cat: string) => CATEGORIES.find(c => c.id === cat) || CATEGORIES[3];

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
          <Building2 className="w-5 h-5 mr-2 text-indigo-500" />
          학원 및 활동 목록
        </h2>
        <button 
          onClick={() => {
              if (isFormOpen) {
                  setIsFormOpen(false);
                  setEditingId(null);
              } else {
                  startAdding();
              }
          }}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${isFormOpen ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`}
        >
           {isFormOpen ? '닫기' : <><Plus className="w-4 h-4" /> 등록하기</>}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 animate-fade-in relative">
           <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
               {editingId ? <><Edit2 className="w-4 h-4"/> 활동 정보 수정</> : '새 활동 등록'}
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
               <div className="col-span-1">
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">이름 *</label>
                   <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      placeholder="예: 연세 피아노, 00유치원"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      autoFocus
                   />
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">분류</label>
                   <select
                      value={category}
                      onChange={e => setCategory(e.target.value as any)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                   >
                       {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                   </select>
               </div>
               
               <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">선생님 이름</label>
                   <input type="text" value={teacher} onChange={e => setTeacher(e.target.value)} placeholder="예: 김선생님" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">연락처</label>
                   <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>
               
               <div className="col-span-1 md:col-span-2">
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">주소</label>
                   <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="학원 상세 주소" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>

               <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기본 비용 (선택)</label>
                   <input type="number" value={fee} onChange={e => setFee(e.target.value)} placeholder="0" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>
               <div>
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">결제일 (선택)</label>
                   <input type="number" min="1" max="31" value={paymentDay} onChange={e => setPaymentDay(e.target.value)} placeholder="1" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>
               
               <div className="col-span-1 md:col-span-2">
                   <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">기본 준비물</label>
                   <input type="text" value={supplies} onChange={e => setSupplies(e.target.value)} placeholder="예: 실내화, 색연필 (일정 등록 시 자동 입력됩니다)" className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:border-indigo-500"/>
               </div>
           </div>
           
           <div className="flex gap-2">
               <button 
                type="button"
                onClick={() => { setIsFormOpen(false); setEditingId(null); }}
                className="flex-1 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
               >
                 취소
               </button>
               <button 
                 type="submit"
                 disabled={!name}
                 className="flex-[2] py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
               >
                 {editingId ? '수정 완료' : '저장하기'}
               </button>
           </div>
        </form>
      )}

      <div className="space-y-3">
        {activities.length === 0 && !isFormOpen ? (
             <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-750 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                 등록된 학원이나 학교가 없습니다.<br/>위의 '등록하기' 버튼을 눌러 추가해주세요.
             </div>
        ) : (
            activities.map(activity => {
                const Cat = getCategoryInfo(activity.category);
                const isEditing = editingId === activity.id;
                
                return (
                    <div 
                        key={activity.id} 
                        onClick={() => startEditing(activity)}
                        className={`p-4 border rounded-xl bg-white dark:bg-gray-800 transition-all shadow-sm cursor-pointer ${isEditing ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${Cat.color}`}>
                                    <Cat.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 text-sm">{activity.name}</h4>
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-1.5 py-0.5 rounded">{Cat.label}</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {(activity.teacher || activity.phone) && (
                                            <div className="flex items-center gap-1">
                                                <User className="w-3 h-3"/> {activity.teacher || '선생님 미등록'}
                                                {activity.phone && <span className="text-gray-300 dark:text-gray-600">|</span>}
                                                {activity.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/>{activity.phone}</span>}
                                            </div>
                                        )}
                                        {activity.address && (
                                            <div className="flex items-center gap-1 col-span-2 sm:col-span-1 truncate">
                                                <MapPin className="w-3 h-3"/> {activity.address}
                                            </div>
                                        )}
                                        {activity.defaultFee > 0 && (
                                            <div className="font-medium text-gray-700 dark:text-gray-300">
                                                비용: {activity.defaultFee.toLocaleString()}원 
                                                <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(매월 {activity.defaultPaymentDay}일)</span>
                                            </div>
                                        )}
                                        {activity.supplies && (
                                            <div className="flex items-center gap-1 col-span-2 text-indigo-600 dark:text-indigo-400">
                                                <Package className="w-3 h-3"/> {activity.supplies}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 pl-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveActivity(activity.id); }}
                                    className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
