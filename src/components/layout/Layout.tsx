import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { BottomPlayer } from './BottomPlayer';
import { MobileNav } from './MobileNav';
import { MobilePlayer } from './MobilePlayer';
import { SettingsModal } from '../ui/SettingsModal';

export function Layout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-zinc-100 font-sans relative">
      {/* Global Ambient Background Orbs */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        
        <main className="flex-1 relative overflow-y-auto custom-scrollbar flex flex-col bg-transparent">
          <div className="flex-1 pb-28 md:pb-0">
            <Outlet />
          </div>
        </main>
        
        <RightSidebar />
      </div>

      <BottomPlayer />
      <MobilePlayer />
      <MobileNav />
      <SettingsModal />
    </div>
  );
}
