  import { useState } from 'react';
  import { Outlet } from 'react-router-dom';
  import Sidebar from '../components/Sidebar';
  import Navbar  from '../components/Navbar';

  const DashboardLayout = () => {
    const [collapsed, setCollapsed]   = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          closeMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  };

  export default DashboardLayout;