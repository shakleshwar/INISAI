import { NavLink } from 'react-router-dom';
import { Home, Search, HardDrive, Settings } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';

export function MobileNav() {
  const setSettingsOpen = useAudioStore((state) => state.setSettingsOpen);
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/library', icon: Search, label: 'Search' },
    { to: '/local', icon: HardDrive, label: 'Local' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full bg-zinc-950/95 backdrop-blur-md border-t border-white/[0.04] flex justify-around items-center h-16 pb-safe z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              isActive ? 'text-white' : 'text-zinc-600'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={() => setSettingsOpen(true)}
        className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-zinc-600 hover:text-white"
      >
        <div className="relative">
          <Settings size={22} strokeWidth={1.5} />
        </div>
        <span className="text-[10px] font-medium">Settings</span>
      </button>
    </nav>
  );
}
