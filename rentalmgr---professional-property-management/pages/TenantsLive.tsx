import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import type { Tenant, TenantDocument, TenantStatus, UpsertTenantRequest } from '../types';
import { formatCurrency } from '../utils/format';


const emptyForm: UpsertTenantRequest = {
  name: '',
  phone: '',
  nationalId: '',
  hometown: '',
};

const statuses: TenantStatus[] = ['Active', 'Pending', 'Former'];

const TenantsLive: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<TenantStatus>('Active');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UpsertTenantRequest>(emptyForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [docTenantId, setDocTenantId] = useState<number | null>(null);
  const [docTenantName, setDocTenantName] = useState<string>('');


  const loadTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      setTenants(await api.getTenants());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load tenants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTenants();
  }, []);

  const filteredTenants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tenants.filter((tenant) => {
      const statusMatch = tenant.status === activeStatus;
      const textMatch =
        !query ||
        tenant.name.toLowerCase().includes(query) ||
        tenant.phone.toLowerCase().includes(query) ||
        tenant.room.toLowerCase().includes(query) ||
        tenant.nationalId.toLowerCase().includes(query);

      return statusMatch && textMatch;
    });
  }, [tenants, activeStatus, searchQuery]);

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

  const startEdit = (tenant: Tenant) => {
    setEditingId(tenant.id);
    setForm({
      name: tenant.name,
      phone: tenant.phone,
      nationalId: tenant.nationalId,
      hometown: tenant.hometown,
    });
    setShowForm(true);
  };

  const saveTenant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId === null) {
        const created = await api.createTenant(form);
        setTenants((current) => [created, ...current]);
      } else {
        const updated = await api.updateTenant(editingId, form);
        setTenants((current) => current.map((tenant) => (tenant.id === updated.id ? updated : tenant)));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save tenant.');
    } finally {
      setSaving(false);
    }
  };

  const deleteTenant = async (id: number) => {
    setSaving(true);
    setDeleteError(null);
    try {
      await api.deleteTenant(id);
      setTenants((current) => current.filter((tenant) => tenant.id !== id));
      setDeletingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete tenant.';
      setDeleteError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Tenant Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage profiles, contact information, and lease statuses.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold shadow-sm transition-all dark:bg-surface-dark" onClick={() => void loadTenants()} type="button">
            <span className="material-symbols-outlined text-[20px]">refresh</span> Refresh
          </button>
          <button className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all" onClick={startCreate} type="button">
            <span className="material-symbols-outlined text-[20px]">add</span> Add New Tenant
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {showForm && (
        <form className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark md:grid-cols-2" onSubmit={(event) => void saveTenant(event)}>
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingId === null ? 'Create Tenant' : 'Update Tenant'}</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenants become active once a lease is created from the New Lease workflow.</p>
          </div>
          <Field label="Full name" onChange={(value) => setForm((current) => ({ ...current, name: value }))} required value={form.name} />
          <Field label="Phone" onChange={(value) => setForm((current) => ({ ...current, phone: value }))} value={form.phone} />
          <Field label="National ID" onChange={(value) => setForm((current) => ({ ...current, nationalId: value }))} value={form.nationalId} />
          <Field label="Hometown" onChange={(value) => setForm((current) => ({ ...current, hometown: value }))} value={form.hometown} />
          <div className="md:col-span-2 flex justify-end gap-3">
            <button className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold dark:border-gray-700" onClick={resetForm} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white" disabled={saving} type="submit">
              {saving ? 'Saving...' : editingId === null ? 'Create Tenant' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-surface-dark">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex w-full rounded-lg bg-gray-100 p-1 dark:bg-gray-800 md:w-auto">
            {statuses.map((status) => (
              <button
                className={`rounded-md px-6 py-1.5 text-sm font-bold transition-all ${
                  status === activeStatus ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-gray-500'
                }`}
                key={status}
                onClick={() => setActiveStatus(status)}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
            <input
              className="h-11 w-full rounded-lg border border-gray-200 bg-transparent pl-10 pr-10 text-sm dark:border-gray-700"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tenants..."
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
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-700 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-4">Tenant</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Assigned Room</th>
                <th className="px-6 py-4">Lease Expiry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTenants.map((tenant) => (
                <tr className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50" key={tenant.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100">
                        <img alt={tenant.name} src={tenant.image} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{tenant.name}</p>
                        <p className="text-xs text-gray-500">ID: {tenant.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div>{tenant.phone || 'N/A'}</div>
                    <div className="text-xs text-gray-400">{tenant.nationalId || 'No ID recorded'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {tenant.room}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{tenant.leaseExpiry}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                        tenant.status === 'Active'
                          ? 'border-green-200 bg-green-100 text-green-800'
                          : tenant.status === 'Pending'
                            ? 'border-amber-200 bg-amber-100 text-amber-800'
                            : 'border-gray-200 bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          tenant.status === 'Active'
                            ? 'bg-green-500'
                            : tenant.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-gray-400'
                        }`}
                      ></span>
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-xs font-bold text-blue-600 transition-colors hover:underline"
                        onClick={() => {
                          setDocTenantId(tenant.id);
                          setDocTenantName(tenant.name);
                        }}
                        type="button"
                      >
                        Documents
                      </button>
                      <button className="text-xs font-bold text-primary transition-colors hover:underline" onClick={() => startEdit(tenant)} type="button">
                        Edit profile
                      </button>
                      <button className="text-xs font-bold text-red-600 transition-colors hover:underline" onClick={() => setDeletingId(tenant.id)} type="button">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredTenants.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={6}>
                    No tenants matched the current filters.
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
              Are you sure you want to delete this tenant? This action cannot be undone.
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
                onClick={() => void deleteTenant(deletingId)}
                type="button"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {docTenantId !== null && (
        <TenantDocumentsModal
          onClose={() => setDocTenantId(null)}
          tenantId={docTenantId}
          tenantName={docTenantName}
        />
      )}
    </div>
  );
};

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

const TenantDocumentsModal: React.FC<{
  tenantId: number;
  tenantName: string;
  onClose: () => void;
}> = ({ tenantId, tenantName, onClose }) => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('IDScan');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      setDocuments(await api.getTenantDocuments(tenantId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [tenantId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', uploadTitle || file.name);
      formData.append('type', uploadType);

      await api.uploadTenantDocument(tenantId, formData);
      setUploadTitle('');
      void loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.deleteTenantDocument(tenantId, docId);
      setDocuments((current) => current.filter((d) => d.id !== docId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document.');
    }
  };

  const handleDownload = (docId: number) => {
    window.open(`/api/tenants/${tenantId}/documents/${docId}/download`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-bold">Documents: {tenantName}</h2>
            <p className="text-xs text-gray-500">ID Scan, Contract PDF, and other attachments.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
            <div className="sm:col-span-2 text-xs font-bold uppercase tracking-wider text-gray-500">Upload New Attachment</div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Document Title</label>
              <input
                type="text"
                className="w-full h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-sm"
                placeholder="e.g. Identity Card"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Type</label>
              <select
                className="w-full h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 text-sm"
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="IDScan">ID Card / Passport</option>
                <option value="Contract">Lease Contract</option>
                <option value="Registration">Registration Form</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="relative flex items-center justify-center w-full h-12 border-2 border-dashed border-primary/30 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors">
                <input type="file" className="hidden" onChange={(e) => void handleUpload(e)} disabled={uploading} />
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined">upload_file</span>
                  <span className="text-sm font-bold">{uploading ? 'Uploading...' : 'Choose File to Upload'}</span>
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              Attached Files ({documents.length})
            </h3>
            {loading ? (
              <div className="text-center py-8 text-sm text-gray-500 italic">Loading file list...</div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl text-gray-400 text-sm">
                No documents found for this tenant.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="size-10 bg-white dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-600 text-primary shadow-sm">
                        <span className="material-symbols-outlined">
                          {doc.contentType.includes('pdf') ? 'description' : doc.contentType.includes('image') ? 'image' : 'draft'}
                        </span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{doc.title}</p>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                          {doc.type} • {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                        title="Download"
                      >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                      </button>
                      <button
                        onClick={() => void handleDelete(doc.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-bold"
          >
            Finished
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantsLive;

