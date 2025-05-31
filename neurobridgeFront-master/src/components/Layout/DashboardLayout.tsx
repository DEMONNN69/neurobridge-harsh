import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../hooks/useAuth';
import AccessibilityPanel from '../Accessibility/AccessibilityPanel';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessibilityPanelOpen, setAccessibilityPanelOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        userRole={user?.role} 
      />

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          onAccessibilityClick={() => setAccessibilityPanelOpen(true)}
        />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Accessibility panel */}
      <AccessibilityPanel 
        isOpen={accessibilityPanelOpen} 
        onClose={() => setAccessibilityPanelOpen(false)} 
      />
    </div>
  );
};

export default DashboardLayout;