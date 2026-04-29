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
// Import hook của bạn (nhớ sửa lại đường dẫn cho đúng)
import { useAdminUsers, User } from "./../../hooks/useAdmin";

const { Title } = Typography;

const AdminUserPage: React.FC = () => {
  // Lấy dữ liệu và các hàm từ hook
  const { users, loading, deleteUser, updateUser, addUser } = useAdminUsers();

  // States cho UI
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // 1. Xử lý logic Tìm kiếm
  const filteredUsers = useMemo(() => {
    return users.filter((user: any) => {
      const searchLower = searchText.toLowerCase();
      return (
        user.UserID?.toLowerCase().includes(searchLower) ||
        user.Preferred_Mode?.toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchText]);

  // 2. Xử lý Mở/Đóng Modal
  const openModal = (user: User | null = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
      // Tự động generate UUID khi bấm Thêm Mới
      form.setFieldsValue({ UserID: crypto.randomUUID() });
    }
    setIsModalOpen(true);
  };
  const handleRandomizeUUID = () => {
    form.setFieldsValue({ UserID: crypto.randomUUID() });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 3. Xử lý Thêm / Sửa dữ liệu
  // Cập nhật handleFinish (không cần tự tạo UUID trong này nữa)
  const handleFinish = async (values: any) => {
    try {
      if (editingUser) {
        // Cập nhật
        const { error } = await updateUser(editingUser.UserID, values);
        if (error) throw error;
        message.success("Cập nhật người dùng thành công!");
      } else {
        // Thêm mới (values giờ đã bao gồm UserID từ form)
        const { error } = await addUser(values);
        if (error) throw error;
        message.success("Thêm người dùng mới thành công!");
      }
      handleCancel();
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể lưu dữ liệu"}`);
    }
  };

  // 4. Xử lý Xóa dữ liệu
  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteUser(id);
      if (error) throw error;
      message.success("Xóa người dùng thành công!");
    } catch (err: any) {
      message.error(`Lỗi: ${err.message || "Không thể xóa dữ liệu"}`);
    }
  };

  // 5. CÁC HÀM XUẤT DỮ LIỆU (CSV, JSON, PDF)
  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredUsers, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users_data.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      "UserID",
      "Age",
      "Preferred_Mode",
      "Loyalty_Points",
      "Status",
    ];
    const csvRows = [headers.join(",")];

    filteredUsers.forEach((u) => {
      const status = u.Has_Churned === 1 ? "Churned" : "Active";
      const row = [
        u.UserID,
        u.Age || 0,
        u.Preferred_Mode || "N/A",
        u.Loyalty_Points || 0,
        status,
      ];
      csvRows.push(row.join(","));
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users_data.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("User Management Report", 14, 15);

    const tableColumn = ["ID (Short)", "Age", "Mode", "Points", "Status"];
    const tableRows: any[] = [];

    filteredUsers.forEach((u) => {
      const status = u.Has_Churned === 1 ? "Churned" : "Active";
      const shortId = u.UserID.substring(0, 8) + "..."; // Rút gọn ID cho vừa PDF
      tableRows.push([
        shortId,
        u.Age,
        u.Preferred_Mode,
        u.Loyalty_Points,
        status,
      ]);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("users_data.pdf");
  };

  // 6. Cấu hình Cột cho Table Antd
  const columns = [
    {
      title: "User ID",
      dataIndex: "UserID",
      key: "UserID",
      render: (text: string) => (
        <span title={text}>{text.substring(0, 8)}...</span> // Rút gọn UUID cho đẹp
      ),
    },
    {
      title: "Tuổi",
      dataIndex: "Age",
      key: "Age",
      sorter: (a: User, b: User) => (a.Age || 0) - (b.Age || 0),
    },
    {
      title: "Phương tiện ưu thích",
      dataIndex: "Preferred_Mode",
      key: "Preferred_Mode",
      render: (mode: string) => {
        if (!mode) return <span className="text-gray-400">N/A</span>;

        let color = "default";
        const modeLower = mode.toLowerCase();

        if (modeLower.includes("e-bike")) {
          color = "green"; // Xanh lá cây
        } else if (modeLower.includes("shuttle")) {
          color = "blue"; // Xanh biển
        } else if (modeLower.includes("metro") || modeLower.includes("bus")) {
          color = "purple"; // Tím (hoặc bạn có thể dùng 'geekblue' nếu thích sắc xanh tím)
        }

        return (
          <Tag color={color} className="font-medium">
            {mode}
          </Tag>
        );
      },
      // Thêm bộ lọc (filter) để dễ dàng tìm kiếm theo phương tiện
      filters: [
        { text: "E-Bike", value: "E-Bike" },
        { text: "Bus", value: "Bus" },
        { text: "Metro", value: "Metro" },
        { text: "Shuttle", value: "Shuttle" },
      ],
      onFilter: (value: any, record: User) => record.Preferred_Mode === value,
    },
    {
      title: "Điểm thưởng",
      dataIndex: "Loyalty_Points",
      key: "Loyalty_Points",
      sorter: (a: User, b: User) =>
        (a.Loyalty_Points || 0) - (b.Loyalty_Points || 0),
    },
    {
      title: "Trạng thái",
      dataIndex: "Has_Churned",
      key: "Has_Churned",
      render: (churned: number) => (
        <Tag color={churned === 1 ? "red" : "green"}>
          {churned === 1 ? "Đã rời bỏ" : "Đang hoạt động"}
        </Tag>
      ),
      filters: [
        { text: "Đang hoạt động", value: 0 },
        { text: "Đã rời bỏ", value: 1 },
      ],
      onFilter: (value: any, record: User) => record.Has_Churned === value,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className="text-blue-500" />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa người dùng này?"
            onConfirm={() => handleDelete(record.UserID)}
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
      <Card className="shadow-sm rounded-lg">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex flex-col gap-3 flex-1">
            <Title level={4} className="!m-0">
              Quản lý Người dùng
            </Title>
            <Input
              placeholder="Tìm kiếm ID hoặc phương tiện..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-30"
              allowClear
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Thanh tìm kiếm */}

            <div className="flex flex-col gap-3">
              <div className="space-x-2">
                <Button icon={<FileExcelOutlined />} onClick={exportToCSV}>
                  CSV
                </Button>
                <Button icon={<DownloadOutlined />} onClick={exportToJSON}>
                  JSON
                </Button>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                className="bg-blue-600"
              >
                Thêm User
              </Button>
            </div>
            {/* Các nút Xuất file */}

            {/* Nút Thêm Mới */}
          </div>
        </div>

        {/* Bảng dữ liệu */}
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="UserID"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng số ${total} bản ghi`,
          }}
          className="border border-gray-100 rounded-md"
        />
      </Card>

      {/* Modal Thêm/Sửa */}
      <Modal
        title={editingUser ? "Chỉnh sửa Người dùng" : "Thêm Người dùng mới"}
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
          <Form.Item label="User ID" required>
            <div className="flex gap-2">
              <Form.Item
                name="UserID"
                noStyle
                rules={[{ required: true, message: "ID không được để trống!" }]}
              >
                <Input
                  disabled
                  className="w-full text-gray-500 bg-gray-50 cursor-not-allowed"
                  placeholder="Hệ thống tự động tạo ID"
                />
              </Form.Item>

              {/* Nút random chỉ hiện khi ĐANG THÊM MỚI (!editingUser) */}
              {!editingUser && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRandomizeUUID}
                  title="Tạo ID ngẫu nhiên mới"
                />
              )}
            </div>
          </Form.Item>
          <Form.Item
            name="Age"
            label="Tuổi"
            rules={[{ required: true, message: "Vui lòng nhập tuổi!" }]}
          >
            <InputNumber
              min={1}
              max={120}
              className="w-full"
              placeholder="Nhập tuổi"
            />
          </Form.Item>

          <Form.Item
            name="Preferred_Mode"
            label="Phương tiện ưu thích"
            rules={[{ required: true, message: "Vui lòng chọn phương tiện!" }]}
          >
            <Select placeholder="Chọn phương tiện">
              <Select.Option value="Bus">Bus</Select.Option>
              <Select.Option value="Metro">Metro</Select.Option>
              <Select.Option value="E-Bike">E-Bike</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="Loyalty_Points" label="Điểm thưởng">
            <InputNumber
              min={0}
              className="w-full"
              placeholder="Nhập điểm thưởng"
            />
          </Form.Item>

          <Form.Item
            name="Has_Churned"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Select.Option value={0}>Đang hoạt động</Select.Option>
              <Select.Option value={1}>Đã rời bỏ</Select.Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={handleCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit" className="bg-blue-600">
              {editingUser ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserPage;
