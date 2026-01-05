"use client";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AngleDownIcon, AngleUpIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/DataTables/TableThree/Pagination";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

type MemberRow = {
  id: string;
  user: {
    name: string;
    email: string;
  };
  plan: string;
  fee: string;
  expiresAt: string; // "YYYY-MM-DD"
    role: "admin" | "coach" | "athlete";
    status?: string;};


function toStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysBetween(a: Date, b: Date) {
  const ms = toStartOfDay(b).getTime() - toStartOfDay(a).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

type MemberStatus = "Activa" | "Por vencer" | "Vencida";

function getStatus(expiresAtISO: string): MemberStatus {
  const today = toStartOfDay(new Date());
  const exp = toStartOfDay(new Date(expiresAtISO));
  const diff = daysBetween(today, exp);

  if (diff < 0) return "Vencida";
  if (diff <= 7) return "Por vencer";
  return "Activa";
}

export default function MembersTable() {
  const [isChecked, setIsChecked] = useState(false);

  // mock state para poder eliminar filas
  const [members, setMembers] = useState<MemberRow[]>([]);
  useEffect(() => {
    let alive = true;

    async function loadMembers() {
        try {
          const [resMembers, resUsers] = await Promise.all([
            fetch("/api/admin/members"),
            fetch("/api/admin/users"),
          ]);

          const dataMembers = await resMembers.json().catch(() => ({}));
          const dataUsers = await resUsers.json().catch(() => ({}));

          if (!resMembers.ok) {
            throw new Error((dataMembers as any)?.error || "Failed to load members");
          }
          if (!resUsers.ok) {
            throw new Error((dataUsers as any)?.error || "Failed to load staff");
          }

          if (!alive) return;

          const athletes = (dataMembers.members || []).map((m: any) => ({
            id: m.id,
            user: {
              name: m.user?.name || "",
              email: m.user?.email || "",
            },
            plan: m.plan || "—",
            fee: m.fee ? `€${m.fee}` : "—",
            expiresAt: m.expiresAt || "",
            role: "athlete" as const,
            status: m.status || "",
          }));

          const staff = (dataUsers.users || []).map((u: any) => ({
            id: u.id,
            user: {
              name: u.fullName || "—",
              email: u.email || "—",
            },
            plan: "—",
            fee: "—",
            expiresAt: "",
            role: (u.role || "coach") as "admin" | "coach",
            status: "—",
          }));

          setMembers([...athletes, ...staff]);
        } catch (e) {
          console.error("Failed to load members/staff", e);
        }
      }

      loadMembers();
    return () => {
      alive = false;
    };
  }, []);


  const deleteModal = useModal();
  const [memberToDelete, setMemberToDelete] = useState<MemberRow | null>(null);

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  const tableRowData = useMemo(() => {
    return members.map((m) => ({
      ...m,
      status: (m as any).status ? (m as any).status : getStatus(m.expiresAt),
    }));
  }, [members]);

  const totalPages = Math.max(1, Math.ceil(tableRowData.length / rowsPerPage));

  const currentData = tableRowData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalEntries = tableRowData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleRowsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const newRowsPerPage = parseInt(e.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1);
  };

  const openDeleteModal = (m: MemberRow) => {
    setMemberToDelete(m);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    const deletingId = memberToDelete.id;

    try {
      const url = "/api/admin/members?id=" + encodeURIComponent(deletingId);
      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(String((data as any)?.error || "Failed to delete member"));
      }

      setMembers((prev) => prev.filter((m) => m.id !== deletingId));

      // Ajuste de página si borrás el último item de la página actual
      setCurrentPage((prevPage) => {
        const newCount = members.length - 1;
        const newTotalPages = Math.max(1, Math.ceil(newCount / rowsPerPage));
        return Math.min(prevPage, newTotalPages);
      });
    } catch (e) {
      console.error(e);
    } finally {
      deleteModal.closeModal();
      setMemberToDelete(null);
    }
  };

  return (
    <>
      <div className="overflow-hidden  rounded-xl  bg-white  dark:bg-white/[0.03]">
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400"> Show </span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              >
                <option
                  value="10"
                  className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  10
                </option>
                <option
                  value="8"
                  className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  8
                </option>
                <option
                  value="5"
                  className="text-gray-500 dark:bg-gray-900 dark:text-gray-400"
                >
                  5
                </option>
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400"> entries </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                    fill=""
                  />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Search..."
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
              />
            </div>

            <Link
              href="/admin/members/new"
              className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M5 10.0002H15.0006M10.0002 5V15.0006"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Add Member
            </Link>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex gap-3">
                        <Checkbox checked={isChecked} onChange={setIsChecked} />
                        <span className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                          Member
                        </span>
                      </div>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Plan
                      </p>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Fee
                      </p>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Expires
                      </p>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Status
                      </p>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">
                        Action
                      </p>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-4 border border-gray-100 dark:border-white/[0.05] dark:text-white/90 whitespace-nowrap">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <Checkbox
                            checked={isChecked}
                            onChange={setIsChecked}
                          />
                        </div>
                        <div>
                          <p className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.user.name}
                          </p>
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            {item.user.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-gray-400 whitespace-nowrap">
                      <span>{item.plan}</span>
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      {item.fee}
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      {item.expiresAt}
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      <span className="capitalize">{item.role}</span>
                      </TableCell>

                      <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                        <Badge
                        size="sm"
                        color={
                          item.status === "Activa"
                            ? "success"
                            : item.status === "Por vencer"
                            ? "warning"
                            : "error"
                        }
                      >
                        {item.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      <div className="flex items-center w-full gap-2">
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item)}
                          className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500"
                        >
                          <TrashBinIcon />
                        </button>

                        <Link
                          href={`/admin/members/${item.id}/edit`}
                          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                        >
                          <PencilIcon />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="border border-t-0 rounded-b-xl border-gray-100 py-4 pl-[18px] pr-4 dark:border-white/[0.05]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
            <div className="pb-3 xl:pb-0">
              <p className="pb-3 text-sm font-medium text-center text-gray-500 border-b border-gray-100 dark:border-gray-800 dark:text-gray-400 xl:border-b-0 xl:pb-0 xl:text-left">
                {totalEntries === 0
                  ? "No entries"
                  : `Showing ${startIndex + 1} to ${endIndex} of ${totalEntries} entries`}
              </p>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.closeModal();
          setMemberToDelete(null);
        }}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="text-center">
          <div className="relative flex items-center justify-center z-1 mb-7">
            <svg
              className="fill-error-50 dark:fill-error-500/15"
              width="90"
              height="90"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
                fill=""
                fillOpacity=""
              />
            </svg>

            <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <svg
                className="fill-error-600 dark:fill-error-500"
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.62684 11.7496C9.04105 11.1638 9.04105 10.2141 9.62684 9.6283C10.2126 9.04252 11.1624 9.04252 11.7482 9.6283L18.9985 16.8786L26.2485 9.62851C26.8343 9.04273 27.7841 9.04273 28.3699 9.62851C28.9556 10.2143 28.9556 11.164 28.3699 11.7498L21.1198 18.9999L28.3699 26.25C28.9556 26.8358 28.9556 27.7855 28.3699 28.3713C27.7841 28.9571 26.8343 28.9571 26.2485 28.3713L18.9985 21.1212L11.7482 28.3715C11.1624 28.9573 10.2126 28.9573 9.62684 28.3715C9.04105 27.7857 9.04105 26.836 9.62684 26.2502L16.8771 18.9999L9.62684 11.7496Z"
                  fill=""
                />
              </svg>
            </span>
          </div>

          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Delete Member?
          </h4>
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            {memberToDelete
              ? `Are you sure you want to delete ${memberToDelete.user.name}? This action can’t be undone.`
              : "Are you sure you want to delete this member?"}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-3 mt-7">
            <button
              type="button"
              onClick={() => {
                deleteModal.closeModal();
                setMemberToDelete(null);
              }}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 bg-white shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg bg-error-500 shadow-theme-xs hover:bg-error-600 sm:w-auto"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
