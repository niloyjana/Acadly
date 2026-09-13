"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Users, PlusCircle, Calendar, Menu, X } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/calendar", label: "My Calendar", icon: Calendar },
  { href: "/spaces", label: "My Spaces", icon: Users },
  { href: "/create-space", label: "Create", icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("sidebarState", { detail: isCollapsed }));
  }, [isCollapsed]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex shrink-0 flex-col gap-1 pt-6 px-3 overflow-visible sticky top-0 h-screen border-none bg-transparent z-50"
    >
      <div className="flex flex-col gap-1 h-full">
        <div className="flex items-center mb-6 justify-start h-8 px-2 overflow-visible">
          <span className="font-display text-xl font-semibold whitespace-nowrap tracking-tight text-ink dark:text-white">
            Acadly
          </span>
        </div>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-1 overflow-hidden"
            >
              {NAV.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname?.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={clsx(
                      "group focus-ring flex items-center justify-start gap-3 rounded-xl p-2.5 px-3 text-sm transition-colors whitespace-nowrap",
                      active
                        ? "bg-acadly-violet/10 text-acadly-violet dark:text-acadly-violet font-medium"
                        : "text-ink/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex justify-start px-2">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, bounce: 0.5 }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-ink/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full flex items-center justify-center"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
}
