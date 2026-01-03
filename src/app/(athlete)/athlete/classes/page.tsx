import { ReservationsProvider } from "@/components/athlete/reservations/reservationsStore";
import AthleteClasses from "@/components/athlete/classes/AthleteClasses";

export default function AthleteClassesPage() {
  return (
    <div>
      <ReservationsProvider>
        <AthleteClasses />
      </ReservationsProvider>
    </div>
  );
}
