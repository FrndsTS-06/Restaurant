import React, { useState } from 'react';
import {
  useGetAdminStaffQuery,
  useCreateAdminStaffMutation,
  useUpdateAdminStaffMutation,
  useDeleteAdminStaffMutation
} from '../../store/api/apiSlice';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  X,
  UserPlus,
  Key,
  Shield,
  ChefHat,
  User,
  Phone,
  Mail,
  Check,
  AlertCircle
} from 'lucide-react';

const PERMISSION_OPTIONS = [
  { id: 'orders', label: 'Orders & Dispatch', desc: 'Accept, prepare, and complete customer tickets' },
  { id: 'reservations', label: 'Table Reservations', desc: 'Seat guests, allocate tables, manage booking concierge' },
  { id: 'menu', label: 'Culinary Menu', desc: 'Create dishes, adjust daily pricing, manage sold-out items' },
  { id: 'reports', label: 'Business Reports', desc: 'Access and download revenue and audit reports' }
];

export const AdminStaffPage = () => {
  const { user: currentAdmin } = useAuth();
  const { data: resData, isLoading, refetch } = useGetAdminStaffQuery();

  const [createStaff, { isLoading: isCreating }] = useCreateAdminStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateAdminStaffMutation();
  const [deleteStaff, { isLoading: isDeleting }] = useDeleteAdminStaffMutation();

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: ['orders', 'reservations'],
    phone: ''
  });

  // Edit modal
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'staff',
    permissions: [],
    isActive: true,
    phone: ''
  });

  const staffMembers = resData?.data || [];

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name || '',
      role: staff.role || 'staff',
      permissions: staff.permissions || ['orders', 'reservations'],
      isActive: staff.isActive !== false,
      phone: staff.phone || ''
    });
  };

  const togglePermission = (permId, isEdit = false) => {
    if (isEdit) {
      setEditForm(prev => {
        const has = prev.permissions.includes(permId);
        return {
          ...prev,
          permissions: has
            ? prev.permissions.filter(p => p !== permId)
            : [...prev.permissions, permId]
        };
      });
    } else {
      setCreateForm(prev => {
        const has = prev.permissions.includes(permId);
        return {
          ...prev,
          permissions: has
            ? prev.permissions.filter(p => p !== permId)
            : [...prev.permissions, permId]
        };
      });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.name || !createForm.email || !createForm.password) {
      return alert('Name, email, and temporary password are required');
    }

    try {
      await createStaff(createForm).unwrap();
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: ['orders', 'reservations'],
        phone: ''
      });
      refetch();
    } catch (err) {
      alert(`Error provisioning staff: ${err?.data?.message || err.message}`);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    try {
      await updateStaff({
        id: editingStaff._id,
        ...editForm
      }).unwrap();
      setEditingStaff(null);
      refetch();
    } catch (err) {
      alert(`Error updating staff permissions: ${err?.data?.message || err.message}`);
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (staff._id === currentAdmin?.id) {
      return alert('You cannot delete your own logged-in administrator account.');
    }

    if (!window.confirm(`Are you sure you want to permanently revoke credentials and delete staff account for ${staff.name}?`)) {
      return;
    }

    try {
      await deleteStaff(staff._id).unwrap();
      refetch();
    } catch (err) {
      alert(`Could not delete staff account: ${err?.data?.message || err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving staff personnel and access permissions..." />;
  }

  return (
    <div className="admin-staff-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Staff Personnel & Roles
          </h1>
          <p className="text-slate-400 text-sm">
            Provision restaurant staff, configure module permissions, and audit access credentials.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} variant="primary" size="sm" className="flex items-center gap-2">
          <UserPlus size={16} /> Provision Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staffMembers.map((staff) => {
          const isMe = staff._id === currentAdmin?.id;
          return (
            <div
              key={staff._id}
              className={`glass-panel p-5 rounded-2xl flex flex-col justify-between border transition-all ${
                isMe ? 'border-amber-400/40 bg-amber-400/[0.03]' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold">
                      {staff.role === 'admin' ? (
                        <Shield size={20} />
                      ) : staff.role === 'chef' ? (
                        <ChefHat size={20} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {staff.name}
                        {isMe && <span className="text-[10px] text-amber-400 font-mono">(You)</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{staff.email}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      staff.role === 'admin'
                        ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                        : staff.role === 'chef'
                        ? 'bg-purple-400/15 text-purple-300 border border-purple-400/30'
                        : 'bg-blue-400/15 text-blue-300 border border-blue-400/30'
                    }`}
                  >
                    {staff.role}
                  </span>
                </div>

                {/* Contact & Status */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Phone size={12} /> {staff.phone || 'No phone'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      staff.isActive !== false ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {staff.isActive !== false ? 'Active' : 'Deactivated'}
                  </span>
                </div>

                {/* Permissions Badges */}
                <div className="space-y-1.5 mb-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Assigned Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {staff.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[10px] font-medium border border-amber-400/20">
                        Full Administrator Access
                      </span>
                    ) : (staff.permissions && staff.permissions.length > 0) ? (
                      staff.permissions.map(p => (
                        <span key={p} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] font-medium border border-slate-800 capitalize">
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No specific permissions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-3 mt-3">
                <button
                  onClick={() => handleOpenEdit(staff)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 size={13} /> Edit Permissions
                </button>
                {!isMe && (
                  <button
                    onClick={() => handleDeleteStaff(staff)}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete account"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE STAFF MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-amber-400" />
                Provision Staff Personnel
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Laurent Vautrin"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="staff@savoria.com"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Role Type</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="staff">Staff (Front-of-house / Floor Maître D)</option>
                  <option value="chef">Chef (Kitchen Kitchen Staff)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>

              {/* Permissions checklist */}
              {createForm.role !== 'admin' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold block">Module Permissions</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map(opt => {
                      const checked = createForm.permissions.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => togglePermission(opt.id, false)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            checked
                              ? 'bg-amber-400/10 border-amber-400/40 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                              checked ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600'
                            }`}
                          >
                            {checked && <Check size={12} />}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{opt.label}</div>
                            <div className="text-[10px] text-slate-400">{opt.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button onClick={() => setIsCreateModalOpen(false)} variant="secondary" size="sm" type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isCreating}>
                  {isCreating ? 'Provisioning...' : 'Confirm Account Provisioning'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STAFF MODAL */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                Edit Permissions: {editingStaff.name}
              </h3>
              <button
                onClick={() => setEditingStaff(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="staff">Staff</option>
                    <option value="chef">Chef</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Account State</label>
                  <select
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="true">Active & Authorized</option>
                    <option value="false">Deactivated</option>
                  </select>
                </div>
              </div>

              {/* Permissions checklist */}
              {editForm.role !== 'admin' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-semibold block">Configured Capabilities</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {PERMISSION_OPTIONS.map(opt => {
                      const checked = editForm.permissions.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          onClick={() => togglePermission(opt.id, true)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                            checked
                              ? 'bg-amber-400/10 border-amber-400/40 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                              checked ? 'bg-amber-400 text-slate-950 font-bold' : 'border border-slate-600'
                            }`}
                          >
                            {checked && <Check size={12} />}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{opt.label}</div>
                            <div className="text-[10px] text-slate-400">{opt.desc}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button onClick={() => setEditingStaff(null)} variant="secondary" size="sm" type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Saving...' : 'Update Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
