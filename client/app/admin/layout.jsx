"use client";

import React, { useState } from "react";
import HeaderDashboard from "../components/header/HeaderDashboard";
import Sidebar from "../components/Sidebar";

export default function RootLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // for mobile
  const [isCollapsed, setIsCollapsed] = useState(false); // for desktop

  return (
    <div className="flex h-screen">
      
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* Main content area */}
      <div
        className={`
          relative flex flex-1 flex-col transition-all duration-300 overflow-auto
          ${isCollapsed ? "lg:ml-20" : "lg:ml-80"}
        `}
      >
        <HeaderDashboard
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
        />

        <main className="p-4 md:p-6 2xl:p-10 transition-all duration-300 ">
          {children}
        </main>
      </div>
    </div>
  );
}
