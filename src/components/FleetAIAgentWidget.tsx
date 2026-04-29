import React, { useState } from "react";
import { useFleetAI } from "./../hooks/useFleetAi";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { useCurrentWeather } from "../hooks/useCurrentWeather";

// Định nghĩa kiểu dữ liệu tin nhắn
interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function FleetAIAgentWidget() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // Lưu lịch sử chat

  const { data: weatherData } = useCurrentWeather();
  const { mutate: askFleetAI, isPending } = useFleetAI();

  const suggestedPrompts = [
    "Phân tích hiệu suất đội xe hôm nay",
    "Cảnh báo bảo trì định kỳ",
    "Tối ưu lộ trình dựa trên thời tiết",
  ];

  const currentWeatherCondition = weatherData?.weather?.[0]?.main || "Clear";

  const handleSend = (textToSend?: string) => {
    const finalQuery = textToSend || query; // Lấy từ gợi ý hoặc từ ô input
    if (!finalQuery.trim() || isPending) return;

    // 1. Thêm tin nhắn user vào UI ngay lập tức
    const userMsg: Message = { role: "user", content: finalQuery };
    setMessages((prev) => [...prev, userMsg]);
    setQuery(""); // Clear input

    // 2. Gọi API
    askFleetAI(
      { query: finalQuery, weather: currentWeatherCondition },
      {
        onSuccess: (data) => {
          // 3. Thêm phản hồi từ AI vào UI
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.insight },
          ]);
        },
        onError: (err) => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "⚠️ Có lỗi xảy ra: " + err.message },
          ]);
        },
      },
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">FleetOps Agent</h3>
            <p className="text-xs text-white/80">
              Gemini 1.5 • {currentWeatherCondition}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-10">
            Hãy bắt đầu bằng một câu hỏi!
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none dark:text-gray-200"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isPending && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-500">Đang phân tích...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)} // Truyền trực tiếp prompt vào hàm gửi
              className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-1.5 rounded-full transition-colors dark:text-gray-300"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Hỏi FleetOps Agent..."
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm"
            disabled={isPending}
          />
          <button
            onClick={() => handleSend()}
            disabled={!query.trim() || isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-xl transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
