import React, { useState, useRef, useEffect } from "react";
import { DateWheelPicker } from "./date-wheel-picker";
import { format } from "date-fns";

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value or use now
  const parsedDate = value ? new Date(value) : new Date();
  
  // Local state for time
  const [hours, setHours] = useState(value ? format(parsedDate, "HH") : "12");
  const [minutes, setMinutes] = useState(value ? format(parsedDate, "mm") : "00");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (newDate: Date) => {
    // Preserve time
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    
    // Format for datetime-local input YYYY-MM-DDThh:mm
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth() + 1).padStart(2, "0");
    const day = String(newDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(dateStr);
  };

  const handleTimeChange = (type: "h" | "m", val: string) => {
    let newH = hours;
    let newM = minutes;
    if (type === "h") newH = val;
    if (type === "m") newM = val;
    
    setHours(newH);
    setMinutes(newM);
    
    if (value) {
      const d = new Date(value);
      d.setHours(parseInt(newH, 10));
      d.setMinutes(parseInt(newM, 10));
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}T${newH}:${newM}`);
    }
  };

  const displayValue = value ? format(new Date(value), "dd-MM-yyyy HH:mm") : "";

  return (
    <div className={`relative ${isOpen ? "z-50" : "z-10"}`} ref={containerRef}>
      <div 
        className="focus-ring w-full rounded-xl border border-ink/10 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 py-2 text-sm cursor-pointer flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={displayValue ? "text-ink dark:text-white" : "text-ink/50 dark:text-white/50"}>
          {displayValue || placeholder || "dd-mm-yyyy --:--"}
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/60 backdrop-blur-2xl p-4 shadow-2xl w-80">
          <DateWheelPicker
            value={parsedDate}
            onChange={handleDateChange}
            size="sm"
            className="mb-4"
          />
          <div className="flex items-center justify-center gap-2 border-t border-ink/10 dark:border-white/15 pt-4">
            <span className="text-sm font-medium">Time:</span>
            <select 
              value={hours} 
              onChange={(e) => handleTimeChange("h", e.target.value)}
              className="bg-transparent border border-ink/10 dark:border-white/15 rounded-lg p-1 text-sm focus-ring outline-none"
            >
              {Array.from({length: 24}, (_, i) => String(i).padStart(2, "0")).map(h => (
                <option key={h} value={h} className="bg-white dark:bg-zinc-800">{h}</option>
              ))}
            </select>
            <span>:</span>
            <select 
              value={minutes} 
              onChange={(e) => handleTimeChange("m", e.target.value)}
              className="bg-transparent border border-ink/10 dark:border-white/15 rounded-lg p-1 text-sm focus-ring outline-none"
            >
              {Array.from({length: 60}, (_, i) => String(i).padStart(2, "0")).map(m => (
                <option key={m} value={m} className="bg-white dark:bg-zinc-800">{m}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
