
import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, BookOpen, Music, Activity as ActivityIcon, Award, ChevronDown, CheckCircle2 } from 'lucide-react';
import { AgeGroupStats, Child, Activity } from '../types';

interface TrendAnalysisProps {
  childrenList: Child[];
  myActivities: Activity[];
}

const getMockDataForAge = (age: number): AgeGroupStats => {
  let topAcademies = [];
  let categoryDistribution = [];

  if (age <= 5) {
    topAcademies = [
      { subject: '어린이집/유치원', count: 95, percentage: 95, icon: 'school' },
      { subject: '문화센터(놀이)', count: 40, percentage: 40, icon: 'play' },
      { subject: '방문미술', count: 20, percentage: 20, icon: 'art' },
      { subject: '유아체육', count: 15, percentage: 15, icon: 'sport' },
      { subject: '영어노출', count: 10, percentage: 10, icon: 'english' }
    ];
    categoryDistribution = [
      { label: '보육/놀이', value: 70, color: 'bg-amber-400' },
      { label: '예체능', value: 20, color: 'bg-rose-400' },
      { label: '학습', value: 10, color: 'bg-indigo-400' },
    ];
  } else if (age <= 7) {
    topAcademies = [
      { subject: '영어학원', count: 60, percentage: 60, icon: 'english' },
      { subject: '태권도', count: 55, percentage: 55, icon: 'sport' },
      { subject: '피아노', count: 45, percentage: 45, icon: 'music' },
      { subject: '미술학원', count: 40, percentage: 40, icon: 'art' },
      { subject: '수영/줄넘기', count: 25, percentage: 25, icon: 'sport' }
    ];
    categoryDistribution = [
      { label: '예체능', value: 60, color: 'bg-rose-400' },
      { label: '학습', value: 40, color: 'bg-indigo-400' },
    ];
  } else if (age <= 10) {
    topAcademies = [
      { subject: '영어학원', count: 85, percentage: 85, icon: 'english' },
      { subject: '수학학원', count: 70, percentage: 70, icon: 'math' },
      { subject: '피아노', count: 50, percentage: 50, icon: 'music' },
      { subject: '태권도', count: 40, percentage: 40, icon: 'sport' },
      { subject: '논술/독서', count: 30, percentage: 30, icon: 'book' }
    ];
    categoryDistribution = [
      { label: '학습', value: 65, color: 'bg-indigo-400' },
      { label: '예체능', value: 35, color: 'bg-rose-400' },
    ];
  } else {
    topAcademies = [
      { subject: '수학학원', count: 90, percentage: 90, icon: 'math' },
      { subject: '영어학원', count: 85, percentage: 85, icon: 'english' },
      { subject: '국어/논술', count: 50, percentage: 50, icon: 'book' },
      { subject: '과학학원', count: 30, percentage: 30, icon: 'science' },
      { subject: '코딩/컴퓨터', count: 20, percentage: 20, icon: 'tech' }
    ];
    categoryDistribution = [
      { label: '학습', value: 85, color: 'bg-indigo-400' },
      { label: '예체능', value: 15, color: 'bg-rose-400' },
    ];
  }

  return {
    age,
    totalStudents: 1250 + age * 100, 
    topAcademies,
    categoryDistribution
  };
};

