
export type VoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  familyId?: string;
}

export interface Child {
  id: string;
  name: string;
  age?: number;
  color: string;
  voice: VoiceName;
}

export interface Activity {
  id: string;
  name: string;
  category: 'ACADEMY' | 'SCHOOL' | 'KINDERGARTEN' | 'OTHER';
  defaultFee: number;
  defaultPaymentDay: number;
  supplies?: string;
  teacher?: string;
  phone?: string;
  address?: string;
}

export interface ScheduleItem {
  id: string;
  childId: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notifyMinutesBefore: number;
  pickupNotifyMinutesBefore?: number;
  fee: number;
  paymentCycleDay: number;
  lastPaidDate?: string;
  supplies?: string;
}

export interface ScheduleException {
  id: string;
  scheduleId: string;
  date: string;
  reason: string;
}

export interface AcademyStats {
  subject: string;
  count: number;
  percentage: number;
  icon?: string;
}

export interface AgeGroupStats {
  age: number;
  totalStudents: number;
  topAcademies: AcademyStats[];
  categoryDistribution: { label: string; value: number; color: string }[];
}

export interface WeatherData {
  temperature: number;
  conditionCode: number;
  conditionText: string;
  minTemp: number;
  maxTemp: number;
  yesterdayMaxTemp?: number;
}

export interface KoreaRegion {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface BriefingSettings {
  enabled: boolean;
  time: string; // "08:00" format
  days: number[]; // 0-6 (Sun-Sat)
}

export const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

export const AVAILABLE_COLORS = [
  'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800',
  'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800',
  'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800',
  'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-800',
  'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-800',
  'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-800',
];

export const AVAILABLE_VOICES: VoiceName[] = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

// Define global types for build-injected constants
declare global {
  // This variable is injected by Vite at build time
  var __API_KEY__: string;
  
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}