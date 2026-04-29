import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Tag, Button, Progress } from "antd";
import { ArrowLeftOutlined, AimOutlined } from "@ant-design/icons";
import L from "leaflet";

// ==========================================
// 1. TẠO CUSTOM MARKER BẰNG ẢNH PNG (KẾT HỢP VIỀN CSS)
// ==========================================
// Hàm tạo marker nhúng ảnh PNG, vẫn giữ viền màu để phân biệt trạng thái
const createCustomImageMarker = (
  imageUrl: string,
  bgHex: string,
  borderHex: string,
) => {
  return L.divIcon({
    className: "bg-transparent border-0",
    html: `
      <div style="
        background-color: ${bgHex}; 
        border: 2px solid ${borderHex}; 
        border-radius: 50%; 
        width: 40px; 
        height: 40px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s;
      ">
        <img src="${imageUrl}" alt="icon" style="width: 22px; height: 22px; object-fit: contain;" />
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  });
};


// Định nghĩa các loại Marker với đường dẫn ảnh tương ứng
const eBikeIcon = createCustomImageMarker(
  "/images/motorbike.png",
  "#dcfce7",
  "#22c55e",
); // Xe đạp - Xanh lá
const shuttleIcon = createCustomImageMarker(
  "/images/hotel-shuttle.png",
  "#dbeafe",
  "#3b82f6",
); // Xe buýt - Xanh dương
const criticalIcon = createCustomImageMarker(
  "/images/motorbike.png",
  "#fee2e2",
  "#ef4444",
); // Xe đạp lỗi - Đỏ

// ==========================================
// 2. DỮ LIỆU MÔ PHỎNG (MOCK DATA)
// ==========================================
const mockFleetData = [
  {
    id: "EB-081",
    type: "E-bike",
    lat: 10.8015,
    lng: 106.7383,
    battery: 15,
    status: "Nguy cấp",
    location: "Ga Thảo Điền",
  },
  {
    id: "EB-102",
    type: "E-bike",
    lat: 10.802,
    lng: 106.739,
    battery: 85,
    status: "Sẵn sàng",
    location: "Ga Thảo Điền",
  },
  {
    id: "SB-005",
    type: "Shuttle",
    lat: 10.7325,
    lng: 106.7021,
    battery: 100,
    status: "Đang chạy",
    location: "Quận 7 -> Q1",
  },
  {
    id: "EB-405",
    type: "E-bike",
    lat: 10.8695,
    lng: 106.8032,
    battery: 90,
    status: "Overflow",
    location: "Ga Suối Tiên",
  },
  {
    id: "EB-406",
    type: "E-bike",
    lat: 10.8698,
    lng: 106.803,
    battery: 95,
    status: "Overflow",
    location: "Ga Suối Tiên",
  },
  {
    id: "EB-011",
    type: "E-bike",
    lat: 10.7761,
    lng: 106.7005,
    battery: 45,
    status: "Đang thuê",
    location: "Phố đi bộ Nguyễn Huệ",
  },
  {
    id: "EB-081",
    type: "E-bike",
    lat: 10.8015,
    lng: 106.7383,
    battery: 15,
    status: "Nguy cấp",
    location: "Ga Thảo Điền",
  },
  {
    id: "EB-102",
    type: "E-bike",
    lat: 10.802,
    lng: 106.739,
    battery: 85,
    status: "Sẵn sàng",
    location: "Ga Thảo Điền",
  },
  {
    id: "SB-005",
    type: "Shuttle",
    lat: 10.7325,
    lng: 106.7021,
    battery: 100,
    status: "Đang chạy",
    location: "Quận 7 -> Q1",
  },
  {
    id: "EB-405",
    type: "E-bike",
    lat: 10.8695,
    lng: 106.8032,
    battery: 90,
    status: "Overflow",
    location: "Ga Suối Tiên",
  },
  {
    id: "EB-406",
    type: "E-bike",
    lat: 10.8698,
    lng: 106.803,
    battery: 95,
    status: "Overflow",
    location: "Ga Suối Tiên",
  },
  {
    id: "EB-011",
    type: "E-bike",
    lat: 10.7761,
    lng: 106.7005,
    battery: 45,
    status: "Đang thuê",
    location: "Phố đi bộ Nguyễn Huệ",
  },

  // --- 30 DATA MỚI THÊM VÀO ---
  {
    id: "EB-012",
    type: "E-bike",
    lat: 10.7725,
    lng: 106.698,
    battery: 80,
    status: "Sẵn sàng",
    location: "Chợ Bến Thành (Q1)",
  },
  {
    id: "EB-013",
    type: "E-bike",
    lat: 10.7798,
    lng: 106.699,
    battery: 18,
    status: "Đang thuê",
    location: "Nhà thờ Đức Bà (Q1)",
  },
  {
    id: "EB-014",
    type: "E-bike",
    lat: 10.7825,
    lng: 106.695,
    battery: 95,
    status: "Sẵn sàng",
    location: "Hồ Con Rùa (Q3)",
  },
  {
    id: "EB-015",
    type: "E-bike",
    lat: 10.771,
    lng: 106.668,
    battery: 12,
    status: "Nguy cấp",
    location: "Vạn Hạnh Mall (Q10)",
  },
  {
    id: "EB-016",
    type: "E-bike",
    lat: 10.793,
    lng: 106.721,
    battery: 100,
    status: "Sẵn sàng",
    location: "Landmark 81 (Bình Thạnh)",
  },
  {
    id: "EB-017",
    type: "E-bike",
    lat: 10.828,
    lng: 106.719,
    battery: 65,
    status: "Đang thuê",
    location: "Gigamall Phạm Văn Đồng",
  },
  {
    id: "EB-018",
    type: "E-bike",
    lat: 10.795,
    lng: 106.688,
    battery: 50,
    status: "Đang thuê",
    location: "Phan Xích Long (Phú Nhuận)",
  },
  {
    id: "SB-006",
    type: "Shuttle",
    lat: 10.814,
    lng: 106.665,
    battery: 88,
    status: "Đang chạy",
    location: "Sân bay Tân Sơn Nhất -> Q1",
  },
  {
    id: "EB-019",
    type: "E-bike",
    lat: 10.757,
    lng: 106.671,
    battery: 30,
    status: "Sẵn sàng",
    location: "Chợ An Đông (Q5)",
  },
  {
    id: "EB-020",
    type: "E-bike",
    lat: 10.76,
    lng: 106.702,
    battery: 85,
    status: "Sẵn sàng",
    location: "Đường Hoàng Diệu (Q4)",
  },
  {
    id: "EB-021",
    type: "E-bike",
    lat: 10.729,
    lng: 106.718,
    battery: 90,
    status: "Sẵn sàng",
    location: "Crescent Mall (Q7)",
  },
  {
    id: "EB-022",
    type: "E-bike",
    lat: 10.73,
    lng: 106.695,
    battery: 8,
    status: "Nguy cấp",
    location: "Đại học RMIT (Q7)",
  },
  {
    id: "SB-007",
    type: "Shuttle",
    lat: 10.805,
    lng: 106.745,
    battery: 92,
    status: "Đang chạy",
    location: "Cantavil -> Thảo Điền (Q2)",
  },
  {
    id: "EB-023",
    type: "E-bike",
    lat: 10.768,
    lng: 106.72,
    battery: 75,
    status: "Đang thuê",
    location: "Khu đô thị Sala (Q2)",
  },
  {
    id: "EB-024",
    type: "E-bike",
    lat: 10.85,
    lng: 106.799,
    battery: 100,
    status: "Sẵn sàng",
    location: "Khu Công Nghệ Cao (Q9)",
  },
  {
    id: "EB-025",
    type: "E-bike",
    lat: 10.875,
    lng: 106.8,
    battery: 15,
    status: "Nguy cấp",
    location: "Làng Đại học Quốc Gia",
  },
  {
    id: "EB-026",
    type: "E-bike",
    lat: 10.74,
    lng: 106.615,
    battery: 80,
    status: "Sẵn sàng",
    location: "Aeon Mall Bình Tân",
  },
  {
    id: "EB-027",
    type: "E-bike",
    lat: 10.802,
    lng: 106.618,
    battery: 95,
    status: "Sẵn sàng",
    location: "Celadon City (Tân Phú)",
  },
  {
    id: "EB-028",
    type: "E-bike",
    lat: 10.741,
    lng: 106.66,
    battery: 45,
    status: "Đang thuê",
    location: "Chợ Phạm Thế Hiển (Q8)",
  },
  {
    id: "EB-029",
    type: "E-bike",
    lat: 10.768,
    lng: 106.638,
    battery: 60,
    status: "Đang thuê",
    location: "Công viên Đầm Sen (Q11)",
  },
  {
    id: "EB-030",
    type: "E-bike",
    lat: 10.745,
    lng: 106.64,
    battery: 70,
    status: "Sẵn sàng",
    location: "Chợ Bình Tiên (Q6)",
  },
  {
    id: "EB-031",
    type: "E-bike",
    lat: 10.825,
    lng: 106.685,
    battery: 85,
    status: "Sẵn sàng",
    location: "Emart Gò Vấp",
  },
  {
    id: "SB-008",
    type: "Shuttle",
    lat: 10.835,
    lng: 106.665,
    battery: 95,
    status: "Đang chạy",
    location: "CVPM Quang Trung -> Gò Vấp",
  },
  {
    id: "EB-032",
    type: "E-bike",
    lat: 10.865,
    lng: 106.65,
    battery: 20,
    status: "Đang thuê",
    location: "Ngã tư An Sương (Q12)",
  },
  {
    id: "EB-033",
    type: "E-bike",
    lat: 10.83,
    lng: 106.76,
    battery: 100,
    status: "Overflow",
    location: "Ga Bình Thái",
  },
  {
    id: "EB-034",
    type: "E-bike",
    lat: 10.8302,
    lng: 106.7602,
    battery: 98,
    status: "Overflow",
    location: "Ga Bình Thái",
  },
  {
    id: "EB-035",
    type: "E-bike",
    lat: 10.8301,
    lng: 106.7605,
    battery: 96,
    status: "Overflow",
    location: "Ga Bình Thái",
  },
  {
    id: "EB-036",
    type: "E-bike",
    lat: 10.774,
    lng: 106.706,
    battery: 5,
    status: "Nguy cấp",
    location: "Bến Bạch Đằng (Q1)",
  },
  {
    id: "EB-037",
    type: "E-bike",
    lat: 10.767,
    lng: 106.691,
    battery: 55,
    status: "Đang thuê",
    location: "Phố Tây Bùi Viện (Q1)",
  },
  {
    id: "EB-038",
    type: "E-bike",
    lat: 10.8,
    lng: 106.695,
    battery: 88,
    status: "Sẵn sàng",
    location: "Chợ Bà Chiểu (Bình Thạnh)",
  },
];

export default function LiveFleetMap() {
  const centerPosition: [number, number] = [10.785, 106.73];

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden relative">
      {/* MAP CONTAINER */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={centerPosition}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mockFleetData.map((vehicle) => {
            let icon = vehicle.type === "Shuttle" ? shuttleIcon : eBikeIcon;
            if (vehicle.battery <= 20) icon = criticalIcon;

            return (
              <Marker
                key={vehicle.id}
                position={[vehicle.lat, vehicle.lng]}
                icon={icon}
              >
                <Popup className="custom-popup rounded-xl overflow-hidden shadow-lg border-0">
                  <div className="min-w-[220px] p-1">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                      <strong className="text-base text-gray-800 font-bold">
                        {vehicle.id}
                      </strong>
                      <Tag
                        color={vehicle.type === "Shuttle" ? "blue" : "cyan"}
                        className="m-0 border-0 font-medium"
                      >
                        {vehicle.type}
                      </Tag>
                    </div>
                    <div className="text-xs text-gray-600 mb-3 space-y-1">
                      <p>
                        <span className="font-semibold text-gray-500">
                          Vị trí:
                        </span>{" "}
                        {vehicle.location}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">
                          Trạng thái:
                        </span>{" "}
                        {vehicle.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <span className="font-semibold text-gray-500">Pin:</span>
                      <Progress
                        percent={vehicle.battery}
                        size="small"
                        status={vehicle.battery <= 20 ? "exception" : "active"}
                        strokeColor={
                          vehicle.battery <= 20 ? "#ef4444" : "#10b981"
                        }
                        className="m-0 flex-1 text-xs"
                      />
                    </div>

                    {vehicle.status === "Nguy cấp" && (
                      <Button
                        danger
                        size="small"
                        type="primary"
                        className="w-full text-xs font-semibold shadow-sm"
                      >
                        Phát lệnh thu hồi sạc (Ưu tiên)
                      </Button>
                    )}
                    {vehicle.status === "Overflow" && (
                      <Button
                        type="primary"
                        size="small"
                        className="w-full text-xs font-semibold bg-teal-600 hover:bg-teal-500 shadow-sm border-0"
                      >
                        Điều xe tải Rebalance
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ========================================== */}
        {/* 3. FLOATING LEGEND (Cập nhật dùng ảnh) */}
        {/* ========================================== */}
        <div className="absolute bottom-8 right-8 z-[1000] bg-white/90 backdrop-blur-md shadow-xl rounded-xl p-4 border border-gray-200 pointer-events-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-100 pb-2">
            Chú giải bản đồ
          </h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center shadow-sm">
                <img
                  src="/images/motorbike.png"
                  alt="ebike"
                  className="w-4 h-4 object-contain"
                />
              </div>
              <span className="font-semibold text-gray-700">
                E-Bike Sẵn sàng
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center shadow-sm">
                <img
                  src="/images/hotel-shuttle.png"
                  alt="ebike"
                  className="w-4 h-4 object-contain"
                />
              </div>
              <span className="font-semibold text-gray-700">
                Shuttle Đang chạy
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 border-2 border-red-500 flex items-center justify-center shadow-sm">
                <img
                  src="/images/motorbike.png"
                  alt="ebike"
                  className="w-4 h-4 object-contain"
                />
              </div>
              <span className="font-semibold text-gray-700">
                Lỗi / Pin &lt; 20%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
