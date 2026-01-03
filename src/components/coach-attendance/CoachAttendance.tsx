"use client";

import { useState } from "react";
import AttendanceFilters from "@/components/coach-attendance/AttendanceFilters";
import AttendanceTable from "@/components/coach-attendance/AttendanceTable";

export default function CoachAttendance() {
  // valores por defecto mock
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [classId, setClassId] = useState<string>("c4");

  return (
    <div className="space-y-6">
      <AttendanceFilters
        date={date}
        classId={classId}
        onDateChange={setDate}
        onClassChange={setClassId}
      />

      {/* key para forzar remount y resetear rows según clase */}
      <AttendanceTable key={`${date}-${classId}`} classId={classId} />
    </div>
  );
}
