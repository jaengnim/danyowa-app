import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Bell, BellOff, Mic, Settings, X, Sparkles, Calendar as CalendarIcon, Clock, ChevronRight, List, LayoutGrid, CreditCard, Users, Home, School, Package, UserMinus, LogOut, ChevronDown, User as UserIcon, TrendingUp, Sun, Moon, Cloud, CloudRain, CloudSnow, CloudLightning, MapPin, ChevronLeft, Loader2, BellRing } from 'lucide-react';
import { Child, ScheduleItem, ScheduleException, DAYS_OF_WEEK, Activity, UserProfile, WeatherData, KoreaRegion, BriefingSettings } from './types';
import { ChildManager } from './components/ChildManager';
import { ScheduleForm } from './components/ScheduleForm';
import { PaymentTracker } from './components/PaymentTracker';
import { ActivityManager } from './components/ActivityManager';
import { LoginScreen } from './components/LoginScreen';
import { TrendAnalysis } from './components/TrendAnalysis';
import { BriefingSettingsModal } from './components/BriefingSettings';
import { playAnnouncement } from './services/geminiService';
import { fetchWeather, KOREA_REGIONS } from './services/weatherService';
import { generateUUID } from './services/utils';
import {
    isPushSupported,
    getNotificationPermission,
    requestNotificationPermission,
    subscribeToPush,
    syncSubscriptionWithServer,
    sendTestNotification
} from './services/pushNotificationService';
import { signOut } from './services/authService';

const formatDate = (date: Date) => date.toISOString().split('T')[0];

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 64;

type TabId = 'today' | 'calendar' | 'academies' | 'trend' | 'settings';
type CalendarViewMode = 'week' | 'day';