export const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ childrenList, myActivities }) => {
  const [selectedAge, setSelectedAge] = useState<number>(7);
  
  const stats = useMemo(() => getMockDataForAge(selectedAge), [selectedAge]);

  const matchedChild = childrenList.find(c => c.age === selectedAge);
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in mb-20 md:mb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            또래 학원 트렌드
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                회원 데이터를 기반으로 분석한 {selectedAge}세 인기 학원 정보입니다.
            </p>
        </div>
        
        <div className="relative">
            <select
                value={selectedAge}
                onChange={(e) => setSelectedAge(Number(e.target.value))}
                className="appearance-none bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
                {Array.from({ length: 14 }, (_, i) => i + 3).map(age => (
                    <option key={age} value={age}>{age}세</option>
                ))}
            </select>
            <ChevronDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400 absolute right-3 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Col: Ranking */}
        <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-750 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    {selectedAge}세가 가장 많이 다니는 곳 TOP 5
                </h3>
                <div className="space-y-4">
                    {stats.topAcademies.map((item, idx) => (
                        <div key={item.subject} className="relative">
                            <div className="flex justify-between items-end mb-1 text-xs font-medium">
                                <span className="flex items-center gap-2">
                                    <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${idx < 3 ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                                        {idx + 1}
                                    </span>
                                    <span className="text-gray-800 dark:text-gray-200">{item.subject}</span>
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">{item.percentage}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${idx === 0 ? 'bg-indigo-500' : 'bg-indigo-400 opacity-80'}`}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Insight Card */}
            <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4" />
                    AI 트렌드 인사이트
                </h3>
                <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
                   <strong>{selectedAge}세</strong> 아이들은 
                   {stats.categoryDistribution[0].value > 50 
                    ? ` ${stats.categoryDistribution[0].label} 위주의 활동을 많이 하고 있습니다.` 
                    : ` ${stats.categoryDistribution[0].label}과 ${stats.categoryDistribution[1].label}의 균형을 맞추는 시기입니다.`}
                   <br/>
                   특히 <strong>{stats.topAcademies[0].subject}</strong>의 등록률이 {stats.topAcademies[0].percentage}%로 가장 높으며, 
                   상위 3개 학원이 전체 활동의 절반 이상을 차지합니다.
                </p>
            </div>
        </div>

        {/* Right Col: Distribution & Comparison */}
        <div className="space-y-4">
             {/* Category Distribution Chart */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                 <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">활동 분야 비중</h3>
                 <div className="flex h-8 rounded-full overflow-hidden mb-3">
                     {stats.categoryDistribution.map((cat, idx) => (
                         <div 
                            key={idx} 
                            className={`${cat.color} flex items-center justify-center text-[10px] text-white font-bold transition-all duration-700`}
                            style={{ width: `${cat.value}%` }}
                         >
                            {cat.value > 15 && `${cat.value}%`}
                         </div>
                     ))}
                 </div>
                 <div className="flex justify-center gap-4 text-xs">
                     {stats.categoryDistribution.map((cat, idx) => (
                         <div key={idx} className="flex items-center gap-1.5">
                             <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                             <span className="text-gray-600 dark:text-gray-400">{cat.label}</span>
                         </div>
                     ))}
                 </div>
            </div>

            {/* My Child Comparison */}
            {matchedChild ? (
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-xl text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-200" />
                            내 아이({matchedChild.name}) 비교
                        </h3>
                        <p className="text-indigo-100 text-xs mb-4">또래 친구들과 비교해보세요</p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-white/10 p-2 rounded-lg">
                                <span className="text-sm">현재 다니는 곳</span>
                                <span className="font-bold">{myActivities.length}개</span>
                            </div>
                            
                            <div className="text-sm space-y-2">
                                <p className="font-bold text-indigo-100 text-xs">또래 인기 학원 중 안 다니는 곳:</p>
                                <div className="flex flex-wrap gap-2">
                                    {stats.topAcademies.slice(0,3).map(top => {
                                        const hasActivity = myActivities.some(my => my.name.includes(top.subject) || (my.category === 'ACADEMY' && top.subject.includes('학원')));
                                        
                                        if (!hasActivity) {
                                            return (
                                                <span key={top.subject} className="px-2 py-1 bg-white/20 rounded text-xs border border-white/10">
                                                    {top.subject}
                                                </span>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </div>
            ) : (
                <div className="bg-gray-50 dark:bg-gray-750 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center flex flex-col items-center justify-center h-48">
                    <Users className="w-10 h-10 text-gray-300 dark:text-gray-500 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">
                        등록된 <strong>{selectedAge}세</strong> 자녀가 없습니다.<br/>
                        자녀를 등록하면 비교 분석 정보를 볼 수 있어요.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};