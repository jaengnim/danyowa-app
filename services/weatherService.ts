
import { WeatherData, KoreaRegion } from "../types";

export const KOREA_REGIONS: KoreaRegion[] = [
  { id: 'seoul', name: '서울', lat: 37.5665, lon: 126.9780 },
  { id: 'busan', name: '부산', lat: 35.1796, lon: 129.0756 },
  { id: 'incheon', name: '인천', lat: 37.4563, lon: 126.7052 },
  { id: 'daegu', name: '대구', lat: 35.8714, lon: 128.6014 },
  { id: 'daejeon', name: '대전', lat: 36.3504, lon: 127.3845 },
  { id: 'gwangju', name: '광주', lat: 35.1595, lon: 126.8526 },
  { id: 'suwon', name: '수원', lat: 37.2636, lon: 127.0286 },
  { id: 'ulsan', name: '울산', lat: 35.5384, lon: 129.3114 },
  { id: 'jeju', name: '제주', lat: 33.4996, lon: 126.5312 },
];

const getWeatherCondition = (code: number): string => {
  // WMO Weather interpretation codes (WW)
  if (code === 0) return '맑음';
  if (code === 1 || code === 2 || code === 3) return '구름 많음';
  if (code === 45 || code === 48) return '안개';
  if (code >= 51 && code <= 55) return '이슬비';
  if (code >= 61 && code <= 65) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code >= 95) return '천둥번개';
  return '흐림';
};

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData | null> => {
  try {
    const params = new URLSearchParams({
      latitude: lat.toString(),
      longitude: lon.toString(),
      current: 'temperature_2m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min',
      past_days: '1', // Fetch yesterday's data as well
      timezone: 'auto'
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    );

    if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.current || !data.daily) {
      return null;
    }

    const { temperature_2m, weather_code } = data.current;
    
    // When past_days=1 is used:
    // Index 0 = Yesterday
    // Index 1 = Today
    const yesterdayMax = data.daily.temperature_2m_max?.[0] ?? 0;
    
    // Today's forecast (Index 1)
    const minTemp = data.daily.temperature_2m_min?.[1] ?? 0;
    const maxTemp = data.daily.temperature_2m_max?.[1] ?? 0;

    return {
      temperature: temperature_2m,
      conditionCode: weather_code,
      conditionText: getWeatherCondition(weather_code),
      minTemp,
      maxTemp,
      yesterdayMaxTemp: yesterdayMax
    };
  } catch (error) {
    console.error("Failed to fetch weather:", error);
    return null;
  }
};
