import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Building, RoomReading } from '../types';

const ReadingsLive: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number>(0);
  const [rows, setRows] = useState<RoomReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadBuildings = async () => {
    const buildingList = await api.getBuildings();
    setBuildings(buildingList);
    if (buildingList.length > 0) {
      setSelectedBuildingId((current) => current || buildingList[0].id);
    }
  };

  const loadRows = async (buildingId: number) => {
    if (!buildingId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setRows(await api.getReadings(buildingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load readings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await loadBuildings();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load buildings.');
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (selectedBuildingId) {
      void loadRows(selectedBuildingId);
    }
  }, [selectedBuildingId]);

  const totalWater = useMemo(() => rows.reduce((sum, row) => sum + Math.max(0, row.newWater - row.oldWater), 0), [rows]);
  const totalElectric = useMemo(() => rows.reduce((sum, row) => sum + Math.max(0, row.newElectric - row.oldElectric), 0), [rows]);

  const updateRow = (roomId: number, field: 'newWater' | 'newElectric', value: number) => {
    setRows((current) =>
      current.map((row) =>
        row.roomId === roomId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
  };

  const saveReadings = async () => {
    if (!selectedBuildingId) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const saved = await api.saveReadings({
        buildingId: selectedBuildingId,
        rooms: rows.map((row) => ({
          roomId: row.roomId,
          newWater: row.newWater,
          newElectric: row.newElectric,
        })),
      });
      setRows(saved);
      setSuccess('Readings saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save readings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Monthly Utility Readings</h1>
          <p className="text-gray-500 dark:text-gray-400">Capture updated water and electric meter readings for occupied rooms.</p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold shadow-sm dark:border-gray-700 dark:bg-surface-dark" onClick={() => selectedBuildingId && void loadRows(selectedBuildingId)} type="button">
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reload Building
        </button>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}

      <div className="flex flex-col justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-surface-dark lg:flex-row lg:items-center">
        <div className="flex flex-1 flex-wrap gap-4">
          <label className="flex min-w-[220px] flex-1 flex-col gap-1">
            <span className="text-xs font-bold uppercase text-gray-500">Building</span>
            <select
              className="rounded-lg border border-gray-200 bg-gray-50 text-sm dark:border-gray-700 dark:bg-gray-800"
              onChange={(event) => setSelectedBuildingId(Number(event.target.value))}
              value={selectedBuildingId}
            >
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex min-w-[220px] flex-1 flex-col justify-end rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Meter Snapshot</span>
            <span className="text-sm text-blue-900">Save both water and electric readings together for each room.</span>
          </div>
        </div>
        <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/30" disabled={saving || loading || rows.length === 0} onClick={() => void saveReadings()} type="button">
          <span className="material-symbols-outlined">save</span>
          {saving ? 'Saving...' : 'Save Readings'}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:bg-gray-800/50">
              <tr>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Room</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Water Previous</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Water Current</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Water Usage</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Electric Previous</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Electric Current</th>
                <th className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">Electric Usage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm font-medium dark:divide-gray-800">
              {rows.map((row) => {
                const waterUsage = row.newWater - row.oldWater;
                const electricUsage = row.newElectric - row.oldElectric;
                const hasWarning = waterUsage < 0 || electricUsage < 0;

                return (
                  <tr className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${hasWarning ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`} key={row.roomId}>
                    <td className="px-6 py-3">
                      <div className="font-bold">Room {row.roomNumber}</div>
                      <div className="text-xs text-gray-400">{row.roomType}</div>
                    </td>
                    <td className="px-6 py-3 font-mono text-gray-500">{row.oldWater.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <input
                        className={`w-full rounded-md border p-2 font-mono text-sm ${hasWarning ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}
                        onChange={(event) => updateRow(row.roomId, 'newWater', Number(event.target.value))}
                        type="number"
                        value={row.newWater}
                      />
                    </td>
                    <td className={`px-6 py-3 font-mono ${waterUsage < 0 ? 'font-bold text-red-600' : 'text-primary'}`}>{waterUsage.toLocaleString()} m³</td>
                    <td className="px-6 py-3 font-mono text-gray-500">{row.oldElectric.toLocaleString()}</td>
                    <td className="px-6 py-3">
                      <input
                        className={`w-full rounded-md border p-2 font-mono text-sm ${hasWarning ? 'border-red-300' : 'border-gray-200 dark:border-gray-700'} bg-white dark:bg-gray-800`}
                        onChange={(event) => updateRow(row.roomId, 'newElectric', Number(event.target.value))}
                        type="number"
                        value={row.newElectric}
                      />
                    </td>
                    <td className={`px-6 py-3 font-mono ${electricUsage < 0 ? 'font-bold text-red-600' : 'text-primary'}`}>{electricUsage.toLocaleString()} kWh</td>
                  </tr>
                );
              })}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={7}>
                    No occupied rooms were found for the selected building.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col justify-between gap-4 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center">
          <div className="flex gap-8 text-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Water Usage</span>
              <span className="text-lg font-black">{totalWater.toLocaleString()} <span className="text-sm font-medium text-gray-400">m³</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Electric Usage</span>
              <span className="text-lg font-black">{totalElectric.toLocaleString()} <span className="text-sm font-medium text-gray-400">kWh</span></span>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500">{rows.length} room(s) loaded</div>
        </div>
      </div>
    </div>
  );
};

export default ReadingsLive;
