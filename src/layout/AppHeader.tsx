// src/components/header/AppHeader.tsx
import React, { useEffect, useState } from "react";
import {
  Layout,
  Row,
  Col,
  Badge,
  Button,
  Tooltip,
  Avatar,
  Typography,
} from "antd";
import {
  BellOutlined,
  ReloadOutlined,
  CarOutlined,
  ThunderboltOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { supabase } from "../lib/supabaseClient";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import WeatherWidget from "../components/common/WeatherWidget";

const { Header } = Layout;
const { Text } = Typography;

interface DashboardMetrics {
  totalVehicles: number;
  activeVehicles: number;
  avgBattery: number;
  tripsToday: number;
  lowBatteryCount: number;
}

const AppHeader: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalVehicles: 950,
    activeVehicles: 0,
    avgBattery: 0,
    tripsToday: 0,
    lowBatteryCount: 0,
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Fetch realtime metrics từ Supabase
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // 1. Tổng xe & Low Battery
      const { data: vehicles } = await supabase
        .from("vehicles")
        .select("VehicleID, Battery_Level_Pct");

      // 2. Trips hôm nay
      const today = new Date().toISOString().split("T")[0];
      const { count: tripsToday } = await supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .gte("Timestamp", today);

      const totalVehicles = vehicles?.length || 0;
      const lowBatteryCount =
        vehicles?.filter((v) => (v.Battery_Level_Pct || 0) < 30).length || 0;
      const avgBattery = vehicles?.length
        ? Math.round(
            vehicles.reduce((sum, v) => sum + (v.Battery_Level_Pct || 0), 0) /
              vehicles.length,
          )
        : 0;

      setMetrics({
        totalVehicles,
        activeVehicles: Math.round(totalVehicles * 0.78), // giả lập hoặc tính từ trips
        avgBattery,
        tripsToday: tripsToday || 0,
        lowBatteryCount,
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Realtime subscription cho vehicles (battery thay đổi)
    const vehicleSubscription = supabase
      .channel("vehicles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => fetchMetrics(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleSubscription);
    };
  }, []);

  return (
    <Header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800 px-6 py-3 shadow-sm ">
      <Row
        align="middle"
        justify="space-between"
        className="h-full p-[20px] bg-white "
      >
        {/* Left: Brand + System Status */}
        <Col>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 ml-6 text-sm">
              <div className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400 rounded-full flex items-center gap-1">
                ● All Systems Operational
              </div>
            </div>
          </div>
        </Col>

        {/* Center: Quick Realtime KPIs */}
        <Col className="hidden lg:block">
          <Row gutter={24} align="middle">
            <Col>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Active Vehicles
                </div>
                <div className="text-xl font-semibold text-blue-600">
                  {metrics.activeVehicles}{" "}
                  <span className="text-sm text-gray-400">
                    / {metrics.totalVehicles}
                  </span>
                </div>
              </div>
            </Col>
            <Col>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Avg Battery
                </div>
                <div
                  className={`text-xl font-semibold ${metrics.avgBattery < 40 ? "text-red-500" : "text-green-600"}`}
                >
                  {metrics.avgBattery}%
                </div>
              </div>
            </Col>
            <Col>
              <div className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Trips Today
                </div>
                <div className="text-xl font-semibold">
                  {metrics.tripsToday.toLocaleString()}
                </div>
              </div>
            </Col>
            <Col>
              <Tooltip title="Xe pin thấp (< 30%)">
                <div
                  className="text-center cursor-pointer"
                  onClick={fetchMetrics}
                >
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Low Battery
                  </div>
                  <Badge>
                    <div className="text-xl font-semibold text-red-500">
                      {metrics.lowBatteryCount}
                    </div>
                  </Badge>
                </div>
              </Tooltip>
            </Col>
          </Row>
        </Col>

        {/* Right: Actions & User */}
        <Col>
          <div className="flex items-center gap-3">
            {/* Refresh */}
            {/* <Tooltip title="Refresh all data">
              <Button
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchMetrics}
                className="flex items-center justify-center"
              />
            </Tooltip> */}

            {/* Weather (có thể mở rộng sau) */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm">
              <WeatherWidget />
            </div>

            {/* AI Notification */}
            <NotificationDropdown />

            {/* User Profile */}
            <UserDropdown />
          </div>
        </Col>
      </Row>
    </Header>
  );
};

export default AppHeader;
