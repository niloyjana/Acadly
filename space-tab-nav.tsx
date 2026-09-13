"use client";

import { CalendarDays, ListChecks, Megaphone, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

export type SpaceTab = "tasks" | "calendar" | "members" | "announcements";

const TAB_ITEMS: { id: SpaceTab; label: string; icon: typeof ListChecks }[] = [
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "members", label: "Members", icon: Users },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export function SpaceTabNav({
  active,
  onChange,
  /** tab ids that should show a small "new" ping dot */
  pinged = [],
}: {
  active: SpaceTab;
  onChange: (tab: SpaceTab) => void;
  pinged?: SpaceTab[];
}) {
  return (
    <NavigationMenu className="max-w-none justify-start">
      <NavigationMenuList className="w-full justify-start gap-1 space-x-0 overflow-x-auto scrollbar-hide">
        {TAB_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const isPinged = pinged.includes(id);
          return (
            <NavigationMenuItem key={id}>
              <NavigationMenuLink
                active={isActive}
                onClick={() => onChange(id)}
                className={cn(
                  "group relative inline-flex h-9 w-max cursor-pointer select-none items-center justify-center gap-2 px-3 py-2 text-sm font-medium",
                  "before:absolute before:inset-x-2 before:bottom-0 before:h-[2px] before:scale-x-0 before:bg-acadly-violet before:transition-transform",
                  "hover:text-acadly-violet hover:before:scale-x-100",
                  "focus:outline-hidden focus:text-acadly-violet focus:before:scale-x-100",
                  isActive && "text-acadly-violet before:scale-x-100"
                )}
              >
                <span className="relative">
                  <Icon className="h-4 w-4 shrink-0" />
                  {isPinged && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-acadly-coral" />
                  )}
                </span>
                {label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
