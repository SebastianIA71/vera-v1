// Open-Meteo — sin API key, gratuito
// Coordenadas Willy's, Marratxí, Mallorca
const LAT = 39.6034;
const LON = 2.7532;

export type WeatherDay = {
  date: string;       // YYYY-MM-DD
  precipMm: number;
  weatherCode: number;
  tempMax: number;
  isBad: boolean;
  description: string;
};

function wmoDescription(code: number): string {
  if (code >= 95) return 'tormenta';
  if (code >= 80) return 'chubascos';
  if (code >= 61) return 'lluvia moderada';
  if (code >= 51) return 'llovizna';
  if (code >= 45) return 'niebla';
  if (code >= 3)  return 'nublado';
  if (code >= 1)  return 'parcialmente nublado';
  return 'despejado';
}

export async function getWillysWeather(days = 7): Promise<WeatherDay[]> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&daily=precipitation_sum,weather_code,temperature_2m_max&forecast_days=${days}&timezone=Europe%2FMadrid`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.daily?.time ?? []).map((date: string, i: number) => {
      const precip = data.daily.precipitation_sum[i] ?? 0;
      const code   = data.daily.weather_code[i] ?? 0;
      const temp   = data.daily.temperature_2m_max[i] ?? 0;
      return {
        date,
        precipMm: precip,
        weatherCode: code,
        tempMax: temp,
        isBad: precip > 5 || code >= 51,
        description: wmoDescription(code),
      };
    });
  } catch {
    return [];
  }
}
