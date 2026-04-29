import { useState, useEffect } from "react";
// Thư viện cho animated icons
import ReactAnimatedWeather from "react-animated-weather";
// Ant Design icons chuẩn cho dashboard
import {
  EnvironmentOutlined,
  BellOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

export function WidgetWeather() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=Ho%20Chi%20Minh%20City&units=metric&appid=449c68a1f201bba685776223692d40e2`,
        );
        const data = await response.json();
        setWeather(data);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi fetch thời tiết:", error);
        setLoading(false);
      }
    };
    fetchWeather();
  }, []);

  if (loading)
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );

  const temp = Math.round(weather?.main?.temp);
  const feelsLike = Math.round(weather?.main?.feels_like);
  const humidity = weather?.main?.humidity;
  const wind = Math.round(weather?.wind?.speed);
  const condition = weather?.weather[0]?.main;

  // Định nghĩa màu sắc, icon animated và lời khuyên dựa trên điều kiện thời tiết thực tế
  const weatherConfigs: any = {
    Clear: {
      icon: "CLEAR_DAY",
      gradient: "from-blue-400 to-sky-600",
      advice: "Lý tưởng cho E-bike. Nhu cầu tại trạm Metro dự kiến tăng 25%.",
    },
    Clouds: {
      icon: "PARTLY_CLOUDY_DAY",
      gradient: "from-slate-400 to-slate-600",
      advice:
        "Nhu cầu bình thường. Theo dõi dự báo mưa để rebalance xe kịp thời.",
    },
    Rain: {
      icon: "RAIN",
      gradient: "from-sky-600 to-sky-900",
      advice:
        "AI dự báo doanh thu E-bike giảm. Ưu tiên kiểm tra an toàn phanh và vận hành Shuttle bus.",
    },
    Drizzle: {
      icon: "RAIN",
      gradient: "from-sky-600 to-sky-900",
      advice:
        "AI dự báo doanh thu E-bike giảm. Ưu tiên kiểm tra an toàn phanh và vận hành Shuttle bus.",
    },
    Thunderstorm: {
      icon: "RAIN",
      gradient: "from-sky-600 to-sky-900",
      advice:
        "AI dự báo doanh thu E-bike giảm. Ưu tiên kiểm tra an toàn phanh và vận hành Shuttle bus.",
    },
    Mist: {
      icon: "FOG",
      gradient: "from-slate-300 to-slate-500",
      advice: "Tầm nhìn hạn chế. Nhắc nhở tài xế đi chậm và mở đèn an toàn.",
    },
    Haze: {
      icon: "FOG",
      gradient: "from-slate-300 to-slate-500",
      advice: "Tầm nhìn hạn chế. Nhắc nhở tài xế đi chậm và mở đèn an toàn.",
    },
  };

  // Nếu điều kiện không được định nghĩa, lấy 'Clouds' làm mặc định
  const config = weatherConfigs[condition] || weatherConfigs["Clouds"];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm h-full flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}
    >
      {/* Header: Địa điểm và trạng thái "Live" với hiệu ứng animation nhẹ */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-base flex items-center gap-2 text-gray-800 dark:text-white">
          <EnvironmentOutlined className="text-teal-600" />
          HCMC, {weather?.sys?.country}
        </h3>
        <div className="flex items-center gap-2 p-1.5 px-3 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 rounded-full text-xs font-bold shadow-inner">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>{" "}
          {/* Pulse animation cho trạng thái live */}
          Live Hub
        </div>
      </div>

      {/* Visual chính: Icon animated và nhiệt độ lớn */}
      <div
        className={`flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br ${config.gradient} rounded-2xl shadow-inner my-2`}
      >
        <div className="flex flex-col items-center gap-2">
          <ReactAnimatedWeather
            icon={config.icon}
            color="white"
            size={64}
            animate={true}
          />
          <div className="text-5xl font-bold text-white tracking-tighter mt-1">
            {temp}°
          </div>
          <div className="text-xs font-medium text-white/80 uppercase tracking-widest">
            {condition} - Cảm giác như {feelsLike}°
          </div>
        </div>
      </div>

      {/* Chi tiết phụ: Độ ẩm, gió */}
      <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mt-2 shadow-inner">
        <div className="text-center p-2">
          <p className="text-xs text-gray-500">Humidity</p>
          <p className="text-lg font-bold text-teal-600">{humidity}%</p>
        </div>
        <div className="text-center p-2">
          <p className="text-xs text-gray-500">Wind</p>
          <p className="text-lg font-bold text-blue-600">{wind} km/h</p>
        </div>
      </div>

      {/* Lời khuyên vận hành với icon Info Circle */}
      <div
        className={`mt-4 p-4 rounded-xl border border-dashed border-teal-200 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-700 flex gap-3 shadow-inner`}
      >
        <InfoCircleOutlined className="mt-1 text-teal-600 text-lg flex-shrink-0" />
        <div>
          <p className="text-xs font-bold uppercase tracking-tight text-teal-800 dark:text-teal-300">
            Vận hành (Weather Logic):
          </p>
          <p className="text-sm font-medium mt-0.5 text-teal-900 dark:text-teal-200">
            {config.advice}
          </p>
        </div>
      </div>
    </div>
  );
}
