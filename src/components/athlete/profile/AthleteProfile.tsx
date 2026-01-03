"use client";

import { useMemo, useState } from "react";
import AthleteMetaCard from "./AthleteMetaCard";
import AthletePersonalCard from "./AthletePersonalCard";
import AthleteMembershipCard from "./AthleteMembershipCard";
import AthleteEmergencyHealthCard from "./AthleteEmergencyHealthCard";
import { athleteProfileMock, type AthleteProfile } from "./athleteProfileMock";

export default function AthleteProfile() {
  const [profile, setProfile] = useState<AthleteProfile>(athleteProfileMock);

  const handleUpdate = (partial: Partial<AthleteProfile>) => {
    setProfile((prev) => ({
      ...prev,
      ...partial,
      emergency: partial.emergency ? { ...prev.emergency, ...partial.emergency } : prev.emergency,
      health: partial.health ? { ...prev.health, ...partial.health } : prev.health,
    }));
  };

  // (Mock) recalcular milestone si cambia totalAttendance
  const computed = useMemo(() => {
    const remaining = Math.max(0, profile.nextMilestone - profile.totalAttendance);
    return { ...profile, remainingToMilestone: remaining };
  }, [profile]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <AthleteMetaCard profile={computed} onUpdate={handleUpdate} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <AthletePersonalCard profile={computed} onUpdate={handleUpdate} />
        <AthleteMembershipCard profile={computed} onUpdate={handleUpdate} />
      </div>

      <AthleteEmergencyHealthCard profile={computed} onUpdate={handleUpdate} />
    </div>
  );
}
