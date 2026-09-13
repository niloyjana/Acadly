"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Columns3, Grid, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

export type EventType = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
};


export type DayType = {
  day: string;
  date: Date;
  isCurrentMonth: boolean;
  classNames: string;
  meetingInfo?: {
    id: string;
    date: string;
    time: string;
    title: string;
    participants: string[];
    location: string;
  }[];
};

interface DayProps {
  classNames: string;
  day: DayType;
  onHover: (day: string | null) => void;
}

const Day: React.FC<DayProps> = ({ classNames, day, onHover }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <>
      <motion.div
        className={`relative flex items-center justify-center py-1 ${classNames}`}
        style={{ height: '4rem', borderRadius: 16 }}
        onMouseEnter={() => {
          setIsHovered(true);
          onHover(day.date.toISOString());
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHover(null);
        }}
        id={`day-${day.day}`}
      >
        <motion.div className="flex flex-col items-center justify-center">
          <span className={`text-sm ${day.isCurrentMonth ? "text-ink dark:text-white font-medium" : "text-ink/30 dark:text-white/30"}`}>{day.day}</span>
        </motion.div>
        {day.meetingInfo && day.meetingInfo.length > 0 && (
          <motion.div
            className="absolute bottom-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/10 dark:bg-white/10 p-1 text-[10px] font-bold text-ink dark:text-white"
            layoutId={`day-${day.date.toISOString()}-meeting-count`}
            style={{
              borderRadius: 999,
            }}
          >
            {day.meetingInfo.length}
          </motion.div>
        )}

        <AnimatePresence>
          {day.meetingInfo && day.meetingInfo.length > 0 && isHovered && (
            <div className="absolute inset-0 flex size-full items-center justify-center">
              <motion.div
                className="flex size-10 items-center justify-center bg-acadly-violet p-1 text-xs font-bold text-white shadow-md"
                layoutId={`day-${day.date.toISOString()}-meeting-count`}
                style={{
                  borderRadius: 999,
                }}
              >
                {day.meetingInfo.length}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

const CalendarGrid: React.FC<{ days: DayType[]; onHover: (day: string | null) => void }> = ({
  days,
  onHover,
}) => {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day, index) => (
        <Day
          key={`${day.date.toISOString()}-${index}`}
          classNames={day.classNames}
          day={day}
          onHover={onHover}
        />
      ))}
    </div>
  );
};

import { HTMLMotionProps } from 'framer-motion';

interface InteractiveCalendarProps extends HTMLMotionProps<"div"> {
  events?: EventType[];
  spaceId?: string;
  onDelete?: () => void;
}

