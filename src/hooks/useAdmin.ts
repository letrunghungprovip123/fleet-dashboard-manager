import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// ==========================================
// 1. TYPES DEFINITION (Dựa trên Schema)
// ==========================================

export interface User {
  UserID: string;
  Age: number | null;
  Preferred_Mode: string | null;
  Loyalty_Points: number | null;
  Has_Churned: number | null;
}

export interface Vehicle {
  VehicleID: string;
  Type: string | null;
  Battery_Level_Pct: number | null;
  Last_Maintenance_Date: string | null;
}

export interface Trip {
  TripID: string;
  UserID: string | null;
  VehicleID: string | null;
  Mode: string | null;
  Timestamp: string | null;
  Start_Station: string | null;
  End_Station: string | null;
  Duration_Mins: number | null;
  Fare_VND: number | null;
  DayOfWeek: string | null;
  Is_Weekend: number | null;
  Weather_Condition: string | null;
  Temp_Celsius: number | null;
}

// ==========================================
// 2. HOOKS CHO TỪNG TRANG ADMIN
// ==========================================

// --- HOOK: USERS ---
export function useAdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("users").select("*");
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  }, []);

  const addUser = async (newUser: Partial<User>) => {
    const { error } = await supabase.from("users").insert([newUser]);
    if (!error) await fetchUsers(); // Gọi lại danh sách để cập nhật UI
    return { error };
  };
  const updateUser = async (id: string, updates: Partial<User>) => {
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("UserID", id);
    if (!error) await fetchUsers();
    return { error };
  };

  const deleteUser = async (id: string) => {
    const { error } = await supabase.from("users").delete().eq("UserID", id);
    if (!error) setUsers((prev) => prev.filter((u) => u.UserID !== id));
    return { error };
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUser,
    deleteUser,
    addUser,
  };
}

// --- HOOK: VEHICLES ---
export function useAdminVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("vehicles").select("*");
    if (error) setError(error.message);
    else setVehicles(data || []);
    setLoading(false);
  }, []);

  const addVehicle = async (vehicle: Vehicle) => {
    const { error } = await supabase.from("vehicles").insert([vehicle]);
    if (!error) await fetchVehicles();
    return { error };
  };

  const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
    const { error } = await supabase
      .from("vehicles")
      .update(updates)
      .eq("VehicleID", id);
    if (!error) await fetchVehicles();
    return { error };
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("VehicleID", id);
    if (!error) setVehicles((prev) => prev.filter((v) => v.VehicleID !== id));
    return { error };
  };

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    loading,
    error,
    refetch: fetchVehicles,
    addVehicle,
    updateVehicle,
    deleteVehicle,
  };
}

// --- HOOK: TRIPS ---
export function useAdminTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    // Có thể bạn sẽ muốn thêm .limit() hoặc pagination sau này vì bảng trips thường rất lớn
    const { data, error } = await supabase
      .from("trips")
      .select("*")
      .order("Timestamp", { ascending: false })
      .limit(1000);

    if (error) setError(error.message);
    else setTrips(data || []);
    setLoading(false);
  }, []);

  // --- THÊM CHUYẾN ĐI MỚI ---
  const addTrip = async (newTrip: Partial<Trip>) => {
    const { error } = await supabase.from("trips").insert([newTrip]);
    if (!error) await fetchTrips(); // Refresh lại danh sách sau khi thêm
    return { error };
  };

  // --- CẬP NHẬT CHUYẾN ĐI ---
  const updateTrip = async (id: string, updates: Partial<Trip>) => {
    const { error } = await supabase
      .from("trips")
      .update(updates)
      .eq("TripID", id);
    if (!error) await fetchTrips(); // Refresh lại danh sách sau khi sửa
    return { error };
  };

  // --- XÓA CHUYẾN ĐI ---
  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from("trips").delete().eq("TripID", id);
    if (!error) setTrips((prev) => prev.filter((t) => t.TripID !== id));
    return { error };
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Nhớ return các hàm mới ra đây
  return {
    trips,
    loading,
    error,
    refetch: fetchTrips,
    addTrip,
    updateTrip,
    deleteTrip,
  };
}
