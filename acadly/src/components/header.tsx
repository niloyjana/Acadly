"use client";

import { signOut, useSession } from "next-auth/react";
import { Search, Bell, LogOut, Moon, Sun, Menu, X, LayoutGrid, Users, PlusCircle, Calendar } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { flushSync } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/calendar", label: "My Calendar", icon: Calendar },
  { href: "/spaces", label: "My Spaces", icon: Users },
  { href: "/create-space", label: "Create", icon: PlusCircle },
];

function SearchBar() {
  const [value, setValue] = useState("");

  return (
    <div className="relative flex items-center gap-3 text-ink/50 dark:text-white/50 flex-1 w-full px-5 py-2.5 rounded-[1.25rem] border border-black/5 dark:border-white/5 bg-black/5 dark:bg-white/5 focus-within:ring-2 focus-within:ring-acadly-violet/50 transition-all h-11">
      <Search size={18} />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="search"
        className="bg-transparent outline-none text-base w-full text-ink dark:text-white placeholder:text-ink/40 dark:placeholder:text-white/40"
      />
    </div>
  );
}

export function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name ? session.user.name.split(" ")[0] : "";
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const handle = (e: Event) => setIsSidebarCollapsed((e as CustomEvent).detail);
    window.addEventListener("sidebarState", handle);
    return () => window.removeEventListener("sidebarState", handle);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = (e: React.MouseEvent) => {
    const isCurrentlyDark = isDark;
    const newTheme = isCurrentlyDark ? "light" : "dark";

    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Use button center as the origin point
    const btn = e.currentTarget as HTMLElement;
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Start circle from the button's own radius so it feels like it bursts outward
    const startRadius = Math.hypot(rect.width, rect.height) / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    document.documentElement.style.setProperty('--theme-x', `${x}px`);
    document.documentElement.style.setProperty('--theme-y', `${y}px`);
    document.documentElement.style.setProperty('--theme-r0', `${startRadius}px`);
    document.documentElement.style.setProperty('--theme-r', `${endRadius}px`);

    // Tag the direction so CSS can pick the right layer to animate
    const direction = newTheme === 'dark' ? 'theme-to-dark' : 'theme-to-light';
    document.documentElement.classList.add(direction);

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.finished.finally(() => {
      document.documentElement.classList.remove(direction);
    });
  };

  return (
    <header className="sticky top-0 z-40 flex flex-wrap md:flex-nowrap items-center justify-between gap-y-3 px-5 md:px-9 py-3 md:py-0 md:h-[80px] bg-transparent">
      {/* Grid fade masks for light and dark modes */}
      <div 
        className="absolute inset-x-0 top-0 h-[140px] md:h-[100px] z-[-1] pointer-events-none dark:hidden" 
        style={{
          backgroundColor: '#F3F1FA',
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundAttachment: 'fixed',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }} 
      />
      <div 
        className="absolute inset-x-0 top-0 h-[140px] md:h-[100px] z-[-1] pointer-events-none hidden dark:block" 
        style={{
          backgroundColor: '#0E0B1A',
          backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundAttachment: 'fixed',
          maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
        }} 
      />

      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex-none flex items-center justify-center p-1 text-ink/70 dark:text-white/70 hover:text-ink dark:hover:text-white"
        >
          <Menu size={28} />
        </button>
        <span className="font-display text-2xl font-semibold tracking-tight">
          Acadly
        </span>
      </div>

      <motion.div
        initial={false}
        animate={{ x: isSidebarCollapsed ? 192 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="w-full md:w-auto md:flex-1 md:max-w-sm order-last md:order-none"
      >
        <SearchBar />
      </motion.div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white dark:bg-[#0E0B1A] p-6 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <span className="font-display text-2xl font-semibold tracking-tight">Acadly</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 bg-black/5 dark:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-lg font-medium transition-colors ${
                    pathname === item.href || pathname?.startsWith(item.href + "/")
                      ? "bg-acadly-violet/10 text-acadly-violet"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon size={24} />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center h-full">
        {name && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 mr-2 text-sm font-medium">
             <span className="h-7 w-7 rounded-full bg-acadly-violet text-white text-xs flex items-center justify-center font-bold shadow-sm">
              {name[0]?.toUpperCase()}
            </span>
            <span>{name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="text-ink/80 dark:text-white/80 hover:text-ink dark:hover:text-white transition-colors"
          >
            <Bell size={22} />
          </motion.button>
          
          <motion.button 
            onClick={toggleTheme}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="text-ink/80 dark:text-white/80 hover:text-ink dark:hover:text-white transition-colors"
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </motion.button>
          
          {name && (
            <motion.button 
              onClick={() => signOut({ callbackUrl: window.location.origin })}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="text-ink/80 dark:text-white/80 hover:text-ink dark:hover:text-white transition-colors"
            >
              <LogOut size={22} />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
