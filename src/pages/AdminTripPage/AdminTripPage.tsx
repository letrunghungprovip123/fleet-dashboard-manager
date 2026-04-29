import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Popconfirm,
  Tag,
  Card,
  Typography,
  message,
  Row,
  Col,
  Descriptions,
  Statistic,
  Divider,
  DatePicker,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs"; // Ant Design dùng dayjs cho DatePicker
// Import hook của bạn
import { useAdminTrips, Trip } from "./../../hooks/useAdmin";

const { Title, Text } = Typography;

// --- COMPONENT CHI TIẾT CHUYẾN ĐI (VIEW MODE) ---
const TripDetailView = ({
  trip,
  onBack,
}: {
  trip: Trip;
  onBack: () => void;
}) => {
  return (
    <div className="animate-fade-in">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={onBack}
        className="mb-4 hover:bg-gray-100"
      >
        Quay lại danh sách
      </Button>

      <Row gutter={[16, 16]}>
        {/* Card Tổng quan */}
        <Col span={24}>
          <Card className="shadow-sm border-t-4 border-t-blue-500">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <Title level={4} className="!m-0">
                  Chi tiết chuyến đi:{" "}
                  <Text type="secondary">{trip.TripID}</Text>
                </Title>
                <div className="mt-3 !space-x-2 gap-3">
                  <Tag color="blue">{trip.Mode || "N/A"}</Tag>
                  <Tag color={trip.Is_Weekend === 1 ? "orange" : "cyan"}>
                    {trip.DayOfWeek || "N/A"}
                  </Tag>
                  <Tag color="purple">{trip.Weather_Condition || "N/A"}</Tag>
                </div>
              </div>
              <div className="flex gap-8">
                <Statistic
                  title="Thời lượng"
                  value={trip.Duration_Mins || 0}
                  suffix="phút"
                  prefix={<ClockCircleOutlined className="text-gray-400" />}
                />
                <Statistic
                  title="Doanh thu"
                  value={trip.Fare_VND || 0}
                  suffix="VNĐ"
                  prefix={<DollarOutlined className="text-green-500" />}
                  valueStyle={{ color: "#3f8600" }}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* Card Lộ trình & Thông tin chi tiết */}
        <Col xs={24} lg={12}>
          <Card title="Lộ trình di chuyển" className="h-full shadow-sm">
            <div className="flex flex-col gap-4 relative">
              {/* Vẽ timeline đơn giản */}
              <div className="flex items-start gap-3">
                <EnvironmentOutlined className="text-blue-500 text-xl mt-1" />
                <div>
                  <Text type="secondary">Điểm xuất phát</Text>
                  <div className="font-semibold text-lg">
                    {trip.Start_Station || "Chưa xác định"}
                  </div>
                </div>
              </div>
              <div className="ml-[9px] border-l-2 border-dashed border-gray-300 h-8"></div>
              <div className="flex items-start gap-3">
                <EnvironmentOutlined className="text-red-500 text-xl mt-1" />
                <div>
                  <Text type="secondary">Điểm đến</Text>
                  <div className="font-semibold text-lg">
                    {trip.End_Station || "Chưa xác định"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Dữ liệu liên quan" className="h-full shadow-sm">
            <Descriptions
              column={1}
              labelStyle={{ width: "140px", fontWeight: 500 }}
            >
              <Descriptions.Item label="Người dùng (ID)">
                <Text copyable>{trip.UserID}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Phương tiện (ID)">
                <Text copyable>{trip.VehicleID || "Không áp dụng"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian bắt đầu">
                {trip.Timestamp
                  ? dayjs(trip.Timestamp).format("DD/MM/YYYY HH:mm:ss")
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Nhiệt độ">
                {trip.Temp_Celsius ? `${trip.Temp_Celsius}°C` : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// --- COMPONENT MAIN PAGE ---
const AdminTripPage: React.FC = () => {
  const { trips, loading, deleteTrip, updateTrip, addTrip } = useAdminTrips();

  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [viewingTrip, setViewingTrip] = useState<Trip | null>(null); // State quản lý View
  const [form] = Form.useForm();

  // 1. Tìm kiếm
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      const searchLower = searchText.toLowerCase();
      return (
        trip.TripID?.toLowerCase().includes(searchLower) ||
        trip.Start_Station?.toLowerCase().includes(searchLower) ||
        trip.End_Station?.toLowerCase().includes(searchLower)
      );
    });
  }, [trips, searchText]);

  // 2. Xử lý Modal Thêm/Sửa
  const openModal = (trip: Trip | null = null) => {
    setEditingTrip(trip);
    if (trip) {
      form.setFieldsValue({
        ...trip,
        Timestamp: trip.Timestamp ? dayjs(trip.Timestamp) : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ TripID: crypto.randomUUID() });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingTrip(null);
    form.resetFields();
  };

  const handleRandomizeUUID = () => {
    form.setFieldsValue({ TripID: crypto.randomUUID() });
  };

  const handleFinish = async (values: any) => {
    try {
      // Format lại Date cho Supabase
      const payload = {
        ...values,
        Timestamp: values.Timestamp ? values.Timestamp.toISOString() : null,
      };

      if (editingTrip) {
        const { error } = await updateTrip(editingTrip.TripID, payload);
        if (error) throw error;
        message.success("Cập nhật chuyến đi thành công!");
      } else {
        const { error } = await addTrip(payload);
        if (error) throw error;
        message.success("Thêm chuyến đi mới thành công!");
      }
      handleCancel();
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể lưu dữ liệu"}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteTrip(id);
      if (error) throw error;
      message.success("Xóa chuyến đi thành công!");
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể xóa dữ liệu"}`);
    }
  };

  // 3. Xuất File
  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredTrips, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trips_data.json";
    link.click();
  };

  const exportToCSV = () => {
    const headers = [
      "TripID",
      "Mode",
      "Start_Station",
      "End_Station",
      "Fare_VND",
      "Timestamp",
    ];
    const csvRows = [headers.join(",")];
    filteredTrips.forEach((t) => {
      const row = [
        t.TripID,
        t.Mode || "N/A",
        t.Start_Station || "",
        t.End_Station || "",
        t.Fare_VND || 0,
        t.Timestamp || "",
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "trips_data.csv";
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Trips Management Report", 14, 15);
    const tableColumn = ["ID", "Mode", "Route", "Date", "Fare"];
    const tableRows: any[] = [];
    filteredTrips.forEach((t) => {
      const shortId = t.TripID.substring(0, 6) + "...";
      const route = `${t.Start_Station} - ${t.End_Station}`.substring(0, 20);
      const date = t.Timestamp ? dayjs(t.Timestamp).format("DD/MM/YY") : "N/A";
      tableRows.push([shortId, t.Mode, route, date, t.Fare_VND]);
    });
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("trips_data.pdf");
  };

  // 4. Các cột CHÍNH hiển thị trên Table
  const columns = [
    {
      title: "Trip ID",
      dataIndex: "TripID",
      key: "TripID",
      render: (text: string) => (
        <span title={text}>{text.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Phương tiện",
      dataIndex: "Mode",
      key: "Mode",
      render: (mode: string) => {
        if (!mode) return "N/A";
        let color = "default";
        if (mode.toLowerCase().includes("e-bike")) color = "green";
        else if (mode.toLowerCase().includes("shuttle")) color = "blue";
        else if (
          mode.toLowerCase().includes("metro") ||
          mode.toLowerCase().includes("bus")
        )
          color = "purple";
        return <Tag color={color}>{mode}</Tag>;
      },
      filters: [
        { text: "E-Bike", value: "E-Bike" },
        { text: "Bus", value: "Bus" },
        { text: "Metro", value: "Metro" },
      ],
      onFilter: (value: any, record: Trip) => record.Mode === value,
    },
    {
      title: "Tuyến đường",
      key: "Route",
      render: (_: any, record: Trip) => (
        <div className="text-sm">
          <div className="text-gray-900">{record.Start_Station || "N/A"}</div>
          <div className="text-gray-400 text-xs">
            đến {record.End_Station || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "Timestamp",
      key: "Timestamp",
      render: (time: string) =>
        time ? dayjs(time).format("DD/MM/YYYY HH:mm") : "N/A",
      sorter: (a: Trip, b: Trip) =>
        dayjs(a.Timestamp).valueOf() - dayjs(b.Timestamp).valueOf(),
    },
    {
      title: "Giá vé",
      dataIndex: "Fare_VND",
      key: "Fare_VND",
      render: (fare: number) => (
        <span className="font-medium text-green-600">
          {new Intl.NumberFormat("vi-VN").format(fare || 0)} đ
        </span>
      ),
      sorter: (a: Trip, b: Trip) => (a.Fare_VND || 0) - (b.Fare_VND || 0),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Trip) => (
        <Space size="small">
          {/* Nút View chiếm màn hình */}
          <Button
            type="text"
            icon={<EyeOutlined className="text-gray-600" />}
            onClick={() => setViewingTrip(record)}
            title="Xem chi tiết"
          />
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => openModal(record)}
            title="Chỉnh sửa"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa chuyến đi này?"
            onConfirm={() => handleDelete(record.TripID)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* CONDITIONAL RENDERING: NẾU ĐANG VIEW THÌ HIỆN COMPONENT VIEW, NGƯỢC LẠI HIỆN BẢNG */}
      {viewingTrip ? (
        <TripDetailView
          trip={viewingTrip}
          onBack={() => setViewingTrip(null)}
        />
      ) : (
        <Card className="shadow-sm rounded-lg animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <Title level={4} className="!m-0">
              Quản lý Chuyến đi
            </Title>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                placeholder="Tìm ID hoặc Trạm..."
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-64"
                allowClear
              />
              <Button icon={<FileExcelOutlined />} onClick={exportToCSV}>
                CSV
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportToJSON}>
                JSON
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                className="bg-blue-600"
              >
                Thêm Trip
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            dataSource={filteredTrips}
            rowKey="TripID"
            loading={loading}
            pagination={{ pageSize: 8, showSizeChanger: true }}
            className="border border-gray-100 rounded-md"
          />
        </Card>
      )}

      {/* Modal Thêm/Sửa (Cho phép Scroll vì nhiều trường) */}
      <Modal
        title={editingTrip ? "Chỉnh sửa Chuyến đi" : "Thêm Chuyến đi mới"}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        width={700}
        style={{ top: 20 }} // Đẩy modal lên cao một chút
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="mt-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Trip ID" required>
                <div className="flex gap-2">
                  <Form.Item name="TripID" noStyle>
                    <Input
                      disabled
                      className="w-full text-gray-500 bg-gray-50"
                    />
                  </Form.Item>
                  {!editingTrip && (
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={handleRandomizeUUID}
                      title="Tạo ID mới"
                    />
                  )}
                </div>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="UserID"
                label="User ID (UUID)"
                rules={[{ required: true }]}
              >
                <Input placeholder="Nhập UserID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="VehicleID" label="Vehicle ID (Tùy chọn)">
                <Input placeholder="Nhập VehicleID (Nếu có)" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="Mode"
                label="Phương tiện"
                rules={[{ required: true }]}
              >
                <Select placeholder="Chọn phương tiện">
                  <Select.Option value="Bus">Bus</Select.Option>
                  <Select.Option value="Metro">Metro</Select.Option>
                  <Select.Option value="E-Bike">E-Bike</Select.Option>
                  <Select.Option value="Shuttle">Shuttle</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Timestamp" label="Thời gian">
                <DatePicker
                  showTime
                  className="w-full"
                  format="DD/MM/YYYY HH:mm:ss"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="Start_Station" label="Trạm xuất phát">
                <Input placeholder="Nhập trạm xuất phát" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="End_Station" label="Trạm đến">
                <Input placeholder="Nhập trạm đến" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item name="Duration_Mins" label="Thời lượng (Phút)">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Fare_VND" label="Giá vé (VND)">
                <InputNumber min={0} step={1000} className="w-full" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Temp_Celsius" label="Nhiệt độ (°C)">
                <InputNumber className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="DayOfWeek" label="Ngày trong tuần">
                <Select placeholder="Thứ">
                  {[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ].map((day) => (
                    <Select.Option key={day} value={day}>
                      {day}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="Weather_Condition" label="Thời tiết">
                <Select placeholder="Thời tiết">
                  <Select.Option value="Clear">Trời trong</Select.Option>
                  <Select.Option value="Rain">Mưa</Select.Option>
                  <Select.Option value="Cloudy">Có mây</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">
              {editingTrip ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTripPage;
