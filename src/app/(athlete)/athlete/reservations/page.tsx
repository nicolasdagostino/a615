import AthleteReservations from "@/components/athlete/reservations/AthleteReservations";
import { ReservationsProvider } from "@/components/athlete/reservations/reservationsStore";

export default function AthleteReservationsPage() {
  return (
    <ReservationsProvider>
      <AthleteReservations />
    </ReservationsProvider>
  );
}
