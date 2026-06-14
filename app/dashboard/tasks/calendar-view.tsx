"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TaskWithRelations, Task } from "@/lib/types";
import styles from "./calendar-view.module.css";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_VISIBLE_TASKS = 3;

const STATUS_CHIP: Record<string, string> = {
  todo: styles.chipTodo,
  in_progress: styles.chipInProgress,
  review: styles.chipReview,
  done: styles.chipDone,
  blocked: styles.chipBlocked,
};

type CalendarViewProps = {
  tasks: TaskWithRelations[];
  onTaskClick: (task: Task) => void;
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: { date: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({
      date: daysInPrevMonth - i,
      month: month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: d, month, year, isCurrentMonth: true });
  }

  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({
      date: d,
      month: month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false,
    });
  }

  return days;
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const task of tasks) {
      if (!task.due_date) continue;
      const key = task.due_date;
      const existing = map.get(key) ?? [];
      existing.push(task);
      map.set(key, existing);
    }
    return map;
  }, [tasks]);

  function goToPrev() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function goToNext() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className={styles.calendarWrap}>
      <div className={styles.calendarHeader}>
        <span className={styles.monthLabel}>{monthLabel}</span>
        <div className={styles.navBtns}>
          <button className={styles.todayBtn} onClick={goToToday}>Today</button>
          <button className={styles.navBtn} onClick={goToPrev} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className={styles.navBtn} onClick={goToNext} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {DAYS.map((d) => (
          <div key={d} className={styles.dayHeader}>{d}</div>
        ))}

        {calendarDays.map((day, i) => {
          const key = dateKey(day.year, day.month, day.date);
          const isToday = key === todayKey;
          const dayTasks = tasksByDate.get(key) ?? [];
          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS);
          const remaining = dayTasks.length - MAX_VISIBLE_TASKS;

          let cellClass = styles.cell;
          if (!day.isCurrentMonth) cellClass += ` ${styles.cellOutside}`;
          if (isToday) cellClass += ` ${styles.cellToday}`;

          let dateClass = styles.dateNum;
          if (isToday) dateClass += ` ${styles.dateNumToday}`;
          if (!day.isCurrentMonth) dateClass += ` ${styles.dateNumOutside}`;

          return (
            <div key={i} className={cellClass}>
              <span className={dateClass}>{day.date}</span>
              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className={`${styles.taskChip} ${STATUS_CHIP[task.status] ?? styles.chipTodo}`}
                  onClick={() => onTaskClick(task)}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
              {remaining > 0 && (
                <span className={styles.moreChip}>+{remaining} more</span>
              )}
              {dayTasks.length > 0 && (
                <div className={styles.dotIndicator}>
                  {dayTasks.slice(0, 3).map((_, idx) => (
                    <span key={idx} className={styles.dot} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