function App() {
    const [user, setUser] = useState<UserProfile | null>(() => {
        try {
            const savedUser = localStorage.getItem('app_user');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (e) {
            return null;
        }
    });

    const [isDarkMode, setIsDarkMode] = useState(() => {
        try {
            return localStorage.getItem('theme') === 'dark';
        } catch (e) {
            return false;
        }
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const [activeTab, setActiveTab] = useState<TabId>('today');
    const [academySubTab, setAcademySubTab] = useState<'list' | 'payments'>('payments');

    const [currentTime, setCurrentTime] = useState(new Date());

    // Calendar View State
    const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('week');
    const [viewDate, setViewDate] = useState(new Date());
    const [mobileListMode, setMobileListMode] = useState<'list' | 'grid'>('list');

    const [children, setChildren] = useState<Child[]>(() => {
        try {
            const saved = localStorage.getItem('app_children');
            return saved ? JSON.parse(saved) : [
                { id: '1', name: '첫째', age: 7, color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800', voice: 'Puck' },
                { id: '2', name: '둘째', age: 5, color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800', voice: 'Kore' }
            ];
        } catch (e) {
            return [];
        }
    });

    const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
        try {
            const saved = localStorage.getItem('app_schedules');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [exceptions, setExceptions] = useState<ScheduleException[]>(() => {
        try {
            const saved = localStorage.getItem('app_exceptions');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [activities, setActivities] = useState<Activity[]>(() => {
        try {
            const saved = localStorage.getItem('app_activities');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    // Weather State
    const [selectedRegion, setSelectedRegion] = useState<KoreaRegion>(() => {
        try {
            const saved = localStorage.getItem('app_region');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                    return parsed;
                }
            }
            return KOREA_REGIONS[0];
        } catch {
            return KOREA_REGIONS[0];
        }
    });
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        localStorage.setItem('app_region', JSON.stringify(selectedRegion));

        const loadWeather = () => {
            fetchWeather(selectedRegion.lat, selectedRegion.lon).then(setWeather);
        };

        loadWeather();
        const interval = setInterval(loadWeather, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [selectedRegion]);

    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [lastAnnouncedId, setLastAnnouncedId] = useState<string | null>(null);
    const [speaking, setSpeaking] = useState(false);
    const [selectedChildFilter, setSelectedChildFilter] = useState<string | 'ALL'>('ALL');

    const [showScheduleForm, setShowScheduleForm] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number, time: string } | undefined>(undefined);
    const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | undefined>(undefined);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Auto Briefing State
    const [briefingSettings, setBriefingSettings] = useState<BriefingSettings>(() => {
        try {
            const saved = localStorage.getItem('app_briefing_settings');
            return saved ? JSON.parse(saved) : { enabled: false, time: "08:00", days: [1, 2, 3, 4, 5] };
        } catch {
            return { enabled: false, time: "08:00", days: [1, 2, 3, 4, 5] };
        }
    });
    const [showBriefingSettings, setShowBriefingSettings] = useState(false);
    const [lastAutoBriefingDate, setLastAutoBriefingDate] = useState<string>('');
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);

    // Push Notification State
    const [pushSupported, setPushSupported] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
    const [pushSyncing, setPushSyncing] = useState(false);
    const [showPushModal, setShowPushModal] = useState(false);

    // Check push notification support on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPushSupported(isPushSupported());
            setPushPermission(getNotificationPermission());
        }
    }, []);

    // Sync schedules with push notification server when they change
    useEffect(() => {
        if (user && pushPermission === 'granted') {
            const syncWithServer = async () => {
                setPushSyncing(true);
                try {
                    await syncSubscriptionWithServer(
                        user.id,
                        schedules,
                        briefingSettings,
                        children
                    );
                    console.log('Synced schedules with push notification server');
                } catch (error) {
                    console.error('Failed to sync with server:', error);
                }
                setPushSyncing(false);
            };
            // Debounce the sync
            const timeoutId = setTimeout(syncWithServer, 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [user, schedules, briefingSettings, children, pushPermission]);

    // Handle enabling push notifications
    const handleEnablePush = useCallback(async () => {
        try {
            const permission = await requestNotificationPermission();
            setPushPermission(permission);

            if (permission === 'granted') {
                const subscription = await subscribeToPush();
                if (subscription && user) {
                    await syncSubscriptionWithServer(
                        user.id,
                        schedules,
                        briefingSettings,
                        children
                    );
                    setShowPushModal(false);
                    alert('알림이 활성화되었습니다! 이제 앱을 종료해도 알림을 받을 수 있습니다.');
                }
            } else if (permission === 'denied') {
                alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.');
            }
        } catch (error) {
            console.error('Failed to enable push:', error);
            alert('알림 활성화에 실패했습니다.');
        }
    }, [user, schedules, briefingSettings, children]);

    // Handle test notification
    const handleTestNotification = useCallback(async () => {
        if (pushPermission !== 'granted') {
            alert('먼저 알림을 활성화해주세요.');
            return;
        }
        const success = await sendTestNotification();
        if (!success) {
            alert('테스트 알림 전송에 실패했습니다. 서버 설정을 확인해주세요.');
        }
    }, [pushPermission]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => { if (user) localStorage.setItem('app_user', JSON.stringify(user)); else localStorage.removeItem('app_user'); }, [user]);
    useEffect(() => { localStorage.setItem('app_children', JSON.stringify(children)); }, [children]);
    useEffect(() => { localStorage.setItem('app_schedules', JSON.stringify(schedules)); }, [schedules]);
    useEffect(() => { localStorage.setItem('app_exceptions', JSON.stringify(exceptions)); }, [exceptions]);
    useEffect(() => { localStorage.setItem('app_activities', JSON.stringify(activities)); }, [activities]);
    useEffect(() => { localStorage.setItem('app_briefing_settings', JSON.stringify(briefingSettings)); }, [briefingSettings]);

    const handleBriefing = useCallback(async () => {
        if (isBriefingLoading) return;

        let audioCtx: AudioContext;

        try {
            setIsBriefingLoading(true);

            // 1. Create and resume AudioContext IMMEDIATELY on user click (Mobile fix)
            // Removed sampleRate option for better compatibility
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

            // Silent unlock for iOS/Android
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            const today = currentTime.getDay();
            const dateStr = formatDate(currentTime);
            const todaySchedules = schedules
                .filter(s => s.dayOfWeek === today)
                .filter(s => !exceptions.some(e => e.scheduleId === s.id && e.date === dateStr))
                .filter(s => selectedChildFilter === 'ALL' || s.childId === selectedChildFilter)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

            // Date Announcement
            const month = currentTime.getMonth() + 1;
            const day = currentTime.getDate();
            const dayOfWeek = DAYS_OF_WEEK[currentTime.getDay()];
            const dateAnnouncement = `오늘은 ${month}월 ${day}일 ${dayOfWeek}요일 입니다.`;

            // Weather Message Construction
            let weatherMsg = "";
            if (weather) {
                let diffMsg = "";
                let adviceMsg = "";

                if (weather.yesterdayMaxTemp !== undefined) {
                    const diff = weather.maxTemp - weather.yesterdayMaxTemp;
                    if (Math.abs(diff) < 3) {
                        diffMsg = "어제와 비슷한 기온이구요.";
                    } else if (diff > 0) {
                        diffMsg = `어제보다 ${Math.round(diff)}도 높아 조금 더 따뜻합니다.`;
                        adviceMsg = "옷차림을 조금 가볍게 하셔도 좋겠습니다.";
                    } else {
                        diffMsg = `어제보다 ${Math.round(Math.abs(diff))}도 낮아 더 쌀쌀합니다.`;
                        adviceMsg = "아이들을 따뜻하게 입혀주세요.";
                    }
                }

                const rainCodes = [51, 53, 55, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 95, 96, 99];
                if (rainCodes.includes(weather.conditionCode)) {
                    adviceMsg += " 비나 눈 소식이 있으니 우산을 꼭 챙기시길 바랍니다.";
                }

                weatherMsg = `먼저 날씨 소식입니다. 현재 ${selectedRegion.name} 날씨는 ${weather.conditionText}이며, 기온은 ${Math.round(weather.temperature)}도 입니다. ${diffMsg} ${adviceMsg}`;
            }

            // Schedule Message Construction
            const formatTimeForSpeech = (timeStr: string) => {
                const [h, m] = timeStr.split(':').map(Number);
                const period = h < 12 ? '오전' : '오후';
                const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
                const minPart = m > 0 ? `${m}분` : '';
                return `${period} ${hour}시 ${minPart}`;
            };

            let scheduleMsg = "";
            if (todaySchedules.length === 0) {
                scheduleMsg = "오늘 예정된 학원이나 활동 일정은 없습니다. 아이들과 즐거운 시간 보내세요!";
            } else {
                const itemsText = todaySchedules.map((s, index) => {
                    const child = children.find(c => c.id === s.childId);
                    const suppliesText = s.supplies ? `, 준비물은 ${s.supplies}입니다` : "";
                    const timeSpeech = formatTimeForSpeech(s.startTime);
                    const ending = index === todaySchedules.length - 1 ? " 일정이 있습니다." : " 일정이 있고, ";
                    return `${child?.name} 어린이는 ${timeSpeech}에 ${s.title}${suppliesText}${ending}`;
                }).join(' ');
                scheduleMsg = `이어서 오늘의 일정입니다. ${itemsText} 오늘도 활기찬 하루 되세요!`;
            }

            const fullText = `${dateAnnouncement} 안녕하세요. ${weatherMsg} ${scheduleMsg}`;

            await playAnnouncement(
                fullText,
                'Puck',
                undefined,
                () => setIsBriefingLoading(false),
                audioCtx // Pass the unlocked context
            );

        } catch (e: any) {
            setIsBriefingLoading(false);
            console.error("Briefing failed", e);
            alert("브리핑을 시작할 수 없습니다: " + e.message);
        }
    }, [currentTime, schedules, exceptions, children, selectedChildFilter, weather, selectedRegion, isBriefingLoading]);

    useEffect(() => {
        const currentDay = currentTime.getDay();
        const dateStr = formatDate(currentTime);
        const currentHourStr = currentTime.getHours().toString().padStart(2, '0');
        const currentMinStr = currentTime.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHourStr}:${currentMinStr}`;
        const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        if (briefingSettings.enabled && !speaking && !isBriefingLoading) {
            if (briefingSettings.days.includes(currentDay) &&
                briefingSettings.time === currentTimeStr &&
                lastAutoBriefingDate !== dateStr) {
                console.log("Auto Briefing Triggered");
                setLastAutoBriefingDate(dateStr);
                handleBriefing();
            }
        }

        if (!isAudioEnabled || speaking) return;

        // Detect scheduled events
        let detectedEvent: { item: ScheduleItem, type: 'start' | 'end' } | null = null;

        for (const item of schedules) {
            if (item.dayOfWeek !== currentDay) continue;

            // Check SKIP exception
            const isSkipped = exceptions.some(ex => ex.scheduleId === item.id && ex.date === dateStr);
            if (isSkipped) continue;

            // 1. Check Start Time Notification
            const [startH, startM] = item.startTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const notifyStartMinutes = startMinutes - (item.notifyMinutesBefore || 0);

            if (currentTotalMinutes === notifyStartMinutes) {
                if (lastAnnouncedId !== `${item.id}-start`) {
                    detectedEvent = { item, type: 'start' };
                    break; // Prioritize start if multiple happen same minute (unlikely but safe)
                }
            }

            // 2. Check End Time (Pickup) Notification
            if (item.pickupNotifyMinutesBefore !== undefined) {
                const [endH, endM] = item.endTime.split(':').map(Number);
                const endMinutes = endH * 60 + endM;
                const notifyEndMinutes = endMinutes - item.pickupNotifyMinutesBefore;

                if (currentTotalMinutes === notifyEndMinutes) {
                    if (lastAnnouncedId !== `${item.id}-end`) {
                        detectedEvent = { item, type: 'end' };
                        break;
                    }
                }
            }
        }

        if (detectedEvent) {
            const { item, type } = detectedEvent;
            const child = children.find(c => c.id === item.childId);

            if (child) {
                setLastAnnouncedId(`${item.id}-${type}`);
                setSpeaking(true);

                let message = "";

                if (type === 'start') {
                    const buffer = item.notifyMinutesBefore || 0;
                    let timeMsg = "지금";
                    if (buffer > 0) timeMsg = `${buffer}분 뒤에`;

                    let suppliesMsg = "";
                    if (item.supplies && item.supplies.trim()) {
                        suppliesMsg = `준비물은 ${item.supplies}입니다. 잊지 마세요.`;
                    } else {
                        suppliesMsg = "준비물은 없습니다.";
                    }
                    message = `알림입니다. ${child.name} 학생, ${timeMsg} ${item.title}에 갈 시간입니다. ${suppliesMsg} 준비하세요.`;
                } else {
                    // Pickup Message
                    message = `일정이 끝날 시간입니다. 데리러 가야 합니다.`;
                }

                playAnnouncement(
                    message,
                    child.voice,
                    () => console.log('Started speaking'),
                    () => {
                        setSpeaking(false);
                        setTimeout(() => setLastAnnouncedId(null), 60000);
                    }
                );
            }
        }
    }, [currentTime, schedules, exceptions, isAudioEnabled, lastAnnouncedId, children, speaking, briefingSettings, lastAutoBriefingDate, handleBriefing, isBriefingLoading]);

    const handleLogin = (userData: UserProfile) => {
        setUser(userData);
    };

    const handleLogout = async () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            try {
                await signOut();
            } catch (e) {
                console.error('Signout error:', e);
            }
            setUser(null);
            setShowProfileMenu(false);
        }
    };

    const handleAddChild = (child: Omit<Child, 'id'>) => {
        const newChild = { ...child, id: generateUUID() };
        setChildren([...children, newChild]);
    };

    const handleUpdateChild = (updatedChild: Child) => {
        setChildren(children.map(c => c.id === updatedChild.id ? updatedChild : c));
    };

    const handleRemoveChild = (id: string) => {
        if (confirm('정말 삭제하시겠습니까? 해당 자녀의 모든 일정도 함께 삭제됩니다.')) {
            setChildren(children.filter(c => c.id !== id));
            setSchedules(schedules.filter(s => s.childId !== id));
            if (selectedChildFilter === id) setSelectedChildFilter('ALL');
        }
    };

    const handleAddActivity = (activity: Omit<Activity, 'id'>) => {
        setActivities([...activities, { ...activity, id: generateUUID() }]);
    };

    const handleUpdateActivity = (updatedActivity: Activity) => {
        setActivities(activities.map(a => a.id === updatedActivity.id ? updatedActivity : a));
    };

    const handleRemoveActivity = (id: string) => {
        if (confirm('이 활동을 목록에서 삭제하시겠습니까? 등록된 일정은 유지됩니다.')) {
            setActivities(activities.filter(a => a.id !== id));
        }
    };

    const handleSaveSchedule = (item: Omit<ScheduleItem, 'id'>, isEdit: boolean) => {
        if (isEdit && editingSchedule) {
            setSchedules(prev => prev.map(s => s.id === editingSchedule.id ? { ...item, id: editingSchedule.id } : s));
        } else {
            const newItem = { ...item, id: generateUUID() };
            setSchedules(prev => [...prev, newItem]);
        }
    };

    const handleDeleteSchedule = (id: string) => {
        setSchedules(prev => prev.filter(s => s.id !== id));
        setShowScheduleForm(false);
    };

    const handleSkipSchedule = (id: string) => {
        const schedule = schedules.find(s => s.id === id);
        if (!schedule) return;

        const curr = new Date(currentTime);
        const currentDayIdx = curr.getDay();

        const sunday = new Date(curr);
        sunday.setDate(curr.getDate() - currentDayIdx);

        const targetDate = new Date(sunday);
        targetDate.setDate(sunday.getDate() + schedule.dayOfWeek);

        const targetDateStr = formatDate(targetDate);

        const newException: ScheduleException = {
            id: generateUUID(),
            scheduleId: id,
            date: targetDateStr,
            reason: '결석'
        };
        setExceptions(prev => [...prev, newException]);
        setShowScheduleForm(false);
    };

    const handleMarkPaid = (id: string, date: string) => {
        setSchedules(prev => prev.map(s => s.id === id ? { ...s, lastPaidDate: date || undefined } : s));
    };

    const handleSlotClick = (dayIdx: number, hour: number) => {
        const timeStr = `${hour.toString().padStart(2, '0')}:00`;
        setSelectedSlot({ day: dayIdx, time: timeStr });
        setEditingSchedule(undefined);
        setShowScheduleForm(true);
    };

    const handleEditClick = (schedule: ScheduleItem) => {
        setEditingSchedule(schedule);
        setSelectedSlot(undefined);
        setShowScheduleForm(true);
    };

    const changeViewDate = (days: number) => {
        const newDate = new Date(viewDate);
        newDate.setDate(viewDate.getDate() + days);
        setViewDate(newDate);
    };

    const getLayoutStyles = (daySchedules: ScheduleItem[], currentItem: ScheduleItem, totalWidth: number = 100) => {
        const sorted = [...daySchedules].sort((a, b) => {
            if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
            return a.endTime.localeCompare(b.endTime);
        });

        const lanes: ScheduleItem[][] = [];

        sorted.forEach(item => {
            let placed = false;
            for (const lane of lanes) {
                const lastInLane = lane[lane.length - 1];
                if (item.startTime >= lastInLane.endTime) {
                    lane.push(item);
                    placed = true;
                    break;
                }
            }
            if (!placed) lanes.push([item]);
        });

        const laneIndex = lanes.findIndex(lane => lane.some(i => i.id === currentItem.id));
        const totalLanes = lanes.length;

        const widthPercent = (totalWidth * 0.85) / totalLanes;
        const leftPercent = laneIndex * (totalWidth / totalLanes);

        const [startH, startM] = currentItem.startTime.split(':').map(Number);
        const [endH, endM] = currentItem.endTime.split(':').map(Number);
        const durationMins = (endH * 60 + endM) - (startH * 60 + startM);
        const startMinsFrom8 = (startH - START_HOUR) * 60 + startM;

        const top = (startMinsFrom8 / 60) * HOUR_HEIGHT;
        const height = (durationMins / 60) * HOUR_HEIGHT;

        return {
            top: `${top}px`,
            height: `${height}px`,
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
        };
    };

    const todaysTimeline = useMemo(() => {
        const today = currentTime.getDay();
        const dateStr = formatDate(currentTime);
        const list = schedules
            .filter(s => s.dayOfWeek === today)
            .filter(s => selectedChildFilter === 'ALL' || s.childId === selectedChildFilter)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return list.map(item => {
            const isSkipped = exceptions.some(e => e.scheduleId === item.id && e.date === dateStr);
            const child = children.find(c => c.id === item.childId);
            return { ...item, isSkipped, child };
        });
    }, [currentTime, schedules, exceptions, selectedChildFilter, children]);

    if (!user) {
        return (
            <LoginScreen onLogin={handleLogin} />
        );
    }

    const renderTodayTab = () => (
        <div className="space-y-6 animate-fade-in mb-20 md:mb-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold flex items-center text-gray-800 dark:text-white">
                        <Sparkles className="w-6 h-6 mr-2 text-indigo-500" />
                        오늘의 일정
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        {currentTime.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title={isDarkMode ? "라이트 모드로 변경" : "다크 모드로 변경"}
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>

                    {/* Push Notification Button */}
                    {pushSupported && (
                        <button
                            onClick={pushPermission === 'granted' ? handleTestNotification : handleEnablePush}
                            className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${pushPermission === 'granted'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 animate-pulse'
                                }`}
                            title={pushPermission === 'granted' ? '테스트 알림 보내기' : '알림 활성화하기'}
                        >
                            {pushPermission === 'granted' ? (
                                <>
                                    <Bell className="w-5 h-5" />
                                    {pushSyncing && <Loader2 className="w-3 h-3 animate-spin" />}
                                </>
                            ) : (
                                <>
                                    <BellRing className="w-5 h-5" />
                                    <span className="text-xs font-bold hidden sm:inline">알림 켜기</span>
                                </>
                            )}
                        </button>
                    )}

                    <div className="flex items-center bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-all p-0.5">
                        <button
                            onClick={handleBriefing}
                            disabled={isBriefingLoading}
                            className={`flex items-center gap-2 text-white px-3 py-1.5 font-bold text-sm border-r border-indigo-500 transition-opacity ${isBriefingLoading ? 'opacity-75 cursor-wait' : ''}`}
                        >
                            {isBriefingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                            {isBriefingLoading ? '브리핑 중...' : 'AI 브리핑'}
                        </button>
                        <button
                            onClick={() => setShowBriefingSettings(true)}
                            className="p-1.5 text-indigo-200 hover:text-white transition-colors"
                            title="자동 브리핑 설정"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {weather && (
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                            {weather.conditionCode === 0 ? <Sun className="w-8 h-8 text-yellow-300" /> :
                                weather.conditionCode <= 3 ? <Cloud className="w-8 h-8" /> :
                                    weather.conditionCode <= 67 ? <CloudRain className="w-8 h-8" /> :
                                        weather.conditionCode <= 77 ? <CloudSnow className="w-8 h-8" /> :
                                            <CloudLightning className="w-8 h-8" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1 cursor-pointer" title="지역 변경">
                                <MapPin className="w-3.5 h-3.5 opacity-80" />
                                <div className="relative group/select">
                                    <select
                                        value={selectedRegion.id}
                                        onChange={(e) => {
                                            const region = KOREA_REGIONS.find(r => r.id === e.target.value);
                                            if (region) setSelectedRegion(region);
                                        }}
                                        className="appearance-none bg-transparent font-bold text-lg border-b border-white/30 hover:border-white focus:outline-none focus:border-white pr-4 cursor-pointer"
                                    >
                                        {KOREA_REGIONS.map(r => <option key={r.id} value={r.id} className="text-gray-900">{r.name}</option>)}
                                    </select>
                                    <ChevronDown className="w-3 h-3 absolute right-0 top-1.5 pointer-events-none" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold flex items-end gap-2">
                                {Math.round(weather.temperature)}°
                                <span className="text-sm font-normal opacity-90 mb-1">{weather.conditionText}</span>
                            </p>
                            <p className="text-xs opacity-80 mt-1">
                                최고 {Math.round(weather.maxTemp)}° / 최저 {Math.round(weather.minTemp)}°
                            </p>
                        </div>
                    </div>
                    <div className="relative z-10 text-right">
                        <p className="text-xs font-bold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm inline-block mb-1">
                            어제보다 {weather.yesterdayMaxTemp !== undefined ? (Math.round(weather.maxTemp - weather.yesterdayMaxTemp) > 0 ? `+${Math.round(weather.maxTemp - weather.yesterdayMaxTemp)}` : Math.round(weather.maxTemp - weather.yesterdayMaxTemp)) : 0}°
                        </p>
                        <p className="text-[10px] opacity-90">
                            {weather.yesterdayMaxTemp !== undefined && (weather.maxTemp < weather.yesterdayMaxTemp ? '더 쌀쌀해요' : '더 따뜻해요')}
                        </p>
                    </div>
                    <Cloud className="absolute -right-4 -bottom-4 w-32 h-32 opacity-20" />
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" /> 시간별 일정
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedChildFilter('ALL')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${selectedChildFilter === 'ALL' ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                        >
                            전체
                        </button>
                        {children.map(child => (
                            <button
                                key={child.id}
                                onClick={() => setSelectedChildFilter(child.id)}
                                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${selectedChildFilter === child.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${child.color.replace('bg-', 'bg-opacity-50 ').split(' ')[0]}`} />
                                {child.name}
                            </button>
                        ))}
                    </div>
                </div>

                {todaysTimeline.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-750 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-400 dark:text-gray-500 mb-2">오늘 예정된 일정이 없습니다.</p>
                        <button
                            onClick={() => { setActiveTab('calendar'); }}
                            className="text-indigo-600 dark:text-indigo-400 text-sm font-bold hover:underline"
                        >
                            시간표에서 일정 추가하기
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {todaysTimeline.map((item, index) => (
                            <div
                                key={item.id}
                                onClick={() => handleEditClick(item)}
                                className={`relative p-3 rounded-xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md ${item.isSkipped ? 'opacity-50 grayscale bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-800 hover:border-indigo-200 dark:hover:border-indigo-700'} ${item.child?.color.replace('bg-', 'border-').replace('100', '200') || 'border-gray-200'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${item.child?.color}`}>
                                        {item.child?.name}
                                    </span>
                                    {item.isSkipped && <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-500 px-1 rounded">결석</span>}
                                </div>
                                <h4 className={`font-bold text-gray-800 dark:text-white mb-1 truncate ${item.isSkipped ? 'line-through' : ''}`}>{item.title}</h4>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {item.startTime} - {item.endTime}
                                </div>
                                {item.supplies && (
                                    <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-700 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1 truncate">
                                        <Package className="w-3 h-3" />
                                        {item.supplies}
                                    </div>
                                )}

                                {/* Timeline connector visual (optional) */}
                                {index < todaysTimeline.length - 1 && (
                                    <div className="absolute -bottom-4 left-1/2 w-0.5 h-4 bg-gray-100 dark:bg-gray-700 hidden sm:block"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderCalendarTab = () => {
        // Week date calculation
        const curr = new Date(currentTime);
        const day = curr.getDay(); // 0 (Sun) to 6 (Sat)
        const sunday = new Date(curr);
        sunday.setDate(curr.getDate() - day);

        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(sunday);
            d.setDate(sunday.getDate() + i);
            return d;
        });

        const isToday = (d: Date) => d.getDate() === currentTime.getDate() && d.getMonth() === currentTime.getMonth();

        const renderTimeGrid = (datesToShow: Date[]) => (
            <div className="flex flex-1 overflow-hidden">
                {/* Time Column */}
                <div className="w-[10%] md:w-[60px] flex-shrink-0 border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="h-10 border-b border-gray-100 dark:border-gray-700"></div> {/* Header spacer */}
                    <div className="overflow-hidden">
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                            <div key={i} className="h-16 border-b border-gray-50 dark:border-gray-800 text-[10px] md:text-xs text-gray-400 dark:text-gray-500 text-center relative">
                                <span className="absolute -top-2 left-0 right-0">{START_HOUR + i}:00</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Days Columns */}
                <div className="flex-1 flex overflow-x-auto no-scrollbar relative">
                    {datesToShow.map((date, dayIndex) => {
                        const actualDayIndex = date.getDay();
                        const dateStr = formatDate(date);
                        const daySchedules = schedules
                            .filter(s => s.dayOfWeek === actualDayIndex)
                            .filter(s => selectedChildFilter === 'ALL' || s.childId === selectedChildFilter);

                        return (
                            <div key={dayIndex} className="flex-1 min-w-[60px] border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 relative group">
                                {/* Header */}
                                <div
                                    onClick={() => handleSlotClick(actualDayIndex, 14)}
                                    className={`h-10 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center sticky top-0 z-10 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${isToday(date) ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-white dark:bg-gray-800'}`}
                                >
                                    <span className={`text-[10px] md:text-xs font-bold ${actualDayIndex === 0 ? 'text-red-500' : actualDayIndex === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {DAYS_OF_WEEK[actualDayIndex]}
                                    </span>
                                    <span className={`text-xs md:text-sm font-bold ${isToday(date) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                        {date.getDate()}일
                                    </span>
                                    <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 text-indigo-400">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                </div>

                                {/* Time Slots Background */}
                                <div className="relative h-full">
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleSlotClick(actualDayIndex, START_HOUR + i)}
                                            className="h-16 border-b border-gray-50 dark:border-gray-800 relative hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                                        />
                                    ))}

                                    {/* Schedule Items (Absolute) */}
                                    {daySchedules.map(item => {
                                        const child = children.find(c => c.id === item.childId);
                                        if (!child) return null;
                                        const layout = getLayoutStyles(daySchedules, item, 100);
                                        const isSkipped = exceptions.some(e => e.scheduleId === item.id && e.date === dateStr);

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                                                style={{ ...layout, position: 'absolute' }}
                                                className={`p-1 md:p-1.5 rounded-lg border shadow-sm cursor-pointer hover:brightness-95 hover:z-20 transition-all flex flex-col justify-start overflow-hidden ${isSkipped ? 'opacity-50 grayscale' : ''} ${child.color.replace('bg-', 'bg-opacity-90 ')}`}
                                            >
                                                <span className="text-[8px] md:text-[10px] font-bold opacity-75 truncate">{item.startTime}</span>
                                                <span className={`text-[9px] md:text-xs font-bold leading-tight break-all whitespace-normal text-left ${isSkipped ? 'line-through' : ''}`}>
                                                    {item.title}
                                                </span>
                                                {isSkipped && <span className="text-[8px] text-red-600 font-bold bg-white/50 px-1 rounded w-fit mt-auto">결석</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );

        return (
            <div className="h-[calc(100vh-200px)] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in mb-20 md:mb-0">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="flex items-center justify-between w-full md:w-auto">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-white">
                                <CalendarIcon className="w-5 h-5 mr-2 text-indigo-500" />
                                {calendarViewMode === 'week' ? '주간 시간표' : '일간 시간표'}
                            </h2>

                            {calendarViewMode === 'day' && (
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg p-1">
                                    <button onClick={() => changeViewDate(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" /></button>
                                    <span className="text-sm font-bold w-24 text-center text-gray-700 dark:text-gray-200">
                                        {viewDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                                    </span>
                                    <button onClick={() => changeViewDate(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"><ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" /></button>
                                </div>
                            )}
                        </div>

                        {/* Mobile View Toggle (List/Grid) - Only show in Week mode */}
                        {calendarViewMode === 'week' && (
                            <div className="md:hidden flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                                <button onClick={() => setMobileListMode('list')} className={`p-1.5 rounded-md ${mobileListMode === 'list' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}><List className="w-4 h-4" /></button>
                                <button onClick={() => setMobileListMode('grid')} className={`p-1.5 rounded-md ${mobileListMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}><LayoutGrid className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                        {/* View Toggle (Week/Day) - Visible on Mobile now */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex-shrink-0">
                            <button
                                onClick={() => setCalendarViewMode('week')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${calendarViewMode === 'week' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                주간
                            </button>
                            <button
                                onClick={() => { setCalendarViewMode('day'); setViewDate(new Date()); }}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${calendarViewMode === 'day' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                일간
                            </button>
                        </div>

                        <div className="flex gap-1 flex-shrink-0">
                            <button
                                onClick={() => setSelectedChildFilter('ALL')}
                                className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${selectedChildFilter === 'ALL' ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                            >
                                전체
                            </button>
                            {children.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChildFilter(child.id)}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all border ${selectedChildFilter === child.id ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'} ${child.color}`}
                                >
                                    {child.name[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    {/* Mobile List View (Only visible on mobile when 'list' mode is active AND in 'week' view) */}
                    <div className={`md:hidden ${calendarViewMode === 'week' && mobileListMode === 'list' ? 'block' : 'hidden'} p-4 space-y-6 pb-20`}>
                        {DAYS_OF_WEEK.map((dayName, idx) => {
                            const dayDate = weekDates[idx];
                            const dateStr = formatDate(dayDate);
                            const daySchedules = schedules
                                .filter(s => s.dayOfWeek === idx)
                                .filter(s => selectedChildFilter === 'ALL' || s.childId === selectedChildFilter)
                                .sort((a, b) => a.startTime.localeCompare(b.startTime));

                            return (
                                <div key={idx} className={`relative pl-4 border-l-2 ${isToday(dayDate) ? 'border-indigo-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className={`font-bold text-lg ${isToday(dayDate) ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                            {dayName}요일 <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{dayDate.getDate()}일</span>
                                        </h3>
                                        <button
                                            onClick={() => handleSlotClick(idx, 14)}
                                            className="text-gray-400 hover:text-indigo-500 p-1"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {daySchedules.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic mb-2">일정 없음</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {daySchedules.map(item => {
                                                const child = children.find(c => c.id === item.childId);
                                                const isSkipped = exceptions.some(e => e.scheduleId === item.id && e.date === dateStr);
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => handleEditClick(item)}
                                                        className={`p-3 rounded-xl bg-white dark:bg-gray-800 border shadow-sm flex items-center justify-between ${isSkipped ? 'opacity-50 grayscale' : ''} ${child?.color.replace('bg-', 'border-').replace('100', '200') || 'border-gray-200'}`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${child?.color}`}>
                                                                    {child?.name}
                                                                </span>
                                                                <span className={`font-bold text-gray-800 dark:text-white ${isSkipped ? 'line-through' : ''}`}>{item.title}</span>
                                                            </div>
                                                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" /> {item.startTime} - {item.endTime}
                                                            </div>
                                                        </div>
                                                        {isSkipped && <span className="text-xs font-bold text-red-500">결석</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop/Tablet Grid View & Mobile Grid View (Always show if in Day mode OR Mobile Grid mode) */}
                    <div className={`h-full ${calendarViewMode === 'day' || mobileListMode === 'grid' ? 'block' : 'hidden md:block'}`}>
                        {calendarViewMode === 'week'
                            ? renderTimeGrid(weekDates)
                            : renderTimeGrid([viewDate]) // Pass single date array for daily view
                        }
                    </div>
                </div>
            </div>
        );
    };

    const renderAcademyTab = () => (
        <div className="space-y-4 animate-fade-in mb-20 md:mb-0">
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl w-full max-w-md mx-auto">
                <button
                    onClick={() => setAcademySubTab('payments')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${academySubTab === 'payments' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CreditCard className="w-4 h-4" /> 납부 현황
                    </div>
                </button>
                <button
                    onClick={() => setAcademySubTab('list')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${academySubTab === 'list' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <List className="w-4 h-4" /> 목록 관리
                    </div>
                </button>
            </div>

            {academySubTab === 'payments' ? (
                <PaymentTracker
                    schedules={schedules}
                    childrenList={children}
                    activities={activities}
                    onMarkPaid={handleMarkPaid}
                    onAddSchedule={(item) => handleSaveSchedule(item, false)}
                />
            ) : (
                <ActivityManager
                    activities={activities}
                    onAddActivity={handleAddActivity}
                    onUpdateActivity={handleUpdateActivity}
                    onRemoveActivity={handleRemoveActivity}
                />
            )}
        </div>
    );

    const renderSettingsTab = () => (
        <ChildManager
            user={user}
            childrenList={children}
            onAddChild={handleAddChild}
            onUpdateChild={handleUpdateChild}
            onRemoveChild={handleRemoveChild}
        />
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans text-gray-900 dark:text-gray-100 flex flex-col md:flex-row">

            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center sticky top-0 z-30">
                <div className="flex items-center gap-2">
                    <div className="bg-indigo-600 p-1.5 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="font-bold text-lg text-gray-800 dark:text-white">다녀와</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                        className={`p-2 rounded-full transition-colors ${isAudioEnabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                    >
                        {isAudioEnabled ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            {user?.photoUrl ? (
                                <img src={user.photoUrl} alt="Profile" className="w-8 h-8 rounded-full border border-gray-200" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                    <UserIcon className="w-5 h-5 text-gray-500" />
                                </div>
                            )}
                        </button>
                        {showProfileMenu && (
                            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 w-48 py-2 z-50 animate-fade-in-up">
                                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                    <p className="font-bold text-sm truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                                <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                    <LogOut className="w-4 h-4" /> 로그아웃
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar Navigation (Desktop) */}
            <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 p-6 sticky top-0 h-screen z-20">
                <div className="flex items-center gap-3 mb-10 px-2">
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                        <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-xl text-gray-900 dark:text-white leading-none">다녀와</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">우리 아이 일정 매니저</p>
                    </div>
                </div>

                <nav className="space-y-2 flex-1">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'today' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        <Home className="w-5 h-5" />
                        오늘의 일정
                    </button>
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        <CalendarIcon className="w-5 h-5" />
                        시간표
                    </button>
                    <button
                        onClick={() => setActiveTab('academies')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'academies' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        <School className="w-5 h-5" />
                        학원 관리
                    </button>
                    <button
                        onClick={() => setActiveTab('trend')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'trend' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        <TrendingUp className="w-5 h-5" />
                        트렌드
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'}`}
                    >
                        <Settings className="w-5 h-5" />
                        자녀 설정
                    </button>
                </nav>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user?.photoUrl ? (
                            <img src={user.photoUrl} alt="Profile" className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                <UserIcon className="w-5 h-5" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm truncate text-gray-800 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors p-1" title="로그아웃">
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all border ${isAudioEnabled ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100'}`}
                        >
                            {isAudioEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            <span className="font-bold text-xs">{isAudioEnabled ? 'ON' : 'OFF'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in overflow-x-hidden">
                {activeTab === 'today' && renderTodayTab()}
                {activeTab === 'calendar' && renderCalendarTab()}
                {activeTab === 'academies' && renderAcademyTab()}
                {activeTab === 'trend' && <TrendAnalysis childrenList={children} myActivities={activities} />}
                {activeTab === 'settings' && renderSettingsTab()}
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex justify-around p-2 pb-safe z-30 shadow-lg">
                <button onClick={() => setActiveTab('today')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'today' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    <Home className={`w-6 h-6 mb-1 ${activeTab === 'today' && 'fill-current'}`} />
                    <span className="text-[10px] font-medium">홈</span>
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    <CalendarIcon className={`w-6 h-6 mb-1 ${activeTab === 'calendar' && 'fill-current'}`} />
                    <span className="text-[10px] font-medium">시간표</span>
                </button>
                <div className="relative -top-6">
                    <button
                        onClick={() => {
                            setEditingSchedule(undefined);
                            setSelectedSlot(undefined);
                            setShowScheduleForm(true);
                        }}
                        className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-300 dark:shadow-indigo-900 active:scale-95 transition-transform"
                    >
                        <Plus className="w-7 h-7" />
                    </button>
                </div>
                <button onClick={() => setActiveTab('academies')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'academies' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    <School className={`w-6 h-6 mb-1 ${activeTab === 'academies' && 'fill-current'}`} />
                    <span className="text-[10px] font-medium">학원</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center p-2 rounded-xl w-16 ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                    <Settings className={`w-6 h-6 mb-1 ${activeTab === 'settings' && 'fill-current'}`} />
                    <span className="text-[10px] font-medium">설정</span>
                </button>
            </div>

            {showScheduleForm && (
                <ScheduleForm
                    childrenList={children}
                    activities={activities}
                    onSave={handleSaveSchedule}
                    onDelete={() => editingSchedule && handleDeleteSchedule(editingSchedule.id)}
                    onSkip={() => editingSchedule && handleSkipSchedule(editingSchedule.id)}
                    onClose={() => setShowScheduleForm(false)}
                    initialDate={selectedSlot}
                    initialData={editingSchedule}
                />
            )}

            {showBriefingSettings && (
                <BriefingSettingsModal
                    settings={briefingSettings}
                    onSave={setBriefingSettings}
                    onClose={() => setShowBriefingSettings(false)}
                />
            )}
        </div>
    );
}

export default App;
