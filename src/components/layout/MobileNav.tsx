import { useKeyboardOpen } from '../../hooks/useKeyboardOpen';
import { NavLink } from 'react-router-dom';
import { Home, Search, Library, Settings, Users } from 'lucide-react';
import { useAudioStore } from '../../store/useAudioStore';
import { motion } from 'framer-motion';

export function MobileNav() {
  const isKeyboardOpen = useKeyboardOpen();
  const setSettingsOpen = useAudioStore((state) => state.setSettingsOpen);
  
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/albums', icon: Users, label: 'Artist' },
    { to: '/library', icon: Search, label: 'Search' },
    { to: '/local', icon: Library, label: 'Library' },
  ];

  return (
    <div className={`md:hidden fixed bottom-5 left-2 right-2 z-40 pb-safe transition-all duration-300 ${isKeyboardOpen ? 'translate-y-32 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
      <nav className="w-full h-[68px] floating-glass-nav rounded-[2rem] flex justify-around items-center px-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className="relative flex-1 h-full flex items-center justify-center"
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[68px] h-[52px] active-glass-pill rounded-[1.2rem] pointer-events-none"
                />
              )}
              <div className={`relative z-10 flex flex-col items-center justify-center space-y-1 transition-colors drop-shadow-sm ${isActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-300'}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </div>
            </>
          )}
        </NavLink>
      ))}
      <button
        onClick={() => setSettingsOpen(true)}
        className="relative flex-1 h-full flex items-center justify-center"
      >
        <div className="relative z-10 flex flex-col items-center justify-center space-y-1 transition-colors text-zinc-400 hover:text-zinc-300 drop-shadow-sm">
          <Settings size={22} strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Settings</span>
        </div>
      </button>
    </nav>
    </div>
  );
}