const InteractiveCalendar = React.forwardRef<HTMLDivElement, InteractiveCalendarProps>(({ events = [], spaceId, onDelete, className, ...props }, ref) => {
  const [moreView, setMoreView] = useState(false);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const daysInGrid = useMemo(() => {
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    return dates.map(date => {
      const isCurrentMonth = isSameMonth(date, monthStart);
      const dayEvents = events.filter(e => isSameDay(new Date(e.startTime), date));
      
      const meetingInfo = dayEvents.map(e => ({
        id: e.id,
        date: format(new Date(e.startTime), "EEE, d MMM"),
        time: `${format(new Date(e.startTime), "h:mm a")} - ${format(new Date(e.endTime), "h:mm a")}`,
        title: e.title,
        participants: [], // Real data doesn't have participants yet
        location: e.location || "TBD",
      }));

      let classNames = isCurrentMonth ? 'bg-black/5 dark:bg-white/5' : 'bg-black/5 dark:bg-white/5 opacity-50';
      if (meetingInfo.length > 0) {
        classNames += ' cursor-pointer border border-acadly-violet/30';
      }

      return {
        day: format(date, "dd"),
        date,
        isCurrentMonth,
        classNames,
        meetingInfo: meetingInfo.length > 0 ? meetingInfo : undefined,
      };
    });
  }, [startDate, endDate, monthStart, events]);

  const handleDayHover = (day: string | null) => {
    setHoveredDay(day);
  };

  const sortedDays = useMemo(() => {
    if (!hoveredDay) return daysInGrid;
    return [...daysInGrid].sort((a, b) => {
      if (a.date.toISOString() === hoveredDay) return -1;
      if (b.date.toISOString() === hoveredDay) return 1;
      return 0;
    });
  }, [hoveredDay, daysInGrid]);

  const handleDeleteEvent = async (eventId: string) => {
    if (!spaceId) return;
    try {
      const res = await fetch(`/api/spaces/${spaceId}/events/${eventId}`, { method: 'DELETE' });
      if (res.ok && onDelete) onDelete();
    } catch (e) {
      console.error(e);
    }
  };

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        ref={ref}
        className={`relative mx-auto my-10 flex w-full flex-col items-start justify-center gap-8 lg:flex-row ${className}`}
        {...props}
      >
        <motion.div layout className="w-full max-w-lg">
          <motion.div
            key="calendar-view"
            className="flex w-full flex-col gap-4"
          >
            <div className="flex w-full items-center justify-between">
              <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-ink dark:text-zinc-300">
                {format(currentDate, "MMM")} <span className="opacity-50">{format(currentDate, "yyyy")}</span>
              </motion.h2>
              <motion.button
                className="relative flex items-center gap-3 rounded-lg border border-black/10 dark:border-white/10 px-1.5 py-1 text-ink/60 dark:text-white/60"
                onClick={() => setMoreView(!moreView)}
              >
                <Columns3 className="z-[2]" />
                <Grid className="z-[2]" />
                <div
                  className="absolute left-0 top-0 h-[85%] w-7 rounded-md bg-black/10 dark:bg-white/10 transition-transform duration-300"
                  style={{
                    top: '50%',
                    transform: moreView
                      ? 'translateY(-50%) translateX(40px)'
                      : 'translateY(-50%) translateX(4px)',
                  }}
                ></div>
              </motion.button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day}
                  className="px-0/5 rounded-xl bg-black/10 dark:bg-white/10 py-1 text-center text-xs font-medium text-ink dark:text-white"
                >
                  {day}
                </div>
              ))}
            </div>
            <CalendarGrid days={daysInGrid} onHover={handleDayHover} />
          </motion.div>
        </motion.div>
        {moreView && (
          <motion.div
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              key="more-view"
              className="mt-4 flex w-full flex-col gap-4"
            >
              <div className="flex w-full flex-col items-start justify-between">
                <motion.h2 className="mb-2 text-4xl font-bold tracking-wider text-ink dark:text-zinc-300">
                  Bookings
                </motion.h2>
                <p className="font-medium text-ink/60 dark:text-zinc-300/50">
                  See upcoming and past events booked through your event type
                  links.
                </p>
              </div>
              <motion.div
                className="flex h-[620px] w-full flex-col items-start justify-start overflow-hidden overflow-y-scroll rounded-xl border-2 border-black/10 dark:border-white/10 shadow-md"
                layout
              >
                <AnimatePresence>
                  {sortedDays.filter((day) => day.meetingInfo && day.meetingInfo.length > 0).length === 0 ? (
                     <div className="p-6 text-ink/50 dark:text-zinc-500 w-full text-center">No events scheduled.</div>
                  ) : (
                    sortedDays
                      .filter((day) => day.meetingInfo && day.meetingInfo.length > 0)
                      .map((day) => (
                        <motion.div
                          key={day.date.toISOString()}
                          className={`w-full border-b-2 border-black/10 dark:border-white/10 py-0 last:border-b-0`}
                          layout
                        >
                          {day.meetingInfo &&
                            day.meetingInfo.map((meeting, mIndex) => (
                              <motion.div
                                key={meeting.id}
                                className="border-b border-black/5 dark:border-white/10 p-3 last:border-b-0 group"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{
                                  duration: 0.2,
                                  delay: mIndex * 0.05,
                                }}
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-sm font-medium text-ink/70 dark:text-white/70">
                                    {meeting.date}
                                  </span>
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-ink dark:text-white">
                                      {meeting.time}
                                    </span>
                                    {spaceId && (
                                      <button 
                                        onClick={() => handleDeleteEvent(meeting.id)}
                                        className="text-red-500 dark:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 dark:hover:bg-red-400/10 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <h3 className="mb-1 text-lg font-semibold text-ink dark:text-white">
                                  {meeting.title}
                                </h3>
                                {meeting.participants.length > 0 && (
                                  <p className="mb-1 text-sm text-ink/50 dark:text-zinc-600">
                                    {meeting.participants.join(', ')}
                                  </p>
                                )}
                                <div className="flex items-center text-blue-500">
                                  <svg
                                    className="mr-1 h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  <span className="text-sm">
                                    {meeting.location}
                                  </span>
                                </div>
                              </motion.div>
                            ))}
                        </motion.div>
                      ))
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
});
InteractiveCalendar.displayName = 'InteractiveCalendar';

export default InteractiveCalendar;
