"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

type Row = {
  id: string;
  wodDate: string; // YYYY-MM-DD
  track: string;
  title: string;
  isPublished: boolean;
};

function trackLabel(v: string) {
  const s = (v || "").toLowerCase();
  if (s === "crossfit") return "CrossFit";
  if (s === "functional") return "Functional";
  if (s === "weightlifting") return "Weightlifting";
  if (s === "open_gym") return "Open Gym";
  return v || "—";
}

export default function WodTable() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // delete modal
  const deleteModal = useModal();
  const [toDelete, setToDelete] = useState<Row | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/wods");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(String((data as any)?.error || "Failed to load wods"));

        const list = Array.isArray((data as any)?.wods) ? (data as any).wods : [];
        const mapped: Row[] = list.map((w: any) => ({
          id: String(w.id),
          wodDate: String(w.wodDate || w.date || ""),
          track: String(w.track || ""),
          title: String(w.title || "—"),
          isPublished: Boolean(w.isPublished),
        }));

        // orden: fecha desc
        mapped.sort((a, b) => (a.wodDate < b.wodDate ? 1 : -1));

        if (!alive) return;
        setRows(mapped);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const openDelete = (r: Row) => {
    setToDelete(r);
    deleteModal.openModal();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const id = toDelete.id;

    try {
      const res = await fetch(`/api/admin/wods?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(String((data as any)?.error || "Failed to delete WOD"));

      setRows((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      deleteModal.closeModal();
      setToDelete(null);
    }
  };

  const empty = !loading && rows.length === 0;

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Workouts (WOD)</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Crear / editar / publicar Workouts (WOD).</p>
          </div>

          <Link
            href="/admin/wod/new"
            className="bg-brand-500 shadow-sm inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            + New WOD
          </Link>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Date
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Track
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Title
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    Loading…
                  </TableCell>
                </TableRow>
              ) : empty ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-sm text-gray-500 dark:text-gray-400" colSpan={5}>
                    No Workouts (WOD) yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90 whitespace-nowrap">
                      {r.wodDate}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {trackLabel(r.track)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-800 dark:text-white/90">
                      {r.title || "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm whitespace-nowrap">
                      <Badge size="sm" color={r.isPublished ? "success" : "warning"}>
                        {r.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin/wod/${r.id}/edit`}
                          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                        >
                          <PencilIcon />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openDelete(r)}
                          className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500"
                        >
                          <TrashBinIcon />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          deleteModal.closeModal();
          setToDelete(null);
        }}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="text-center">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Delete WOD?
          </h4>
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            {toDelete ? `Are you sure you want to delete "${toDelete.title}"?` : "Are you sure?"}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => {
                deleteModal.closeModal();
                setToDelete(null);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/5 sm:w-auto"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={confirmDelete}
              className="w-full rounded-lg bg-error-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs hover:bg-error-600 sm:w-auto"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
