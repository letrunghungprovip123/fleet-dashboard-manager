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
  Progress,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";
// Import hook của bạn (nhớ cấu hình đúng đường dẫn)
import { useAdminVehicles, Vehicle } from "../../hooks/useAdmin";

const { Title } = Typography;

const AdminVehiclePage: React.FC = () => {
  const { vehicles, loading, deleteVehicle, updateVehicle, addVehicle } =
    useAdminVehicles();

  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form] = Form.useForm();

  // 1. Logic Tìm kiếm
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const searchLower = searchText.toLowerCase();
      return (
        vehicle.VehicleID?.toLowerCase().includes(searchLower) ||
        vehicle.Type?.toLowerCase().includes(searchLower)
      );
    });
  }, [vehicles, searchText]);

  // 2. Logic Đóng/Mở Modal
  const openModal = (vehicle: Vehicle | null = null) => {
    setEditingVehicle(vehicle);
    if (vehicle) {
      form.setFieldsValue({
        ...vehicle,
        Last_Maintenance_Date: vehicle.Last_Maintenance_Date
          ? dayjs(vehicle.Last_Maintenance_Date)
          : null,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        VehicleID: crypto.randomUUID(),
        Battery_Level_Pct: 100, // Mặc định xe mới add vào thì pin đầy
      });
    }
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
    form.resetFields();
  };

  const handleRandomizeUUID = () => {
    form.setFieldsValue({ VehicleID: crypto.randomUUID() });
  };

  // 3. Xử lý Thêm / Sửa
  const handleFinish = async (values: any) => {
    try {
      const payload = {
        ...values,
        Last_Maintenance_Date: values.Last_Maintenance_Date
          ? values.Last_Maintenance_Date.format("YYYY-MM-DD")
          : null,
      };

      if (editingVehicle) {
        const { error } = await updateVehicle(
          editingVehicle.VehicleID,
          payload,
        );
        if (error) throw error;
        message.success("Cập nhật phương tiện thành công!");
      } else {
        const { error } = await addVehicle(payload);
        if (error) throw error;
        message.success("Thêm phương tiện mới thành công!");
      }
      handleCancel();
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể lưu dữ liệu"}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteVehicle(id);
      if (error) throw error;
      message.success("Xóa phương tiện thành công!");
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể xóa dữ liệu"}`);
    }
  };

  // 4. Các hàm Xuất File
  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredVehicles, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicles_data.json";
    link.click();
  };

  const exportToCSV = () => {
    const headers = ["VehicleID", "Type", "Battery_Level", "Last_Maintenance"];
    const csvRows = [headers.join(",")];
    filteredVehicles.forEach((v) => {
      const row = [
        v.VehicleID,
        v.Type || "N/A",
        v.Battery_Level_Pct || 0,
        v.Last_Maintenance_Date || "N/A",
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vehicles_data.csv";
    link.click();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Vehicle Management Report", 14, 15);
    const tableColumn = [
      "ID (Short)",
      "Type",
      "Battery (%)",
      "Maintenance Date",
    ];
    const tableRows: any[] = [];
    filteredVehicles.forEach((v) => {
      const shortId = v.VehicleID.substring(0, 8) + "...";
      tableRows.push([
        shortId,
        v.Type,
        v.Battery_Level_Pct,
        v.Last_Maintenance_Date || "N/A",
      ]);
    });
    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("vehicles_data.pdf");
  };

  // 5. Cột cho Table
  const columns = [
    {
      title: "Vehicle ID",
      dataIndex: "VehicleID",
      key: "VehicleID",
      render: (text: string) => (
        <span title={text}>{text.substring(0, 8)}...</span>
      ),
    },
    {
      title: "Loại xe",
      dataIndex: "Type",
      key: "Type",
      render: (type: string) => {
        if (!type) return <span className="text-gray-400">N/A</span>;
        let color = "default";
        if (type.toLowerCase().includes("e-bike")) color = "green";
        else if (type.toLowerCase().includes("shuttle")) color = "blue";
        return (
          <Tag color={color} className="font-medium">
            {type}
          </Tag>
        );
      },
      filters: [
        { text: "E-Bike", value: "E-Bike" },
        { text: "Shuttle", value: "Shuttle" },
      ],
      onFilter: (value: any, record: Vehicle) => record.Type === value,
    },
    {
      title: "Tình trạng Pin",
      dataIndex: "Battery_Level_Pct",
      key: "Battery_Level_Pct",
      sorter: (a: Vehicle, b: Vehicle) =>
        (a.Battery_Level_Pct || 0) - (b.Battery_Level_Pct || 0),
      render: (pct: number) => {
        // Pin dưới 20% thì đỏ, 20-50% vàng, trên 50% xanh
        let strokeColor = "#52c41a"; // Green
        if (pct <= 20)
          strokeColor = "#ff4d4f"; // Red
        else if (pct <= 50) strokeColor = "#faad14"; // Yellow

        return (
          <div className="w-32">
            <Progress percent={pct} size="small" strokeColor={strokeColor} />
          </div>
        );
      },
    },
    {
      title: "Bảo dưỡng gần nhất",
      dataIndex: "Last_Maintenance_Date",
      key: "Last_Maintenance_Date",
      render: (date: string) =>
        date ? dayjs(date).format("DD/MM/YYYY") : "Chưa cập nhật",
      sorter: (a: Vehicle, b: Vehicle) =>
        dayjs(a.Last_Maintenance_Date).valueOf() -
        dayjs(b.Last_Maintenance_Date).valueOf(),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Vehicle) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Xóa phương tiện này?"
            onConfirm={() => handleDelete(record.VehicleID)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card className="shadow-sm rounded-lg animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <Title level={4} className="!m-0">
            Quản lý Phương tiện (Vehicles)
          </Title>

          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Tìm kiếm ID hoặc Loại xe..."
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
              Thêm Phương tiện
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredVehicles}
          rowKey="VehicleID"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          className="border border-gray-100 rounded-md"
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={
          editingVehicle ? "Chỉnh sửa Phương tiện" : "Thêm Phương tiện mới"
        }
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          className="mt-4"
        >
          <Form.Item label="Vehicle ID" required>
            <div className="flex gap-2">
              <Form.Item
                name="VehicleID"
                noStyle
                rules={[{ required: true, message: "ID không được để trống!" }]}
              >
                <Input disabled className="w-full text-gray-500 bg-gray-50" />
              </Form.Item>
              {!editingVehicle && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRandomizeUUID}
                  title="Tạo ID mới"
                />
              )}
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="Type"
                label="Loại phương tiện"
                rules={[{ required: true, message: "Vui lòng chọn loại xe!" }]}
              >
                <Select placeholder="Chọn loại xe">
                  <Select.Option value="E-Bike">E-Bike</Select.Option>
                  <Select.Option value="Shuttle">Shuttle</Select.Option>
                  <Select.Option value="Bus">Bus</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="Battery_Level_Pct"
                label="Dung lượng Pin (%)"
                rules={[{ required: true, message: "Nhập % Pin" }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  className="w-full"
                  placeholder="0 - 100"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="Last_Maintenance_Date"
            label="Ngày bảo dưỡng gần nhất"
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">
              {editingVehicle ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminVehiclePage;
