import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // Nhớ trỏ đúng đường dẫn file supabase của bạn

export function useBscData() {
  const [loading, setLoading]: any = useState(true);
  const [metrics, setMetrics]: any = useState({
    financial: { totalRevenue: 0, maintenanceCost: 0 },
    customer: { totalUsers: 0, churnRate: 0 },
    internal: { totalVehicles: 0, uptimePct: 0, lowBattery: 0 },
  });
  const [vehicles, setVehicles]: any = useState([]);
  const [trips, setTrips]: any = useState([]);
  const [users, setUsers] = useState<any>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch dữ liệu song song để tối ưu tốc độ

        const [
          { data: usersData },
          { data: vehiclesData },
          { data: maintenanceData },
        ] = await Promise.all([
          supabase.from("users").select("*"),
          supabase.from("vehicles").select("*"),
          supabase
            .from("maintenance_logs")
            .select("Cost_VND, Issue, ServiceDate"),
        ]);

        // 2. Fetch Trips chia làm 2 đợt để lấy cả Metro/Bus (VehicleID is NULL)
        // Tên biến tripsData được gộp từ 2 kết quả này
        const [resWithVehicle, resNullVehicle] = await Promise.all([
          supabase
            .from("trips")
            .select(
              "Fare_VND, Mode, Start_Station, TripID, VehicleID,Timestamp",
            )
            .not("VehicleID", "is", null),
          supabase
            .from("trips")
            .select(
              "Fare_VND, Mode, Start_Station, TripID, VehicleID,Timestamp",
            )
            .is("VehicleID", null),
        ]);

        // Gộp dữ liệu vào đúng tên biến tripsData cũ của bạn
        const tripsData = [
          ...(resWithVehicle.data || []),
          ...(resNullVehicle.data || []),
        ];

        // 1. Tính toán Financial (Tài chính)
        const revenue =
          tripsData?.reduce((sum, t) => sum + (t.Fare_VND || 0), 0) || 0;
        const cost =
          maintenanceData?.reduce((sum, m) => sum + (m.Cost_VND || 0), 0) || 0;

        // 2. Tính toán Customer (Khách hàng)
        const totalU = usersData?.length || 0;
        const churnedU =
          usersData?.filter((u) => u.Has_Churned === 1).length || 0;
        const churnR = totalU > 0 ? ((churnedU / totalU) * 100).toFixed(1) : 0;

        // 3. Tính toán Internal Process (Vận hành)
        const totalV = vehiclesData?.length || 0;
        const readyV =
          vehiclesData?.filter((v) => v.Battery_Level_Pct >= 30).length || 0;
        const lowBatV = totalV - readyV;
        const uptime = totalV > 0 ? ((readyV / totalV) * 100).toFixed(1) : 0;

        setMetrics({
          financial: { totalRevenue: revenue, maintenanceCost: cost },
          customer: { totalUsers: totalU, churnRate: churnR },
          internal: {
            totalVehicles: totalV,
            uptimePct: uptime,
            lowBattery: lowBatV,
          },
        });

        setVehicles(vehiclesData || []);
        setTrips(tripsData || []);
        setUsers(usersData || []);
        setMaintenance(maintenanceData || []);
        setLoading(false);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu BSC:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { metrics, vehicles, trips, users, loading, maintenance };
}
