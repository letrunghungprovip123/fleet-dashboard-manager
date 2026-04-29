import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Weather {
  temp: number;
  condition: string;
  iconCode: string;
  description: string;
}

const WeatherWidget = () => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);

  const API_KEY = "7be124141d498671a15a2ed415e84051";
  const CITY = "Ho Chi Minh City";

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Ho%20Chi%20Minh%20City&units=metric&appid=449c68a1f201bba685776223692d40e2`,
        );
        const data = await response.json();

        if (data.cod === 200) {
          setWeather({
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main,
            iconCode: data.weather[0].icon,
            description: data.weather[0].description,
          });
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu thời tiết:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Tự động cập nhật mỗi 30 phút
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Hàm chọn Emoji thay cho icon mặc định của API để nhìn "hiện đại" hơn
  const getWeatherEmoji = (code : any) => {
    const map : any = {
      "01": "☀️",
      "02": "⛅",
      "03": "☁️",
      "04": "☁️",
      "09": "🌧️",
      "10": "🌦️",
      "11": "⛈️",
      "13": "❄️",
      "50": "🌫️",
    };
    return map[code.substring(0, 2)] || "🌡️";
  };

  if (loading) {
    return (
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse w-32 h-8" />
    );
  }

  return (
    <AnimatePresence>
      {weather && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.05 }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm rounded-xl text-sm"
        >
          {/* Icon thời tiết nhảy nhẹ */}
          <motion.span
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-lg"
          >
            {getWeatherEmoji(weather.iconCode)}
          </motion.span>

          <div className="flex items-baseline gap-1 font-semibold text-gray-700 dark:text-gray-200">
            <span>{weather.temp}°C</span>
            <span className="text-[10px] text-gray-400 font-normal">|</span>
            <span className="text-gray-500 dark:text-gray-400 capitalize font-medium">
              {weather.condition}
            </span>
          </div>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            className="overflow-hidden"
          >
            <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-[9px] rounded font-bold tracking-tighter uppercase">
              HCMC
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WeatherWidget;
