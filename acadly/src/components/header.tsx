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
  { href: "/create-space", label: "New Space", icon: PlusCircle },
];

const placeholders = ["spaces...", "tasks...", "files...", "notes..."];

function SearchBar() {
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % placeholders.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex items-center gap-2 text-ink/50 dark:text-white/50 flex-1 w-full px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus-within:ring-2 focus-within:ring-acadly-violet/50 transition-all overflow-hidden h-10">
      <Search size={16} />
      
      {!value && (
        <div className="absolute left-[38px] right-4 pointer-events-none flex items-center h-full text-sm text-ink/40 dark:text-white/40">
          <span className="whitespace-nowrap">Search&nbsp;</span>
          <div className="relative flex-1 h-full">
            <AnimatePresence>
              <motion.span
                key={index}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 flex items-center whitespace-nowrap"
              >
                {placeholders[index]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      )}

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="bg-transparent outline-none text-sm w-full text-ink dark:text-white relative z-10"
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

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 750,
          easing: "cubic-bezier(0.64, 0, 0.15, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
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
          <div className="flex items-center gap-2 px-1 md:px-3 py-1.5 mr-1 md:mr-2 text-sm font-medium">
             <span className="h-7 w-7 rounded-full bg-acadly-violet text-white text-xs flex items-center justify-center font-bold shadow-sm">
              {name[0]?.toUpperCase()}
            </span>
            <span className="hidden md:inline">{name}</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 md:gap-3">
          <motion.button 
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <Bell size={20} />
          </motion.button>
          
          <motion.button 
            onClick={toggleTheme}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          {name && (
            <motion.button 
              onClick={() => signOut({ callbackUrl: window.location.origin })}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-ink/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <LogOut size={20} />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
