import React, { useState, useEffect } from 'react';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useGetMenuItemsQuery
} from '../../store/api/apiSlice';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Tags,
  Plus,
  Edit3,
  Trash2,
  X,
  Layers,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';

export const AdminCategoriesPage = () => {
  const { data: categoriesRes, isLoading, refetch } = useGetCategoriesQuery();
  const { data: menuData } = useGetMenuItemsQuery({ limit: 100 });

  const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);

  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    sortOrder: 0
  });

  // Keyboard navigation: Escape key closes modal
  useEffect(() => {
    const isAnyOpen = isModalOpen || Boolean(confirmModal);
    if (!isAnyOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setConfirmModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, confirmModal]);

  const dishes = Array.isArray(menuData) ? menuData : (menuData?.data || []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFieldErrors({});
    setFormData({
      name: '',
      description: '',
      image: '',
      sortOrder: categories.length + 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFieldErrors({});
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      sortOrder: cat.displayOrder ?? cat.sortOrder ?? 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    const trimmedName = (formData.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Category name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    } else if (trimmedName.length > 60) {
      errors.name = 'Category name must not exceed 60 characters.';
    }

    if (formData.description && formData.description.length > 300) {
      errors.description = 'Description must not exceed 300 characters.';
    }

    const orderNum = parseInt(formData.sortOrder, 10);
    if (isNaN(orderNum) || orderNum < 0) {
      errors.sortOrder = 'Sort order cannot be negative.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    const payload = {
      name: trimmedName,
      description: (formData.description || '').trim(),
      image: (formData.image || '').trim(),
      displayOrder: orderNum || 0,
      sortOrder: orderNum || 0
    };

    try {
      if (editingCategory) {
        await updateCategory({
          id: editingCategory._id,
          ...payload
        }).unwrap();
        setFeedback({ type: 'success', message: `Category "${trimmedName}" updated successfully.` });
      } else {
        await createCategory(payload).unwrap();
        setFeedback({ type: 'success', message: `Category "${trimmedName}" created successfully.` });
      }
      setIsModalOpen(false);
      refetch();
      setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setFeedback({ type: 'error', message: `Error saving category: ${err?.data?.message || err.message}` });
    }
  };

  const handleDelete = (id, name) => {
    setConfirmModal({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${name}"? Dishes in this category may become uncategorized.`,
      confirmText: 'Delete Category',
      onConfirm: async () => {
        try {
          await deleteCategory(id).unwrap();
          refetch();
          setFeedback({ type: 'success', message: `Category "${name}" deleted.` });
          setTimeout(() => setFeedback({ type: '', message: '' }), 3500);
        } catch (err) {
          setFeedback({ type: 'error', message: `Could not delete category: ${err?.data?.message || err.message}` });
        }
      }
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Retrieving culinary categories..." />;
  }

  return (
    <div className="admin-categories-page p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
            Dish Categories
          </h1>
          <p className="text-slate-400 text-sm">
            Organize seasonal menus, tasting flights, and culinary courses.
          </p>
        </div>
        <Button onClick={handleOpenCreate} variant="primary" size="sm" className="flex items-center gap-2">
          <Plus size={16} /> Add Category
        </Button>
      </div>

      {/* Action Notification Banner */}
      {feedback.message && (
        <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
          feedback.type === 'error'
            ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
        }`}>
          {feedback.type === 'error' ? <AlertCircle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Categories Grid or Empty State */}
      {categories.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
          <Tags size={40} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Categories Found</h3>
          <p className="text-slate-400 text-sm mb-4">Organize your culinary courses by creating your first category.</p>
          <Button onClick={handleOpenCreate} variant="primary" size="sm">
            <Plus size={16} /> Add First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat) => {
            const dishCount = dishes.filter(
              d => d.category?.toLowerCase() === cat.name?.toLowerCase() || d.categoryRef === cat._id
            ).length;

            return (
              <div
                key={cat._id}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between border border-slate-800 hover:border-amber-400/30 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400 font-bold">
                      <Tags size={18} />
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                      {dishCount} dish{dishCount === 1 ? '' : 'es'}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                    {cat.description || 'No course description provided.'}
                  </p>

                  {cat.image && (
                    <div className="h-28 w-full rounded-xl overflow-hidden mb-4 border border-slate-800">
                      <img src={cat.image} alt={cat.name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-3 mt-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id, cat.name)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingCategory ? `Edit Category ${editingCategory.name}` : 'Create New Category'}
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-serif font-bold text-white">
                {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
              <div>
                <label htmlFor="cat-name-input" className="text-slate-400 font-semibold block mb-1">Category Name *</label>
                <input
                  id="cat-name-input"
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g., Entrées, Sommelier Reserve, Desserts"
                  className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 ${
                    fieldErrors.name ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                  }`}
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'cat-name-error' : undefined}
                />
                {fieldErrors.name && (
                  <span id="cat-name-error" role="alert" className="text-rose-400 mt-1 block">
                    {fieldErrors.name}
                  </span>
                )}
              </div>

              <div>
                <label htmlFor="cat-desc-input" className="text-slate-400 font-semibold block mb-1">Description</label>
                <textarea
                  id="cat-desc-input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (fieldErrors.description) setFieldErrors(prev => ({ ...prev, description: '' }));
                  }}
                  placeholder="Atmospheric summary of dishes in this section..."
                  className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 ${
                    fieldErrors.description ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                  }`}
                />
                {fieldErrors.description && (
                  <span role="alert" className="text-rose-400 mt-1 block">
                    {fieldErrors.description}
                  </span>
                )}
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label htmlFor="cat-sort-input" className="text-slate-400 font-semibold block mb-1">Display Sort Order</label>
                <input
                  id="cat-sort-input"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => {
                    setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 });
                    if (fieldErrors.sortOrder) setFieldErrors(prev => ({ ...prev, sortOrder: '' }));
                  }}
                  className={`w-full p-2.5 rounded-xl bg-slate-900 border text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 ${
                    fieldErrors.sortOrder ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-800'
                  }`}
                />
                {fieldErrors.sortOrder && (
                  <span role="alert" className="text-rose-400 mt-1 block">
                    {fieldErrors.sortOrder}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <Button onClick={() => setIsModalOpen(false)} variant="secondary" size="sm" type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmModal.title}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-rose-500/30 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertCircle size={24} />
              <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-300">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button onClick={() => setConfirmModal(null)} variant="secondary" size="sm">
                Cancel
              </Button>
              <Button
                id="admin-confirm-category-delete-btn"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (cb) cb();
                }}
                variant="danger"
                size="sm"
              >
                {confirmModal.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
