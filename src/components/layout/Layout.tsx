import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { BottomPlayer } from './BottomPlayer';
import { MobileNav } from './MobileNav';
import { MobilePlayer } from './MobilePlayer';
import { SettingsModal } from '../ui/SettingsModal';
import { useAudioStore } from '../../store/useAudioStore';

export function Layout() {
  const currentTrack = useAudioStore(state => state.queue[state.currentIndex]);
  
  // on mobile: if track exists, player is shown, need 180px. if not, just 100px (for nav).
  const paddingClass = currentTrack ? 'pb-[180px] md:pb-[100px]' : 'pb-[100px] md:pb-[100px]';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-surface-0)] text-zinc-100 font-sans relative">
      {/* Global Ambient Background Orbs */}
      <div className="absolute top-[-10%] left-[15%] w-[700px] h-[500px] bg-white/[0.02] rounded-full blur-[160px] pointer-events-none z-0" />
      <div className="absolute bottom-[-5%] right-[10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute top-[40%] left-[50%] w-[400px] h-[300px] bg-white/[0.01] rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col bg-transparent transform-gpu will-change-scroll">
          {/* Top fade mask */}
          <div className="sticky top-0 z-20 h-8 bg-gradient-to-b from-[var(--color-surface-0)] to-transparent pointer-events-none shrink-0" />
          
          <div className={`flex-1 -mt-8 relative z-10 ${paddingClass}`}>
            <Outlet />
          </div>
        </main>
        
        <RightSidebar />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-50">
        <BottomPlayer />
      </div>
      <MobilePlayer />
      <MobileNav />
      <SettingsModal />
    </div>
  );
}
