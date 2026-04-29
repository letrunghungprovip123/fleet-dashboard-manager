import React from "react";
import GridShape from "../../components/common/GridShape";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";
import { MdElectricBolt } from "react-icons/md"; // Đừng quên import cái này nhé!

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {/* BÊN TRÁI: FORM ĐĂNG NHẬP */}
        <div className="flex flex-col flex-1 justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          {/* Nếu muốn hiện logo nhỏ ở mobile thì thêm ở đây, không thì thôi */}
          <div className="w-full max-w-sm mx-auto lg:w-96">{children}</div>
        </div>

        {/* BÊN PHẢI: BANNER LOGO (Chỉ hiện trên Desktop) */}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-slate-950 dark:bg-[#0B1120] lg:grid relative overflow-hidden">
          <div className="relative flex items-center justify-center z-10">
            <GridShape />

            <div className="flex flex-col items-center max-w-md px-8 text-center">
              <Link to="/" className="flex flex-col items-center gap-6 mb-6">
                {/* ĐÂY LÀ CÁI ICON "HỒI NÃY" CỦA BẠN NÈ */}
                <div
                  className="
                    flex items-center justify-center 
                    w-20 h-20 
                    bg-gradient-to-br from-blue-500 to-indigo-600 
                    rounded-[24px] 
                    shadow-[0_8px_32px_rgba(59,130,246,0.4)]
                    ring-4 ring-white/10
                  "
                >
                  <MdElectricBolt className="text-white text-[44px]" />
                </div>

                {/* Chữ SaigonFlow Gradient */}
                <div className="bg-gradient-to-br from-white via-blue-100 to-indigo-300 bg-clip-text text-transparent text-[52px] font-extrabold tracking-tight">
                  SaigonFlow
                </div>
              </Link>

              <p className="text-blue-100/60 dark:text-slate-400 text-lg font-medium leading-relaxed max-w-[320px]">
                Hệ thống quản lý vận hành xe điện thông minh hàng đầu TP.HCM.
              </p>
            </div>
          </div>
        </div>

        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}
