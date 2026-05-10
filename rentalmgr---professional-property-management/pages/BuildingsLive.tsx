import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Building, UpsertBuildingRequest } from '../types';
import { formatCurrency } from '../utils/format';

const emptyForm: UpsertBuildingRequest = {
  name: '',
  address: '',
  waterUnitPrice: 0.5,
  electricUnitPrice: 0.25,
};

const BuildingsLive: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UpsertBuildingRequest>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadBuildings = async () => {
    setLoading(true);
    setError(null);
    try {
      setBuildings(await api.getBuildings());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load buildings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBuildings();
  }, []);

  const filteredBuildings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return buildings.filter((building) => {
      if (!query) {
        return true;
      }

      return (
        building.name.toLowerCase().includes(query) ||
        building.address.toLowerCase().includes(query)
      );
    });
  }, [buildings, searchQuery]);

  const totals = useMemo(() => {
    return buildings.reduce(
      (acc, building) => {
        acc.rooms += building.rooms;
        acc.occupied += building.occupiedRooms;
        return acc;
      },
      { rooms: 0, occupied: 0 },
    );
  }, [buildings]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const startEdit = (building: Building) => {
    setEditingId(building.id);
    setForm({
      name: building.name,
      address: building.address,
      waterUnitPrice: building.waterUnitPrice,
      electricUnitPrice: building.electricUnitPrice,
    });
    setShowForm(true);
  };

  const saveBuilding = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId === null) {
        const created = await api.createBuilding(form);
        setBuildings((current) => [created, ...current]);
      } else {
        const updated = await api.updateBuilding(editingId, form);
        setBuildings((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save building.');
    } finally {
      setSaving(false);
    }
  };

  const deleteBuilding = async (id: number) => {
    setSaving(true);
    setDeleteError(null);
    try {
      await api.deleteBuilding(id);
      setBuildings((current) => current.filter((item) => item.id !== id));
      setDeletingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete building.';
      setDeleteError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Building Management</h1>
          <p className="mt-1 text-base font-normal text-gray-500 dark:text-gray-400">Manage properties, pricing, and occupancy status.</p>
        </div>
        <button
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600"
          onClick={startCreate}
          type="button"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Building
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard color="blue" icon="domain" label="Total Buildings" value={`${buildings.length}`} />
        <StatsCard color="green" icon="door_front" label="Total Rooms" value={`${totals.rooms}`} />
        <StatsCard color="purple" icon="meeting_room" label="Occupied Rooms" value={`${totals.occupied}`} />
      </div>

      {showForm && (
        <form className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark lg:grid-cols-2" onSubmit={(event) => void saveBuilding(event)}>
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId === null ? 'Create Building' : 'Update Building'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">These values drive room utility pricing and inventory summaries.</p>
          </div>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Building name
            <input
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={form.name}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Address
            <input
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              value={form.address}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Water unit price
            <input
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, waterUnitPrice: Number(event.target.value) }))}
              step="0.01"
              type="number"
              value={form.waterUnitPrice}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Electric unit price
            <input
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              min="0"
              onChange={(event) => setForm((current) => ({ ...current, electricUnitPrice: Number(event.target.value) }))}
              step="0.01"
              type="number"
              value={form.electricUnitPrice}
            />
          </label>
          <div className="lg:col-span-2 flex flex-wrap items-center justify-end gap-3">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700" onClick={resetForm} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white" disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId === null ? 'Create Building' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-100 p-4 dark:border-gray-800 sm:flex-row">
          <div className="relative w-full sm:w-96">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              className="w-full rounded-lg bg-gray-50 py-2 pl-10 pr-10 text-sm dark:bg-gray-800"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name or address..."
              value={searchQuery}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
          <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700" onClick={() => void loadBuildings()} type="button">
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Building</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Address</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Pricing</th>
                <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-500">Rooms</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredBuildings.map((building) => (
                <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" key={building.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img alt={building.name} className="h-10 w-10 rounded-lg object-cover" src={building.image} />
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{building.name}</p>
                        <p className="text-xs text-gray-400">ID: {building.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{building.address || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>Water: {formatCurrency(building.waterUnitPrice)}</div>
                    <div>Electric: {formatCurrency(building.electricUnitPrice)}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {building.occupiedRooms}/{building.rooms}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                        building.status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30'
                          : building.status === 'Maintenance'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          building.status === 'Active'
                            ? 'bg-green-600'
                            : building.status === 'Maintenance'
                              ? 'bg-yellow-500'
                              : 'bg-gray-500'
                        }`}
                      ></span>
                      {building.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-primary transition-colors hover:underline" onClick={() => startEdit(building)} type="button">
                        Edit
                      </button>
                      <button className="text-red-600 transition-colors hover:underline" onClick={() => setDeletingId(building.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredBuildings.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                    No buildings matched the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-surface-dark">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Delete</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this building? This action cannot be undone.
            </p>
            {deleteError && <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{deleteError}</div>}
            <div className="mt-4 flex gap-2">
              <button
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700"
                onClick={() => setDeletingId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                disabled={saving}
                onClick={() => void deleteBuilding(deletingId)}
                type="button"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
  <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-surface-dark">
    <div className={`flex size-12 items-center justify-center rounded-full bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20`}>
      <span className="material-symbols-outlined">{icon}</span>
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  </div>
);

export default BuildingsLive;
