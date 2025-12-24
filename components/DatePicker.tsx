import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
}

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih tanggal",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to Date
  const selectedDate = value ? new Date(value) : null;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Generate calendar grid
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(year, month, day);
    const formatted = selected.toISOString().split("T")[0];
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === day
    );
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getDate()} ${MONTHS[d.getMonth()].slice(
      0,
      3
    )} ${d.getFullYear()}`;
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 text-xs font-medium hover:bg-gray-100 transition-all outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <Calendar size={14} className="text-gray-400" />
        <span className={value ? "text-gray-700" : "text-gray-400"}>
          {value ? formatDisplayDate(value) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold text-gray-800">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] font-bold text-gray-400 uppercase"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => (
              <div key={idx} className="aspect-square">
                {day && (
                  <button
                    type="button"
                    onClick={() => handleSelectDay(day)}
                    className={`w-full h-full rounded-lg text-xs font-medium transition-all ${
                      isSelected(day)
                        ? "bg-emerald-500 text-white shadow-lg"
                        : isToday(day)
                        ? "bg-emerald-50 text-emerald-600 font-bold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Clear button */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;
