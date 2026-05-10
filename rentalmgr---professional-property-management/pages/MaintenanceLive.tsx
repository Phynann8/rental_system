import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { MaintenanceTicket, MaintenanceStatus, MaintenancePriority, UpsertMaintenanceRequest, UpdateMaintenanceRequest, Room, Tenant } from '../types';
import { formatRelativeTime } from '../utils/format';

const MaintenanceLive: React.FC = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const data = await api.getMaintenanceTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load maintenance tickets.');
    }
  };

  const fetchLookups = async () => {
    try {
      const [roomsData, tenantsData] = await Promise.all([
        api.getRooms(),
        api.getTenants(),
      ]);
      setRooms(roomsData);
      setTenants(tenantsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchLookups()]);
      setLoading(false);
    };
    void init();
  }, []);

  const handleCreate = () => {
    setEditingTicket(null);
    setShowModal(true);
  };

  const handleManage = (ticket: MaintenanceTicket) => {
    setEditingTicket(ticket);
    setShowModal(true);
  };

  const handleSave = async (data: UpsertMaintenanceRequest | UpdateMaintenanceRequest) => {
    setSaving(true);
    setError(null);
    try {
      if (editingTicket) {
        const updated = await api.updateMaintenanceTicket(editingTicket.id, data as UpdateMaintenanceRequest);
        setTickets(prev => prev.map(t => t.id === updated.id ? updated : t));
      } else {
        const created = await api.createMaintenanceTicket(data as UpsertMaintenanceRequest);
        setTickets(prev => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setError('Failed to save ticket.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.deleteMaintenanceTicket(id);
      setTickets(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete ticket.');
    }
  };

  if (loading) {
    return <div className="p-8">Loading maintenance tickets...</div>;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/20';
      case 'Critical': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      case 'Low': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
      default: return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'InProgress': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'Cancelled': return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800';
      default: return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20';
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maintenance Requests</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track and resolve issues reported in your properties.</p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-dark transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Ticket
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <span className="material-symbols-outlined !text-4xl text-gray-300 dark:text-gray-700 mb-2 block">plumbing</span>
            No maintenance tickets found.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Ticket</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Room / Building</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-200">Priority</th>
                <th className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-200">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-surface-dark">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{t.title}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-1">{t.description}</div>
                    <div className="mt-1 text-[10px] text-gray-400 uppercase tracking-wider">{formatRelativeTime(t.createdAtUtc)}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                    <div>{t.roomNumber}</div>
                    <div className="text-xs text-gray-500">{t.buildingName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getPriorityColor(t.priority)}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleManage(t)}
                        className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
                      >
                        Manage
                      </button>
                      <button 
                        onClick={() => void handleDelete(t.id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <MaintenanceModal 
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          rooms={rooms}
          tenants={tenants}
          ticket={editingTicket}
          saving={saving}
        />
      )}
    </div>
  );
};

interface MaintenanceModalProps {
  ticket: MaintenanceTicket | null;
  rooms: Room[];
  tenants: Tenant[];
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  saving: boolean;
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({ ticket, rooms, tenants, onClose, onSave, saving }) => {
  const isEditing = !!ticket;
  const [roomId, setRoomId] = useState<number>(ticket?.roomId || 0);
  const [tenantId, setTenantId] = useState<number | undefined>(ticket?.tenantId);
  const [title, setTitle] = useState(ticket?.title || '');
  const [description, setDescription] = useState(ticket?.description || '');
  const [priority, setPriority] = useState<MaintenancePriority>(ticket?.priority || 'Medium');
  const [status, setStatus] = useState<MaintenanceStatus>(ticket?.status || 'Open');
  const [assignedTo, setAssignedTo] = useState(ticket?.assignedTo || '');
  const [resolutionNotes, setResolutionNotes] = useState(ticket?.resolutionNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onSave({
        title,
        description,
        priority,
        status,
        assignedTo: assignedTo || undefined,
        resolutionNotes: resolutionNotes || undefined,
      } as UpdateMaintenanceRequest);
    } else {
      onSave({
        roomId,
        tenantId: tenantId || undefined,
        title,
        description,
        priority,
      } as UpsertMaintenanceRequest);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Manage Ticket' : 'Create New Ticket'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {!isEditing && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Room</label>
                <select 
                  required
                  value={roomId}
                  onChange={e => setRoomId(Number(e.target.value))}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Select Room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.id}>{r.roomNumber} ({r.buildingName || 'No Building'})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reported By (Optional)</label>
                <select 
                  value={tenantId || ''}
                  onChange={e => setTenantId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Issue Title</label>
            <input 
              required
              placeholder="e.g. Leaking faucet"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
            <textarea 
              required
              rows={3}
              placeholder="Provide more details about the issue..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Priority</label>
              <select 
                value={priority}
                onChange={e => setPriority(e.target.value as MaintenancePriority)}
                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {isEditing && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <select 
                  value={status}
                  onChange={e => setStatus(e.target.value as MaintenanceStatus)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                >
                  <option value="Open">Open</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {isEditing && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned To</label>
                <input 
                  placeholder="e.g. Plumber Bob"
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              {(status === 'Resolved' || status === 'Cancelled') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resolution Notes</label>
                  <textarea 
                    rows={2}
                    placeholder="What was done to fix it?"
                    value={resolutionNotes}
                    onChange={e => setResolutionNotes(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                  />
                </div>
              )}
            </>
          )}

          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary-dark disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Ticket' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ActivityRow = ({ type, title, description, time }: { type: string; title: string; description: string; time: string }) => {
  return (
    <li className="px-6 py-4 flex gap-4">
      <div className="mt-1">
        <span className="material-symbols-outlined text-gray-400">history</span>
      </div>
      <div>
        <div className="font-semibold text-gray-900 dark:text-white">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
        <div className="mt-1 text-[10px] text-gray-400 uppercase tracking-wider">{time}</div>
      </div>
    </li>
  );
};

export default MaintenanceLive;