// hooks/useCurrentWeather.ts
import { useQuery } from "@tanstack/react-query";

const API_KEY = "449c68a1f201bba685776223692d40e2";
const CITY = "Ho Chi Minh City";

interface WeatherData {
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string; // Clear, Rain, Clouds, Thunderstorm...
    description: string;
  }>;
  name: string;
}

export const useCurrentWeather = () => {
  return useQuery({
    queryKey: ["currentWeather"],
    queryFn: async (): Promise<WeatherData> => {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(CITY)}&units=metric&appid=${API_KEY}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 10, // Cache 10 phút
    refetchInterval: 1000 * 60 * 15, // Tự động refresh mỗi 15 phút
  });
};
