import AddStaffForm from "@/components/staff/AddStaffForm";
import { staffMock } from "@/mocks/staff";

export default async function EditStaffPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const staffId = Number(params.id);
  const staff = staffMock.find((s) => s.id === staffId);

  return (
    <div>
      <AddStaffForm
        defaultValues={{
          name: staff?.name ?? "",
          email: staff?.email ?? "",
          phone: staff?.phone ?? "",
          role: staff?.role ?? "",
          status: staff?.status ?? "",
        }}
      />
    </div>
  );
}
