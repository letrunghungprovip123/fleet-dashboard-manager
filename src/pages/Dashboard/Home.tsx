import React from "react";
import { useMemo } from "react";
import { Table, Progress, Spin } from "antd";
import type { TableColumnsType } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
  UserOutlined,
  SettingOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { useBscData } from "../../hooks/useBscData"; // Đảm bảo hook này đã có
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { WidgetWeather } from "../../components/common/WidgetWeather";
import FleetAIAgentWidget from "../../components/FleetAIAgentWidget";
// --- Giao diện (Interfaces) ---
export interface Vehicle {
  VehicleID: string;
  Type: string;
  Battery_Level_Pct: number;
  Last_Maintenance_Date: string | null;
}

export default function Home(): React.ReactElement {
  const { metrics, vehicles, trips, users, loading, maintenance } =
    useBscData();

  const { internalStats, stationAlerts } = useMemo(() => {
    // Kiểm tra tên thuộc tính thực tế từ bản ghi đầu tiên (nếu có)
    const firstTrip = trips[0] || {};
    // Tìm key phù hợp cho End Station (đề phòng sai lệch hoa thường)
    const endStationKey =
      Object.keys(firstTrip).find((k) => k.toLowerCase() === "end_station") ||
      "End_Station";

    const allStationsFromDb = Array.from(
      new Set([
        ...trips.map((t: any) => t.Start_Station?.trim()),
        ...trips.map(
          (t: any) => t.End_Station?.trim() || t[endStationKey]?.trim(),
        ),
      ]),
    ).filter(Boolean) as string[];

    const alerts = allStationsFromDb
      .map((station) => {
        const arrivals = trips.filter(
          (t: any) =>
            (t.End_Station?.trim() || t[endStationKey]?.trim()) === station,
        ).length;
        const departures = trips.filter(
          (t: any) => t.Start_Station?.trim() === station,
        ).length;

        /** * CHIẾN LƯỢC TƯ VẤN (Consulting Logic):
         * Vì dữ liệu mẫu có lượng Out lớn (~250), ta cần INITIAL_STOCK lớn hơn
         * hoặc dùng tỷ lệ trung bình để mô phỏng trạng thái "cân bằng động".
         */
        const capacity = 500; // Tăng sức chứa để phù hợp với quy mô 2000 chuyến
        const baseStock = 300; // Giả lập số xe ban đầu đủ lớn để vận hành

        const currentStock = Math.max(0, baseStock + arrivals - departures);
        const percent = Math.min(
          100,
          Math.round((currentStock / capacity) * 100),
        );

        return {
          name: station,
          percent: percent,
          count: currentStock,
        };
      })
      .sort((a, b) => {
        const aUrgency = a.percent < 20 || a.percent > 85 ? 1 : 0;
        const bUrgency = b.percent < 20 || b.percent > 85 ? 1 : 0;
        return bUrgency - aUrgency || a.percent - b.percent;
      });

    return {
      internalStats: {
        totalTrips: trips.length,
        avgDuration: (
          trips.reduce((s: any, t: any) => s + (t.Duration_Mins || 0), 0) /
            trips.length || 0
        ).toFixed(1),
        peakUtil: metrics.internal.uptimePct,
      },
      stationAlerts: alerts.slice(0, 5),
    };
  }, [trips, metrics]);

  const { customerStats, churnDonutSeries, modePrefSeries } = useMemo(() => {
    // 1. Tính toán các con số tổng quát (Customer Stats)
    const totalUsers = metrics.customer.totalUsers;
    const churnRate = metrics.customer.churnRate;

    // Tính trung bình điểm Loyalty từ usersData
    const avgLoyalty =
      users.length > 0
        ? Math.round(
            users.reduce(
              (sum: any, u: any) => sum + (u.Loyalty_Points || 0),
              0,
            ) / users.length,
          )
        : 0;

    // 2. Phân khúc Churn Risk (Donut Chart)
    // Giả lập dựa trên thực tế: High Risk (đã churn), Medium Risk (Loyalty thấp), Low Risk
    const total = users.length;
    const highRisk = users.filter((u: any) => u.Has_Churned === 1).length;
    const lowRisk = users.filter((u: any) => u.Loyalty_Points > 500).length;
    const medRisk = Math.max(0, users.length - highRisk - lowRisk);

    const churnDonutSeries = [
      Number(((lowRisk / total) * 100).toFixed(1)),
      Number(((medRisk / total) * 100).toFixed(1)),
      Number(((highRisk / total) * 100).toFixed(1)),
    ];

    // 3. Sở thích di chuyển (Mode Preference - Bar Chart)
    // Đếm số lượng user theo Preferred_Mode
    const getModeCount = (mode: string) =>
      users.filter((u: any) => u.Preferred_Mode === mode).length;

    const modePrefSeries = [
      {
        name: "Người dùng",
        data: [
          getModeCount("E-Bike"),
          getModeCount("Shuttle"),
          getModeCount("Metro/Bus"),
        ],
      },
    ];

    return {
      customerStats: {
        activeUsers: totalUsers,
        churnRate: churnRate,
        avgLoyalty: avgLoyalty,
      },
      churnDonutSeries,
      modePrefSeries,
    };
  }, [users, metrics]);

  interface MonthlyBucket {
    label: string;
    m: number; // Month index 0-11
    y: number; // Year
    ebike: number;
    shuttle: number;
    flowpass: number;
  }

  const {
    revenueTrend,
    uptimeTrend,
    revByModeSeries,
    financialStats,
    monthLabels,
  } = useMemo(() => {
    // 1. Khởi tạo 6 tháng mục tiêu (T5/2025 -> T10/2025)
    const last6Months: MonthlyBucket[] = [
      { label: "T5/25", m: 4, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
      { label: "T6/25", m: 5, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
      { label: "T7/25", m: 6, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
      { label: "T8/25", m: 7, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
      { label: "T9/25", m: 8, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
      { label: "T10/25", m: 9, y: 2025, ebike: 0, shuttle: 0, flowpass: 0 },
    ];

    if (trips && trips.length > 0) {
      trips.forEach((trip: any) => {
        // Nếu không có Timestamp thì skip
        if (!trip.Timestamp) return;

        const tripDate = new Date(trip.Timestamp);
        const m = tripDate.getMonth();
        const y = tripDate.getFullYear();

        // Tìm tháng khớp trong danh sách
        const bucket = last6Months.find((b) => b.m === m && b.y === y);

        if (bucket) {
          const fare = Number(trip.Fare_VND || 0);
          const mode = (trip.Mode || "").toLowerCase();

          if (mode.includes("ebike") || mode.includes("e-bike")) {
            bucket.ebike += fare;
          } else if (mode.includes("shuttle")) {
            bucket.shuttle += fare;
          } else {
            bucket.flowpass += fare;
          }
        }
      });
    }

    const formatM = (val: number): number => Number((val / 1000000).toFixed(2));

    return {
      revenueTrend: last6Months.map((b) =>
        formatM(b.ebike + b.shuttle + b.flowpass),
      ),
      uptimeTrend: [
        92,
        95,
        91,
        96,
        94,
        Number(metrics.internal.uptimePct) || 0, // Tháng hiện tại lấy số liệu thật
      ],
      monthLabels: last6Months.map((b) => b.label),
      financialStats: {
        revenueM: (metrics.financial.totalRevenue / 1000000).toFixed(1),
        costM: (metrics.financial.maintenanceCost / 1000000).toFixed(1),
        margin:
          metrics.financial.totalRevenue > 0
            ? (
                ((metrics.financial.totalRevenue -
                  metrics.financial.maintenanceCost) /
                  metrics.financial.totalRevenue) *
                100
              ).toFixed(1)
            : "0",
      },
      revByModeSeries: [
        { name: "E-bike", data: last6Months.map((b) => formatM(b.ebike)) },
        { name: "Shuttle", data: last6Months.map((b) => formatM(b.shuttle)) },
        { name: "FlowPass", data: last6Months.map((b) => formatM(b.flowpass)) },
      ],
    };
  }, [trips, metrics]);

  const { maintenanceSeries, maintLabels, learningStats } = useMemo(() => {
    // 1. Định nghĩa khung 5 tháng (T11/25 -> T3/26)
    const buckets = [
      {
        label: "T11/25",
        m: 10,
        y: 2025,
        thayPin: 0,
        baoDuong: 0,
        suaPhanh: 0,
        khac: 0,
      },
      {
        label: "T12/25",
        m: 11,
        y: 2025,
        thayPin: 0,
        baoDuong: 0,
        suaPhanh: 0,
        khac: 0,
      },
      {
        label: "T1/26",
        m: 0,
        y: 2026,
        thayPin: 0,
        baoDuong: 0,
        suaPhanh: 0,
        khac: 0,
      },
      {
        label: "T2/26",
        m: 1,
        y: 2026,
        thayPin: 0,
        baoDuong: 0,
        suaPhanh: 0,
        khac: 0,
      },
      {
        label: "T3/26",
        m: 2,
        y: 2026,
        thayPin: 0,
        baoDuong: 0,
        suaPhanh: 0,
        khac: 0,
      },
    ];

    // 2. Phân loại dữ liệu từ maintenance logs
    maintenance?.forEach((log: any) => {
      if (!log.ServiceDate) return;
      const d = new Date(log.ServiceDate);
      const m = d.getMonth();
      const y = d.getFullYear();

      const bucket = buckets.find((b) => b.m === m && b.y === y);
      if (bucket) {
        const issue = (log.Issue || "").toLowerCase();

        // Logic phân loại từ khóa
        if (issue.includes("pin")) bucket.thayPin++;
        else if (issue.includes("bảo dưỡng")) bucket.baoDuong++;
        else if (issue.includes("phanh")) bucket.suaPhanh++;
        else bucket.khac++;
      }
    });

    return {
      maintLabels: buckets.map((b) => b.label),
      learningStats: {
        uptime: metrics.internal.uptimePct,
        avgBattery: metrics.internal.avgBattery,
        criticalCount: metrics.internal.lowBattery,
      },
      maintenanceSeries: [
        { name: "Thay pin", data: buckets.map((b) => b.thayPin) },
        { name: "Bảo dưỡng định kỳ", data: buckets.map((b) => b.baoDuong) },
        { name: "Sửa phanh", data: buckets.map((b) => b.suaPhanh) },
        { name: "Khác", data: buckets.map((b) => b.khac) },
      ],
    };
  }, [maintenance, metrics]);

  const maintenanceOptions: ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      dropShadow: { enabled: true, top: 3, left: 2, blur: 4, opacity: 0.1 },
    },
    // Màu sắc cho 4 đường: Pin (Đỏ), Bảo dưỡng (Xanh lá), Phanh (Vàng), Khác (Xám)
    colors: ["#EF4444", "#10B981", "#F59E0B", "#6B7280"],
    stroke: { curve: "smooth", width: 3 },
    xaxis: {
      categories: maintLabels,
      labels: { style: { colors: "#9ca3af" } },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: { style: { colors: "#9ca3af" } },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
      markers: { size: 6 },
    },
    markers: { size: 4, strokeWidth: 2 },
    grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
    tooltip: { shared: true, intersect: false },
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spin
          size="large"
          tip="Đang đồng bộ dữ liệu SaigonFlow (Single Source of Truth)..."
        />
      </div>
    );
  }

  // Options cho Line Chart
  // const maintenanceOptions: ApexOptions = {
  //   chart: {
  //     type: "line",
  //     toolbar: { show: false },
  //     zoom: { enabled: false },
  //     dropShadow: { enabled: true, top: 3, left: 2, blur: 4, opacity: 0.1 }
  //   },
  //   stroke: { curve: "smooth", width: 3 },
  //   colors: ["#EF4444"], // Màu đỏ đặc trưng của bảo trì
  //   xaxis: {
  //     categories: monthLabels, // Dùng chung mảng label T5-T10 bạn đã làm
  //     labels: { style: { colors: "#9ca3af" } }
  //   },
  //   yaxis: {
  //     labels: { style: { colors: "#9ca3af" } },
  //     title: { text: "Số ca", style: { color: "#9ca3af", fontWeight: 400 } }
  //   },
  //   markers: { size: 4, colors: ["#EF4444"], strokeWidth: 2 },
  //   grid: { borderColor: "#f1f1f1", strokeDashArray: 3 },
  //   tooltip: { x: { show: true } }
  // };

  // ==========================================
  // CONFIG BIỂU ĐỒ (APEXCHARTS) THEO CHUẨN HTML CỦA BẠN
  // ==========================================

  // 1. Sparklines cho 4 Thẻ KPI
  const sparklineOptions: ApexOptions = {
    chart: { type: "area", sparkline: { enabled: true } },
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0 } },
    tooltip: {
      fixed: { enabled: false },
      x: { show: false },
      y: { title: { formatter: () => "" } },
      marker: { show: false },
    },
  };

  // 2. Radar Chart (BSC Overview)
  const radarOptions: ApexOptions = {
    chart: {
      type: "radar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    labels: ["Tài chính", "Khách hàng", "Vận hành", "Đổi mới"],
    stroke: { width: 2 },
    fill: { opacity: 0.2 },
    markers: { size: 3 },
    yaxis: { show: false, min: 50, max: 120 },
    legend: { show: false },
  };
  const radarSeries = [
    { name: "Thực tế", data: [105, 86, 101, 98], color: "#0D9488" },
    { name: "Mục tiêu", data: [100, 100, 100, 100], color: "#9CA3AF" },
  ];

  // Thêm hàm này bên ngoài component hoặc bên trong useMemo
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `T${d.getMonth() + 1}`;
  });
  // 3. Biểu đồ Cột Nhóm (Revenue by Mode)
  const revModeOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      stacked: false,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#0D9488", "#3B82F6", "#F59E0B"],
    plotOptions: { bar: { borderRadius: 2, columnWidth: "60%" } },
    dataLabels: { enabled: false },
    stroke: { width: 1, colors: ["transparent"] },
    // Cập nhật Categories động (xem bước 2)
    xaxis: {
      categories: lastSixMonths,
      axisBorder: { show: false },
      labels: { style: { colors: "#9ca3af" } },
    },
    // THÊM CẤU HÌNH TRỤC Y
    yaxis: {
      labels: {
        formatter: (val) => `₫${val}M`, // Hiển thị đơn vị ở cột bên trái
        style: { colors: "#9ca3af" },
      },
    },
    // THÊM CẤU HÌNH TOOLTIP (Khi rê chuột vào cột)
    tooltip: {
      y: {
        formatter: (val) => `₫${val} Triệu VNĐ`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      markers: { size: 12 },
    },
  };
  const revModeSeries = [
    { name: "E-bike", data: [128, 135, 142, 148, 154, 160] },
    { name: "Shuttle", data: [74, 78, 82, 85, 88, 94] },
    { name: "FlowPass", data: [38, 42, 44, 46, 48, 52] },
  ];

  // 4. Donut Chart (Churn Risk)
  const churnDonutOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      animations: { enabled: true, speed: 800 },
    },
    colors: ["#22C55E", "#F59E0B", "#EF4444"],
    labels: ["Rủi ro thấp", "Rủi ro TB", "Rủi ro cao"],
    stroke: { width: 0 }, // Xóa viền trắng để nhìn hiện đại hơn
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "75%", // Tăng kích thước vòng trong để thoáng hơn
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: "12px",
              offsetY: -10,
            },
            value: {
              show: true,
              fontSize: "20px",
              fontWeight: 700,
              offsetY: 5,
              formatter: (val) => `${val}%`, // Hiển thị % ngay giữa
            },
            total: {
              show: true,
              label: "Rủi ro cao",
              fontSize: "12px",
              color: "#9CA3AF",
              formatter: (w) => {
                // Lấy % của Rủi ro cao để làm chỉ số cảnh báo trung tâm
                return `${w.globals.series[2]}%`;
              },
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    // Legend nhỏ xinh ở dưới
    legend: {
      show: true,
      position: "bottom",
      horizontalAlign: "center",
      fontSize: "11px",
      markers: { size: 12 },
      itemMargin: { horizontal: 10, vertical: 5 },
    },
    tooltip: {
      theme: "light",
      enabled: true,
      y: {
        formatter: (val: number) => `${val}%`,
      },
    },
  };

  // 5. Horizontal Bar (Mode Preference)
  const modePrefOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      // Giúp tooltip có không gian hiển thị, không bị cắt mất
      parentHeightOffset: 0,
    },
    colors: ["#F59E0B", "#3B82F6", "#0D9488"],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 3,
        distributed: true,
        barHeight: "60%",
      },
    },
    dataLabels: {
      enabled: true, // Bật cái này lên để thấy con số thật ngay trên cột
      formatter: (val) => val.toLocaleString(),
      style: { fontSize: "10px" },
    },
    xaxis: {
      categories: ["FlowPass", "Shuttle", "E-bike"],
      // QUAN TRỌNG: Xóa số 100 đi để biểu đồ tự scale
      max: undefined,
      labels: {
        style: { colors: "#9CA3AF" },
      },
    },
    tooltip: {
      theme: "light",
      // Cố định tooltip vào bên trong chart để không văng ra ngoài màn hình
      fixed: {
        enabled: true,
        position: "topRight",
        offsetY: 0,
        offsetX: -10,
      },
    },
    legend: { show: false },
  };
  // const modePrefSeries = [{ name: "Tỷ lệ %", data: [19, 33, 48] }];

  // 6. Cột ngang (Top Issues)
  const issuesOptions: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#EF4444", "#F59E0B", "#F87171", "#FCD34D", "#FCA5A5"],
    plotOptions: {
      bar: { horizontal: true, borderRadius: 3, distributed: true },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [
        "Pin chai",
        "Thủng lốp",
        "Lỗi motor",
        "Lỗi phanh",
        "Màn hình lỗi",
      ],
    },
    legend: { show: false },
  };
  const issuesSeries = [{ name: "Số vụ", data: [87, 64, 52, 41, 28] }];

  // ==========================================
  // BẢNG QUẢN TRỊ ADMIN (TABLE)
  // ==========================================
  const vehicleColumns: TableColumnsType<Vehicle> = [
    {
      title: "Vehicle ID",
      dataIndex: "VehicleID",
      key: "id",
      className: "font-semibold",
    },
    {
      title: "Loại",
      dataIndex: "Type",
      key: "type",
      render: (t) => (
        <span
          className={`px-2 py-1 rounded text-xs ${t === "E-Bike" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"}`}
        >
          {t}
        </span>
      ),
    },
    {
      title: "Pin",
      dataIndex: "Battery_Level_Pct",
      key: "battery",
      render: (pct) => (
        <Progress
          percent={pct}
          size="small"
          showInfo={false}
          strokeColor={pct < 20 ? "#EF4444" : "#10B981"}
          className="w-24 m-0"
        />
      ),
    },
    {
      title: "Trạng Thái",
      key: "status",
      render: (_, r) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${r.Battery_Level_Pct >= 20 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {r.Battery_Level_Pct >= 20 ? "Sẵn sàng" : "Cần sạc"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-200">
      <PageMeta
        title="SaigonFlow Strategic Dashboard"
        description="Unified BSC Fleet Manager"
      />

      {/* TONE 1: STATUS BANNER (RAG & SPARKLINES) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* Card: Financial (Doanh thu) */}
        <div className="bg-white dark:bg-gray-800 border-t-4 border-t-teal-500 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Tài chính
            </div>
            <div className="text-2xl font-bold mt-1">
              {/* Định dạng tiền tệ ra Triệu (M) */}₫
              {(metrics.financial.totalRevenue / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Mục tiêu: ₫800M doanh thu
            </div>
            {/* Logic tự động đổi màu trạng thái dựa trên % đạt được */}
            {metrics.financial.totalRevenue >= 800000000 ? (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                ● On track ·{" "}
                {((metrics.financial.totalRevenue / 800000000) * 100).toFixed(
                  0,
                )}
                %
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                ● Off track ·{" "}
                {((metrics.financial.totalRevenue / 800000000) * 100).toFixed(
                  0,
                )}
                %
              </div>
            )}
          </div>
          <div className="h-12 mt-2">
            <ReactApexChart
              options={{ ...sparklineOptions, colors: ["#0D9488"] }}
              series={[{ data: revenueTrend }]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* Card: Customer (Churn Rate) */}
        <div className="bg-white dark:bg-gray-800 border-t-4 border-t-blue-500 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Khách hàng
            </div>
            <div className="text-2xl font-bold mt-1">
              {metrics.customer.churnRate}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Mục tiêu: &lt; 10% Churn rate
            </div>
            {metrics.customer.churnRate <= 10 ? (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                ● On track
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
                ● Off track ·{" "}
                {((metrics.customer.churnRate / 10) * 100).toFixed(0)}%
              </div>
            )}
          </div>
          <div className="h-12 mt-2">
            <ReactApexChart
              options={{ ...sparklineOptions, colors: ["#EF4444"] }}
              series={[
                {
                  name: "Tỷ lệ rời bỏ",
                  data: [
                    8.2,
                    9.1,
                    9.8,
                    10.2,
                    10.5,
                    11.0,
                    Number(metrics.customer.churnRate),
                  ],
                },
              ]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* Card: Internal Process (Uptime / Sẵn sàng của xe) */}
        <div className="bg-white dark:bg-gray-800 border-t-4 border-t-amber-500 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Vận hành (Process)
            </div>
            <div className="text-2xl font-bold mt-1">
              {metrics.internal.uptimePct}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Mục tiêu: Sẵn sàng ≥ 95%
            </div>
            {metrics.internal.uptimePct >= 95 ? (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
                ● On track
              </div>
            ) : (
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                ● Watch · {metrics.internal.uptimePct}%
              </div>
            )}
          </div>
          <div className="h-12 mt-2">
            <ReactApexChart
              options={{
                ...sparklineOptions,
                colors: ["#F59E0B"],
                // Ghi đè cấu hình tooltip mặc định của sparkline
                tooltip: {
                  ...sparklineOptions.tooltip,
                  y: {
                    formatter: (val) => `${val}%`, // Hiện thêm dấu % sau số 98
                    title: {
                      formatter: () => "Tỷ lệ: ", // Hiện thêm chữ Tỷ lệ
                    },
                  },
                },
              }}
              series={[{ name: "Uptime", data: uptimeTrend }]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* Card: Learning & Growth (Đổi mới) */}
        {/* LƯU Ý: Hook hiện tại của bạn chưa có cột learning. 
      Tạm thời dùng số tĩnh, hoặc bạn có thể update hook như tôi đã gợi ý ở lần trước */}
        <div className="bg-white dark:bg-gray-800 border-t-4 border-t-red-500 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Học hỏi & Đổi mới
            </div>
            <div className="text-2xl font-bold mt-1">85.0%</div>
            <div className="text-xs text-gray-400 mt-1">Áp dụng AI Chatbot</div>
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
              ● Fleet health · Maintenance Trends
            </div>
          </div>
          <div className="h-12 mt-2">
            <ReactApexChart
              options={{ ...sparklineOptions, colors: ["#3B82F6"] }}
              series={[{ data: [60, 65, 70, 75, 80, 82, 85] }]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* Radar Chart: BSC Health */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm flex flex-col">
          <div className="text-sm font-semibold">BSC Health Radar</div>
          <div className="text-xs text-gray-400">Thực tế vs Mục tiêu (%)</div>
          <div className="flex-1 mt-2 -mb-4 -ml-4">
            <ReactApexChart
              options={radarOptions}
              // Đổ data động vào Radar Chart để hình chóp thay đổi theo Supabase
              series={[
                {
                  name: "Hiện tại",
                  data: [
                    Math.min(
                      100,
                      (metrics.financial.totalRevenue / 800000000) * 100,
                    ), // Financial
                    Math.max(0, 100 - metrics.customer.churnRate * 5), // Customer (Càng thấp càng tốt)
                    metrics.internal.uptimePct, // Internal
                    85, // Learning (Tạm giữ 85)
                  ],
                },
              ]}
              type="radar"
              height="150px"
            />
          </div>
        </div>
      </div>
      {/* TONE 2: 2x2 BSC GRID + ALERTS */}
      <div className="grid gap-6 mb-6">
        {/* CỘT TRÁI (Chiếm 2/3 không gian cho 4 bảng BSC) */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel 1: FINANCIAL */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 text-xl">
                <WalletOutlined />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  Financial Perspective
                </h3>
                <p className="text-xs text-gray-500">
                  Revenue · Cost · Profitability
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Tổng Doanh Thu</p>
                <p className="text-lg font-bold text-teal-600">
                  ₫{financialStats.revenueM}M
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  {/* So sánh với mục tiêu 800M của SaigonFlow */}↑{" "}
                  {(
                    (Number(financialStats.revenueM) / 800) * 100 -
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">
                  Chi phí bảo trì
                </p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  ₫{financialStats.costM}M
                </p>
                <p className="text-[10px] text-amber-600 font-medium mt-1">
                  Thực tế{" "}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Biên lợi nhuận</p>
                <p
                  className={`text-lg font-bold ${parseInt(financialStats.margin) > 0 ? "text-teal-600" : "text-red-600"}`}
                >
                  {financialStats.margin}%
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  ROI Focused
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Cơ cấu doanh thu theo Mode (₫M)
              </p>
              <ReactApexChart
                options={revModeOptions}
                series={revByModeSeries} // Dùng series thật từ useMemo
                type="bar"
                height={360}
              />
            </div>
          </div>

          {/* Panel 2: CUSTOMER */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xl">
                <UserOutlined />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  Customer Perspective
                </h3>
                <p className="text-xs text-gray-500">Users · Churn · Loyalty</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Active Users</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  1,105
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  ↑ 8.3%
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Churn Rate</p>
                <p className="text-lg font-bold text-red-600">11.4%</p>
                <p className="text-[10px] text-red-600 font-medium mt-1">
                  ↑ 1.2pp
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Avg Loyalty</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  342 pts
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  ↑ 18 pts
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Phân khúc Churn Risk
                </p>
                <ReactApexChart
                  options={churnDonutOptions}
                  series={churnDonutSeries} // Đã đổ dữ liệu thật từ DB [cite: 52]
                  type="donut"
                  height={360}
                />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Sở thích di chuyển
                </p>
                <ReactApexChart
                  options={modePrefOptions}
                  series={modePrefSeries}
                  type="bar"
                  height={360}
                />
              </div>
            </div>
          </div>

          {/* Panel 3: INTERNAL PROCESS */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600 text-xl">
                <SettingOutlined />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  Internal Process
                </h3>
                <p className="text-xs text-gray-500">
                  Trips · Demand · Efficiency
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Tổng chuyến đi</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {internalStats.totalTrips.toLocaleString()}
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  Cập nhật Live
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">T.Gian TB</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  {internalStats.avgDuration}m
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  Target &lt;20m
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Peak Util.</p>
                <p className="text-lg font-bold text-teal-600">
                  {internalStats.peakUtil}%
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  Đạt chỉ tiêu
                </p>
              </div>
            </div>

            {/* Render động Top 3 trạm nóng nhất dựa vào data thực tế */}
            <div className="flex flex-col gap-2.5">
              {stationAlerts.map((station: any, index: number) => {
                // Xác định màu sắc và câu cảnh báo dựa trên tỷ lệ %
                let strokeColor = "#10B981"; // Xanh lá (Bình thường)
                let statusText = "Hoạt động ổn định";
                let statusClass = "text-gray-400";

                if (station.percent < 20) {
                  strokeColor = "#EF4444"; // Đỏ
                  statusText = `Cảnh báo: Sắp cạn xe (${station.count} xe)`;
                  statusClass = "text-red-500 font-medium";
                } else if (station.percent > 85) {
                  strokeColor = "#F59E0B"; // Cam/Vàng
                  statusText = `Cảnh báo: Trạm quá tải (${station.count} xe)`;
                  statusClass = "text-yellow-600 font-medium";
                }

                return (
                  <div key={index}>
                    <div className="flex justify-between items-end mb-1">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {station.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-500">
                        {station.percent}%
                      </p>
                    </div>
                    <Progress
                      percent={station.percent}
                      strokeColor={strokeColor}
                      status="active"
                      showInfo={false}
                      size="small"
                      className="m-0"
                    />
                    <p className={`text-[10px] mt-0.5 ${statusClass}`}>
                      {statusText}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel 4: LEARNING & GROWTH */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600 text-xl">
                <ToolOutlined />
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  Learning & Growth
                </h3>
                <p className="text-xs text-gray-500">
                  Fleet health · Maintenance Trends
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* Fleet Uptime */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Fleet Uptime</p>
                <p className="text-lg font-bold text-teal-600">
                  {learningStats.uptime}%
                </p>
                <p className="text-[10px] text-green-600 font-medium mt-1">
                  Target 98%
                </p>
              </div>

              {/* Pin trung bình */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Pin trung bình</p>
                <p className="text-lg font-bold text-amber-600">
                  {learningStats.avgBattery}%
                </p>
                <p className="text-[10px] text-red-600 font-medium mt-1">
                  Low: {learningStats.criticalCount} xe
                </p>
              </div>

              {/* Tổng ca bảo trì */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                <p className="text-[10px] text-gray-500 mb-1">Tổng bảo trì</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  {maintenance.length}
                </p>
                <p className="text-[10px] text-gray-400 font-medium mt-1">
                  Giai đoạn T11-T3
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                So sánh tần suất lỗi hệ thống
              </p>
              <ReactApexChart
                options={maintenanceOptions}
                series={maintenanceSeries}
                type="line"
                height={360}
              />
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (Chiếm 1/3 không gian cho Alert Strip & Admin Table) */}
      </div>

      <div className="flex flex-col xl:col-span-4 gap-6">
        {/* ZONE 3: ALERT STRIP (Thiết kế dọc thay vì ngang để vừa Sidebar) */}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <FleetAIAgentWidget />
          <WidgetWeather />
        </div>

        {/* ZONE 4: ADMIN TABLE (Inventory) */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base">Live Inventory</h3>
            <span className="text-xs text-blue-600 cursor-pointer">
              View all
            </span>
          </div>
          <Table<Vehicle>
            dataSource={vehicles}
            columns={vehicleColumns}
            rowKey="VehicleID"
            pagination={{ pageSize: 4, size: "small" }}
            className="custom-tailwind-table text-xs"
            bordered={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
}
