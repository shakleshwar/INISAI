import { Suspense } from 'react';
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
  
  // Responsive bottom clearance: accounts for floating MobilePlayer (156px) + MobileNav (88px) or desktop BottomPlayer (96px)
  const paddingClass = currentTrack ? 'pb-[168px] md:pb-[96px]' : 'pb-[96px] md:pb-[96px]';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-surface-0)] text-zinc-100 font-sans relative">
      {/* Clean minimal background */}


      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar />
        
        <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col bg-transparent transform-gpu will-change-scroll">
          {/* Top fade mask */}
          <div className="sticky top-0 z-20 h-8 bg-gradient-to-b from-[var(--color-surface-0)] to-transparent pointer-events-none shrink-0" />
          
          <div className={`flex-1 -mt-8 relative z-10 ${paddingClass}`}>
            <Suspense fallback={
              <div className="w-full min-h-[300px] flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            }>
              <Outlet />
            </Suspense>
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
