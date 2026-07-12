"use client";

import { useCallback, useEffect, useState } from "react";
import AccountPage from "@/components/account-page";
import PackageForm from "@/components/admin/PackageForm";
import PackageList from "@/components/admin/PackageList";
import type { TourPackageDTO } from "@/lib/tour-package";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<TourPackageDTO[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [editingPkg, setEditingPkg] = useState<TourPackageDTO | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadPackages = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/tour-packages");
      if (!res.ok) throw new Error("Failed to load packages");
      const data = (await res.json()) as { packages: TourPackageDTO[] };
      setPackages(data.packages ?? []);
    } catch {
      setPackages([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadPackages();
  }, [loadPackages]);

  function startEdit(pkg: TourPackageDTO) {
    setEditingPkg(pkg);
    setShowForm(true);
  }

  function handleFormSuccess() {
    setEditingPkg(null);
    setShowForm(false);
    void loadPackages();
  }

  function handleFormCancel() {
    setEditingPkg(null);
    setShowForm(false);
  }

  function openAddPackageForm() {
    setEditingPkg(null);
    setShowForm(true);
  }

  const isFormVisible = showForm || editingPkg !== null;

  return (
    <AccountPage
      title="Tours & Packages"
      requireRole="admin"
      actions={
        <button
          type="button"
          onClick={openAddPackageForm}
          className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          Add package
        </button>
      }
    >
      <div className="space-y-10">
        {isFormVisible && (
          <PackageForm
            editingPkg={editingPkg}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        <section className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="mb-6 text-xl font-bold text-slate-900">Published packages</h2>
          <PackageList
            packages={packages}
            loading={loadingList}
            onEdit={startEdit}
            onDeleteSuccess={loadPackages}
          />
        </section>
      </div>
    </AccountPage>
  );
}
