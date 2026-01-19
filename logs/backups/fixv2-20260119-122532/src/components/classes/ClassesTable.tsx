"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { AngleDownIcon, AngleUpIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import Pagination from "@/components/tables/DataTables/TableThree/Pagination";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

type ClassRow = {
  id: string;
  program: string;
  coach: string;
  day: string; // Mon..Sun
  time: string; // HH:MM
  durationMin: number;
  capacity: number;
  type?: string;
  status?: string;
};

export default function ClassesTable() {
  const [isChecked, setIsChecked] = useState(false);
  const [rows, setRows] = useState<ClassRow[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [query, setQuery] = useState("");

  const deleteModal = useModal();
  const [rowToDelete, setRowToDelete] = useState<ClassRow | null>(null);

  const fetchRows = async () => {
    try {
      const res = await fetch("/api/admin/classes", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load classes");
      const items = Array.isArray(json?.classes) ? json.classes : [];
      setRows(items);
    } catch {
      setRows([]);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tableRowData = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const hay = `${r.program} ${r.coach} ${r.day} ${r.time}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query]);

  const totalPages = Math.max(1, Math.ceil(tableRowData.length / rowsPerPage));
  const currentData = tableRowData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const totalEntries = tableRowData.length;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, totalEntries);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = parseInt(e.target.value, 10);
    setRowsPerPage(n);
    setCurrentPage(1);
  };

  const openDelete = (r: ClassRow) => {
    setRowToDelete(r);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!rowToDelete) return;
    const deletingId = rowToDelete.id;

    try {
      const res = await fetch(`/api/admin/classes?id=${encodeURIComponent(deletingId)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete");
      setRows((prev) => prev.filter((x) => x.id !== deletingId));
    } catch {
      // noop
    }

    deleteModal.closeModal();
    setRowToDelete(null);
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl bg-white dark:bg-white/[0.03]">
        <div className="flex flex-col gap-2 px-4 py-4 border border-b-0 border-gray-100 dark:border-white/[0.05] rounded-t-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400"> Show </span>
            <div className="relative z-20 bg-transparent">
              <select
                className="w-full py-2 pl-3 pr-8 text-sm text-gray-800 bg-transparent border border-gray-300 rounded-lg appearance-none dark:bg-dark-900 h-9 bg-none shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
              >
                <option value="10" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
                <option value="8" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">8</option>
                <option value="5" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">5</option>
              </select>
              <span className="absolute z-30 text-gray-500 -translate-y-1/2 right-2 top-1/2 dark:text-gray-400">
                <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400"> entries </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <button className="absolute text-gray-500 -translate-y-1/2 left-4 top-1/2 dark:text-gray-400">
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill="" />
                </svg>
              </button>

              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setCurrentPage(1); }}
                className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[300px]"
              />
            </div>

            <Link
              href="/admin/classes/new"
              className="bg-brand-500 shadow-sm hover inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M5 10.0002H15.0006M10.0002 5V15.0006" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Add Class
            </Link>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto custom-scrollbar">
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                    <div className="flex items-center justify-between cursor-pointer">
                      <div className="flex gap-3">
                        <Checkbox checked={isChecked} onChange={setIsChecked} />
                        <span className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">Class</span>
                      </div>
                      <button className="flex flex-col gap-0.5">
                        <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                        <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                      </button>
                    </div>
                  </TableCell>

                  {["Day/Time", "Duration", "Capacity", "Status", "Action"].map((h) => (
                    <TableCell key={h} isHeader className="px-4 py-3 border border-gray-100 dark:border-white/[0.05]">
                      <div className="flex items-center justify-between cursor-pointer">
                        <p className="font-medium text-gray-700 text-theme-xs dark:text-gray-400">{h}</p>
                        <button className="flex flex-col gap-0.5">
                          <AngleUpIcon className="text-gray-300 dark:text-gray-700" />
                          <AngleDownIcon className="text-gray-300 dark:text-gray-700" />
                        </button>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="px-4 py-4 border border-gray-100 dark:border-white/[0.05] dark:text-white/90 whitespace-nowrap">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <Checkbox checked={isChecked} onChange={setIsChecked} />
                        </div>
                        <div>
                          <p className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.program}
                          </p>
                          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            Coach: {item.coach}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-gray-400 whitespace-nowrap">
                      {item.day} {item.time}
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      {item.durationMin} min
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      {item.capacity}
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      <Badge size="sm" color="success">Scheduled</Badge>
                    </TableCell>

                    <TableCell className="px-4 py-4 font-normal text-gray-800 border border-gray-100 dark:border-white/[0.05] text-theme-sm dark:text-white/90 whitespace-nowrap">
                      <div className="flex items-center w-full gap-2">
                        <button
                          onClick={() => openDelete(item)}
                          className="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                          title="Delete"
                        >
                          <TrashBinIcon />
                        </button>

                        <Link
                          href={`/admin/classes/${item.id}/edit`}
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
                {totalEntries === 0 ? "No entries" : `Showing ${startIndex + 1} to ${endIndex} of ${totalEntries} entries`}
              </p>
            </div>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.closeModal();
          setRowToDelete(null);
        }}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Delete Class?
          </h4>
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            {rowToDelete
              ? `Are you sure you want to delete ${rowToDelete.program} (${rowToDelete.day} ${rowToDelete.time})?`
              : "Are you sure you want to delete this class?"}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-3 mt-7">
            <button
              type="button"
              onClick={() => {
                deleteModal.closeModal();
                setRowToDelete(null);
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
