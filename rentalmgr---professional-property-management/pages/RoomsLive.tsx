import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Lookup, Room, RoomLookupResponse, RoomStatus, UpsertRoomRequest } from '../types';
import { formatCurrency } from '../utils/format';

const emptyForm: UpsertRoomRequest = {
  buildingId: 0,
  roomTypeId: 0,
  roomNumber: '',
  floor: 1,
  status: 'Vacant',
};

const statusOptions: RoomStatus[] = ['Vacant', 'Occupied', 'Maintenance'];

const RoomsLive: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lookups, setLookups] = useState<RoomLookupResponse>({ buildings: [], roomTypes: [] });
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UpsertRoomRequest>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomList, roomLookups] = await Promise.all([api.getRooms(), api.getRoomLookups()]);
      setRooms(roomList);
      setLookups(roomLookups);
      if (roomLookups.buildings.length > 0 && form.buildingId === 0) {
        setForm((current) => ({
          ...current,
          buildingId: roomLookups.buildings[0].id,
          roomTypeId: roomLookups.roomTypes[0]?.id ?? 0,
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load rooms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return rooms.filter((room) => {
      const matchesBuilding = selectedBuildingId === 'all' || room.buildingId === selectedBuildingId;
      const matchesQuery =
        !query ||
        room.roomNumber.toLowerCase().includes(query) ||
        room.building.toLowerCase().includes(query) ||
        room.type.toLowerCase().includes(query) ||
        (room.tenant ?? '').toLowerCase().includes(query);

      return matchesBuilding && matchesQuery;
    });
  }, [rooms, searchQuery, selectedBuildingId]);

  const stats = useMemo(() => {
    const occupied = rooms.filter((room) => room.status === 'Occupied').length;
    const vacant = rooms.filter((room) => room.status === 'Vacant').length;
    const occupancyRate = rooms.length === 0 ? 0 : Math.round((occupied / rooms.length) * 100);
    return { occupied, vacant, occupancyRate };
  }, [rooms]);

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setForm({
      buildingId: lookups.buildings[0]?.id ?? 0,
      roomTypeId: lookups.roomTypes[0]?.id ?? 0,
      roomNumber: '',
      floor: 1,
      status: 'Vacant',
    });
  };

  const startCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const startEdit = (room: Room) => {
    setEditingId(room.id);
    setForm({
      buildingId: room.buildingId,
      roomTypeId: room.roomTypeId,
      roomNumber: room.roomNumber,
      floor: room.floor,
      status: room.status,
    });
    setShowForm(true);
  };

  const saveRoom = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId === null) {
        const created = await api.createRoom(form);
        setRooms((current) => [created, ...current]);
      } else {
        const updated = await api.updateRoom(editingId, form);
        setRooms((current) => current.map((room) => (room.id === updated.id ? updated : room)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save room.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRoom = async (id: number) => {
    setSaving(true);
    setDeleteError(null);
    try {
      await api.deleteRoom(id);
      setRooms((current) => current.filter((room) => room.id !== id));
      setDeletingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete room.';
      setDeleteError(message);
    } finally {
      setSaving(false);
    }
  };

  const buildingName = (id: number) => lookups.buildings.find((item) => item.id === id)?.name ?? 'Unknown';

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-8 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Room Inventory</h1>
          <p className="text-base text-gray-500 dark:text-gray-400">Manage room records, room types, and current occupancy.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600" onClick={startCreate} type="button">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Add New Room
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatsCard color="blue" icon="domain" label="Total Rooms" value={`${rooms.length}`} />
        <StatsCard color="purple" icon="pie_chart" label="Occupancy Rate" progress={stats.occupancyRate} value={`${stats.occupancyRate}%`} />
        <StatsCard color="orange" icon="meeting_room" label="Vacant Rooms" value={`${stats.vacant}`} />
      </div>

      {showForm && (
        <form className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark lg:grid-cols-2" onSubmit={(event) => void saveRoom(event)}>
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId === null ? 'Create Room' : 'Update Room'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use the lease workflow to assign tenants and turn vacant rooms into occupied ones.</p>
          </div>
          <SelectField label="Building" onChange={(value) => setForm((current) => ({ ...current, buildingId: Number(value) }))} options={lookups.buildings} value={form.buildingId} />
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Room type
            <select
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              onChange={(event) => setForm((current) => ({ ...current, roomTypeId: Number(event.target.value) }))}
              value={form.roomTypeId}
            >
              {lookups.roomTypes.map((roomType) => (
                <option key={roomType.id} value={roomType.id}>
                  {roomType.name} ({formatCurrency(roomType.basePrice)})
                </option>
              ))}
            </select>
          </label>
          <Field label="Room number" onChange={(value) => setForm((current) => ({ ...current, roomNumber: value }))} required value={form.roomNumber} />
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Floor
            <input
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              onChange={(event) => setForm((current) => ({ ...current, floor: Number(event.target.value) }))}
              type="number"
              value={form.floor}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Status
            <select
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as RoomStatus }))}
              value={form.status}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="lg:col-span-2 flex justify-end gap-3">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700" onClick={resetForm} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white" disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId === null ? 'Create Room' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-surface-dark lg:flex-row">
        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <label className="relative flex-1 sm:w-64">
            <select
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent px-4 text-sm dark:border-gray-700"
              onChange={(event) => setSelectedBuildingId(event.target.value === 'all' ? 'all' : Number(event.target.value))}
              value={selectedBuildingId}
            >
              <option value="all">All Properties</option>
              {lookups.buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </label>
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-10 text-sm dark:border-gray-700"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search room or tenant..."
              value={searchQuery}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>
        <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700" onClick={() => void loadData()} type="button">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRooms.map((room) => (
          <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark" key={room.id}>
            <div
              className={`absolute left-0 top-0 h-full w-1.5 ${
                room.status === 'Occupied' ? 'bg-green-500' : room.status === 'Maintenance' ? 'bg-orange-400' : 'bg-primary'
              }`}
            ></div>
            <div className="flex h-full flex-col p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold dark:text-white">{room.roomNumber}</h3>
                  <p className="text-xs font-medium text-gray-500">{room.building} • Floor {room.floor}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                    room.status === 'Occupied'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : room.status === 'Maintenance'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-blue-100 text-primary dark:bg-blue-900/30'
                  }`}
                >
                  {room.status}
                </span>
              </div>
              <div className="mb-4 flex items-center justify-between border-y border-gray-100 py-3 dark:border-gray-800">
                <div className="flex flex-col">
                  <span className="text-xs uppercase text-gray-400">Type</span>
                  <span className="text-sm font-semibold">{room.type}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs uppercase text-gray-400">Rent</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(room.rent)}/mo</span>
                </div>
              </div>

              {room.status === 'Occupied' && (
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 overflow-hidden rounded-full bg-gray-200">
                      <img alt={room.tenant ?? 'Tenant'} src={`https://picsum.photos/seed/${room.tenant ?? room.roomNumber}/100/100`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{room.tenant ?? 'Assigned tenant'}</p>
                      <p className={`text-xs ${room.overdue ? 'font-bold text-red-500' : 'text-gray-500'}`}>
                        {room.overdue ? 'Invoice overdue' : `Lease ends: ${room.leaseEnd ?? 'N/A'}`}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => startEdit(room)}
                    type="button"
                  >
                    Edit Room
                  </button>
                  <button
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:text-red-400"
                    onClick={() => setDeletingId(room.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}

              {room.status === 'Vacant' && (
                <div className="mt-auto space-y-4">
                  <div className="flex items-center gap-3 opacity-60">
                    <div className="flex size-8 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400">
                      <span className="material-symbols-outlined text-sm">person_add</span>
                    </div>
                    <span className="text-sm font-medium">No tenant assigned</span>
                  </div>
                  <button
                    className="w-full rounded-lg bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
                    onClick={() => {
                      window.location.hash = '#/new-lease';
                    }}
                    type="button"
                  >
                    Assign Tenant
                  </button>
                  <button
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:text-red-400"
                    onClick={() => setDeletingId(room.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}

              {room.status === 'Maintenance' && (
                <div className="mt-auto space-y-4">
                  <div className="rounded bg-orange-50 p-2 text-xs font-medium text-orange-600 dark:bg-orange-900/10">
                    Maintenance status set for {buildingName(room.buildingId)}.
                  </div>
                  <button
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                    onClick={() => startEdit(room)}
                    type="button"
                  >
                    Update Status
                  </button>
                  <button
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-900/30 dark:text-red-400"
                    onClick={() => setDeletingId(room.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-surface-dark">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Confirm Delete</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this room? This action cannot be undone.
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
                onClick={() => void deleteRoom(deletingId)}
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

const StatsCard = ({
  label,
  value,
  icon,
  color,
  progress,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
  progress?: number;
}) => (
  <div className="flex flex-col gap-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-surface-dark">
    <div className="flex items-start justify-between">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <div className={`rounded-lg p-1.5 bg-${color}-50 text-${color}-600 dark:bg-${color}-900/20`}>
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
    </div>
    <div className="mt-2 flex items-baseline gap-2">
      <p className="text-3xl font-bold dark:text-white">{value}</p>
    </div>
    {progress !== undefined && (
      <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={`h-1.5 rounded-full bg-${color}-500`} style={{ width: `${progress}%` }}></div>
      </div>
    )}
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
    {label}
    <input
      className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700"
      onChange={(event) => onChange(event.target.value)}
      required={required}
      value={value}
    />
  </label>
);

const SelectField = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  options: Lookup[];
}) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
    {label}
    <select className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 dark:border-gray-700" onChange={(event) => onChange(event.target.value)} value={value}>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  </label>
);

export default RoomsLive;
