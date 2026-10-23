import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  useGetMenuItemsQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useUploadImageMutation,
  useUpload3DModelMutation,
  useUpload3DPosterMutation,
  useDelete3DModelMutation
} from '../../store/api/apiSlice';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Food3DViewer } from '../../components/3d/Food3DViewer';
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Upload,
  Sparkles,
  Archive,
  Eye,
  EyeOff,
  Image as ImageIcon,
  FolderPlus,
  Layers,
  Search,
  Filter,
  AlertTriangle,
  Box,
  FileCheck,
  RotateCcw
} from 'lucide-react';

const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Nut-Free', 'Halal'];

export const AdminMenuPage = () => {
  const [activeTab, setActiveTab] = useState('dishes'); // 'dishes' | 'categories'

  // Dish filters
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSearch, setFilterSearch] = useState('');

  // RTK Query hooks
  const { data: menuData, isLoading: dishesLoading } = useGetMenuItemsQuery({
    includeArchived: 'true',
    limit: 100
  });
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();

  const [createMenuItem, { isLoading: isCreatingDish }] = useCreateMenuItemMutation();
  const [updateMenuItem, { isLoading: isUpdatingDish }] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();

  const [createCategory, { isLoading: isCreatingCategory }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdatingCategory }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();
  const [upload3DModel, { isLoading: isUploading3DModel }] = useUpload3DModelMutation();
  const [upload3DPoster, { isLoading: isUploading3DPoster }] = useUpload3DPosterMutation();
  const [delete3DModel, { isLoading: isDeleting3DModel }] = useDelete3DModelMutation();

  const dishes = Array.isArray(menuData) ? menuData : (menuData?.data || []);
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);

  // Dish Modal state
  const [dishModalOpen, setDishModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [preview3DModalDish, setPreview3DModalDish] = useState(null);
  const [dishFormData, setDishFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    costPrice: '',
    image: '',
    tags: '',
    dietary: [],
    allergens: '',
    ingredients: '',
    prepTimeMinutes: 20,
    calories: 450,
    isAvailable: true,
    isFeatured: false,
    isArchived: false,
    modelStatus: 'missing_asset',
    model3dUrl: '',
    modelPosterUrl: '',
    modelAltText: ''
  });
  const [dishError, setDishError] = useState('');
  const [dishFieldErrors, setDishFieldErrors] = useState({});
  const [uploadFeedback, setUploadFeedback] = useState('');

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    image: '',
    displayOrder: 0
  });
  const [categoryError, setCategoryError] = useState('');
  const [categoryFieldErrors, setCategoryFieldErrors] = useState({});

  // Confirmation modal and inline feedback states (replaces native blocking dialogs)
  const [confirmModal, setConfirmModal] = useState(null);
  const [pageFeedback, setPageFeedback] = useState({ type: '', message: '' });

  // Keyboard navigation & body scroll locking for modals
  useEffect(() => {
    const isAnyModalOpen = dishModalOpen || categoryModalOpen || Boolean(confirmModal) || Boolean(preview3DModalDish);
    if (!isAnyModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (confirmModal) {
          setConfirmModal(null);
        } else if (preview3DModalDish) {
          setPreview3DModalDish(null);
        } else if (dishModalOpen) {
          setDishModalOpen(false);
        } else if (categoryModalOpen) {
          setCategoryModalOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dishModalOpen, categoryModalOpen, confirmModal, preview3DModalDish]);

  // Open Dish Modal for Create
  const handleOpenCreateDish = () => {
    setEditingDish(null);
    setDishFormData({
      name: '',
      description: '',
      category: categories[0]?.name || 'Mains',
      price: '',
      costPrice: '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      tags: '',
      dietary: [],
      allergens: '',
      ingredients: '',
      prepTimeMinutes: 20,
      calories: 450,
      isAvailable: true,
      isFeatured: false,
      isArchived: false,
      modelStatus: 'missing_asset',
      model3dUrl: '',
      modelPosterUrl: '',
      modelAltText: ''
    });
    setDishError('');
    setUploadFeedback('');
    setDishModalOpen(true);
  };

  // Open Dish Modal for Edit
  const handleOpenEditDish = (dish) => {
    setEditingDish(dish);
    setDishFormData({
      name: dish.name || '',
      description: dish.description || '',
      category: dish.category || categories[0]?.name || 'Mains',
      price: dish.price !== undefined ? dish.price : '',
      costPrice: dish.costPrice !== undefined ? dish.costPrice : '',
      image: dish.image || '',
      tags: dish.tags ? dish.tags.join(', ') : '',
      dietary: dish.dietary || [],
      allergens: dish.allergens ? dish.allergens.join(', ') : '',
      ingredients: dish.ingredients ? dish.ingredients.join(', ') : '',
      prepTimeMinutes: dish.prepTimeMinutes || 20,
      calories: dish.calories || 450,
      isAvailable: dish.isAvailable !== undefined ? dish.isAvailable : true,
      isFeatured: Boolean(dish.isFeatured),
      isArchived: Boolean(dish.isArchived),
      modelStatus: dish.modelStatus || 'missing_asset',
      model3dUrl: dish.model3dUrl || '',
      modelPosterUrl: dish.modelPosterUrl || '',
      modelAltText: dish.modelAltText || ''
    });
    setDishError('');
    setUploadFeedback('');
    setDishModalOpen(true);
  };

  // Handle 3D Model File Upload (.glb / .gltf)
  const handleModelFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (ext !== '.glb' && ext !== '.gltf') {
      setDishError('Invalid 3D model format. Only .glb and .gltf files are permitted.');
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setDishError('3D Model size exceeds 30MB limit. Please optimize textures and geometry.');
      return;
    }

    setDishError('');
    setUploadFeedback('Validating and streaming 3D culinary sculpture to atelier storage...');

    const uploadData = new FormData();
    uploadData.append('model3d', file);

    try {
      const response = await upload3DModel(uploadData).unwrap();
      if (response.data?.url) {
        setDishFormData(prev => ({
          ...prev,
          model3dUrl: response.data.url,
          modelStatus: 'available',
          modelAltText: prev.modelAltText || `Interactive 3D presentation of ${prev.name || 'dish'}`
        }));
        setUploadFeedback(`3D Model "${response.data.originalName || file.name}" uploaded and validated successfully!`);
        setTimeout(() => setUploadFeedback(''), 4000);
      }
    } catch (err) {
      setDishError(err.data?.message || err.message || '3D Model upload failed. Please verify file integrity.');
      setUploadFeedback('');
    }
  };

  // Handle 3D Poster Image Upload
  const handlePosterFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setDishError('Invalid poster format. Only JPEG, PNG, WEBP, and AVIF images are permitted.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setDishError('Poster image exceeds 10MB limit.');
      return;
    }

    setDishError('');
    setUploadFeedback('Uploading 3D poster preview...');

    const uploadData = new FormData();
    uploadData.append('poster', file);

    try {
      const response = await upload3DPoster(uploadData).unwrap();
      if (response.data?.url) {
        setDishFormData(prev => ({ ...prev, modelPosterUrl: response.data.url }));
        setUploadFeedback('3D Poster preview uploaded successfully!');
        setTimeout(() => setUploadFeedback(''), 3500);
      }
    } catch (err) {
      setDishError(err.data?.message || err.message || 'Poster upload failed.');
      setUploadFeedback('');
    }
  };

  // Safe Removal of 3D Model
  const handleRemove3DModel = async () => {
    if (!dishFormData.model3dUrl) return;

    const filename = dishFormData.model3dUrl.split('/').pop();
    setDishFormData(prev => ({
      ...prev,
      model3dUrl: '',
      modelStatus: 'missing_asset'
    }));

    if (filename && filename.startsWith('dish-model-')) {
      try {
        await delete3DModel(filename).unwrap();
      } catch (err) {
        console.warn('Could not remove file on server:', err);
      }
    }
    setUploadFeedback('3D model removed. Reverted to verified photography fallback.');
    setTimeout(() => setUploadFeedback(''), 3500);
  };

  // Image File Upload to Cloudinary handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Client-side file type and size validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setDishError('Invalid file type. Only JPEG, PNG, WEBP, and AVIF images are permitted.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setDishError('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setDishError('');
    setUploadFeedback('Uploading high-res image to Cloudinary CDN...');

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await uploadImage(uploadData).unwrap();
      if (response.data?.url) {
        setDishFormData(prev => ({ ...prev, image: response.data.url }));
        setUploadFeedback('Image uploaded to Cloudinary successfully!');
        setTimeout(() => setUploadFeedback(''), 3500);
      }
    } catch (err) {
      setDishError(err.data?.message || err.message || 'Image upload failed. Please verify credentials.');
      setUploadFeedback('');
    }
  };

  // Save Dish (Create or Update)
  const handleSaveDish = async (e) => {
    e.preventDefault();
    setDishError('');
    const errors = {};

    const trimmedName = (dishFormData.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Dish name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Dish name must be at least 2 characters.';
    } else if (trimmedName.length > 120) {
      errors.name = 'Dish name must not exceed 120 characters.';
    }

    const trimmedDesc = (dishFormData.description || '').trim();
    if (!trimmedDesc) {
      errors.description = 'Dish description is required.';
    } else if (trimmedDesc.length < 5) {
      errors.description = 'Description must be at least 5 characters.';
    } else if (trimmedDesc.length > 600) {
      errors.description = 'Description must not exceed 600 characters.';
    }

    if (!dishFormData.category) {
      errors.category = 'Category selection is required.';
    }

    const priceNum = Number(dishFormData.price);
    if (!dishFormData.price || isNaN(priceNum) || priceNum <= 0) {
      errors.price = 'Selling price must be a positive number greater than 0.';
    } else if (priceNum > 10000) {
      errors.price = 'Price cannot exceed ₹10,000.';
    }

    if (dishFormData.costPrice) {
      const costNum = Number(dishFormData.costPrice);
      if (isNaN(costNum) || costNum < 0) {
        errors.costPrice = 'Cost price cannot be negative.';
      } else if (costNum > 10000) {
        errors.costPrice = 'Cost price cannot exceed ₹10,000.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setDishFieldErrors(errors);
      return;
    }
    setDishFieldErrors({});

    const payload = {
      name: trimmedName,
      description: trimmedDesc,
      category: dishFormData.category,
      price: priceNum,
      costPrice: dishFormData.costPrice ? Number(dishFormData.costPrice) : 0,
      image: dishFormData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      tags: dishFormData.tags ? dishFormData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      dietary: dishFormData.dietary,
      allergens: dishFormData.allergens ? dishFormData.allergens.split(',').map(a => a.trim()).filter(Boolean) : [],
      ingredients: dishFormData.ingredients ? dishFormData.ingredients.split(',').map(i => i.trim()).filter(Boolean) : [],
      prepTimeMinutes: Math.max(1, Math.min(300, Number(dishFormData.prepTimeMinutes) || 20)),
      calories: Math.max(0, Math.min(10000, Number(dishFormData.calories) || 450)),
      isAvailable: dishFormData.isAvailable,
      isFeatured: dishFormData.isFeatured,
      isArchived: dishFormData.isArchived,
      modelStatus: dishFormData.modelStatus || 'missing_asset',
      model3dUrl: (dishFormData.model3dUrl || '').trim(),
      modelPosterUrl: (dishFormData.modelPosterUrl || '').trim(),
      modelAltText: (dishFormData.modelAltText || '').trim()
    };

    try {
      if (editingDish) {
        await updateMenuItem({ id: editingDish._id, ...payload }).unwrap();
      } else {
        await createMenuItem(payload).unwrap();
      }
      setDishModalOpen(false);
    } catch (err) {
      setDishError(err.data?.message || err.message || 'Failed to save culinary item.');
    }
  };

  // Toggle Dish Availability
  const handleToggleAvailability = async (dish) => {
    try {
      await updateMenuItem({
        id: dish._id,
        isAvailable: !dish.isAvailable
      }).unwrap();
    } catch (err) {
      alert(`Could not toggle availability: ${err.message}`);
    }
  };

  // Toggle Dish Featured Special
  const handleToggleFeatured = async (dish) => {
    try {
      await updateMenuItem({
        id: dish._id,
        isFeatured: !dish.isFeatured
      }).unwrap();
      setPageFeedback({
        type: 'success',
        message: `Dish "${dish.name}" ${!dish.isFeatured ? 'marked as Chef Special' : 'removed from specials'}.`
      });
      setTimeout(() => setPageFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setPageFeedback({ type: 'error', message: `Could not toggle featured special: ${err.message}` });
    }
  };

  // Toggle Dish Archive Status
  const handleToggleArchive = async (dish) => {
    const nextState = !dish.isArchived;
    if (nextState) {
      setConfirmModal({
        title: 'Archive Culinary Item',
        message: `Archive "${dish.name}"? It will be hidden from customer menus until unarchived.`,
        confirmText: 'Archive Item',
        danger: false,
        onConfirm: async () => {
          try {
            await updateMenuItem({
              id: dish._id,
              isArchived: true
            }).unwrap();
            setPageFeedback({ type: 'success', message: `Dish "${dish.name}" archived.` });
            setTimeout(() => setPageFeedback({ type: '', message: '' }), 3500);
          } catch (err) {
            setPageFeedback({ type: 'error', message: `Could not update archive state: ${err.message}` });
          }
        }
      });
      return;
    }
    try {
      await updateMenuItem({
        id: dish._id,
        isArchived: false
      }).unwrap();
      setPageFeedback({ type: 'success', message: `Dish "${dish.name}" unarchived and active on menu.` });
      setTimeout(() => setPageFeedback({ type: '', message: '' }), 3500);
    } catch (err) {
      setPageFeedback({ type: 'error', message: `Could not update archive state: ${err.message}` });
    }
  };

  // Delete Dish Permanently
  const handleDeleteDish = (dish) => {
    setConfirmModal({
      title: 'Permanently Delete Culinary Item',
      message: `Are you sure you want to permanently delete "${dish.name}"? This action cannot be undone.`,
      confirmText: 'Delete Dish',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteMenuItem(dish._id).unwrap();
          setPageFeedback({ type: 'success', message: `Dish "${dish.name}" permanently deleted.` });
          setTimeout(() => setPageFeedback({ type: '', message: '' }), 3500);
        } catch (err) {
          setPageFeedback({ type: 'error', message: `Could not delete item: ${err.message}` });
        }
      }
    });
  };

  // Category Management Handlers
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      displayOrder: categories.length + 1
    });
    setCategoryError('');
    setCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      displayOrder: cat.displayOrder || 0
    });
    setCategoryError('');
    setCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    const errors = {};

    const trimmedName = (categoryFormData.name || '').trim();
    if (!trimmedName) {
      errors.name = 'Category name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Category name must be at least 2 characters.';
    } else if (trimmedName.length > 60) {
      errors.name = 'Category name must not exceed 60 characters.';
    }

    if (categoryFormData.description && categoryFormData.description.length > 300) {
      errors.description = 'Description must not exceed 300 characters.';
    }

    const orderNum = Number(categoryFormData.displayOrder);
    if (isNaN(orderNum) || orderNum < 0) {
      errors.displayOrder = 'Display order must be a non-negative number.';
    }

    if (Object.keys(errors).length > 0) {
      setCategoryFieldErrors(errors);
      return;
    }
    setCategoryFieldErrors({});

    const payload = {
      name: trimmedName,
      description: (categoryFormData.description || '').trim(),
      image: categoryFormData.image || '',
      displayOrder: orderNum || 0
    };

    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory._id, ...payload }).unwrap();
      } else {
        await createCategory(payload).unwrap();
      }
      setCategoryModalOpen(false);
    } catch (err) {
      setCategoryError(err.data?.message || err.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = (cat) => {
    setConfirmModal({
      title: 'Delete Menu Category',
      message: `Delete category "${cat.name}"? Dishes referencing it will remain in the database.`,
      confirmText: 'Delete Category',
      danger: true,
      onConfirm: async () => {
        try {
          await deleteCategory(cat._id).unwrap();
          setPageFeedback({ type: 'success', message: `Category "${cat.name}" removed.` });
          setTimeout(() => setPageFeedback({ type: '', message: '' }), 3500);
        } catch (err) {
          setPageFeedback({ type: 'error', message: `Could not delete category: ${err.message}` });
        }
      }
    });
  };

  // Filtered dishes for display
  const displayedDishes = dishes.filter((dish) => {
    const matchesCategory = filterCategory === 'All' || dish.category === filterCategory;
    const matchesSearch =
      !filterSearch ||
      dish.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
      dish.description.toLowerCase().includes(filterSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="admin-menu-page animate-fade-in" style={{ padding: '2rem' }}>
      {/* Page Title & Navigation Tabs */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 className="heading-md" style={{ marginBottom: '0.25rem' }}>
            Menu & Food Atelier Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Database-backed culinary repertoire, category taxonomy, pricing, and Cloudinary media controls.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {activeTab === 'dishes' ? (
            <Button
              id="admin-add-dish-btn"
              onClick={handleOpenCreateDish}
              icon={<Plus size={16} />}
            >
              Add New Dish
            </Button>
          ) : (
            <Button
              id="admin-add-category-btn"
              onClick={handleOpenCreateCategory}
              icon={<FolderPlus size={16} />}
            >
              Add New Category
            </Button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {pageFeedback.message && (
        <div style={{
          padding: '0.875rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.875rem',
          backgroundColor: pageFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: pageFeedback.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
          color: pageFeedback.type === 'error' ? '#fca5a5' : '#6ee7b7'
        }}>
          {pageFeedback.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{pageFeedback.message}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          onClick={() => setActiveTab('dishes')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'dishes' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            color: activeTab === 'dishes' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <Layers size={18} /> Culinary Dishes ({dishes.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'categories' ? '2px solid var(--accent-gold)' : '2px solid transparent',
            color: activeTab === 'categories' ? 'var(--accent-gold)' : 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem'
          }}
        >
          <FolderPlus size={18} /> Categories Taxonomy ({categories.length})
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DISHES MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'dishes' && (
        <div>
          {/* Filter Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: '1 1 280px' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search dishes by name or description..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="form-input"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem', width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--accent-gold)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="form-input"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.875rem' }}
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dishes Table */}
          {dishesLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <LoadingSpinner size="lg" />
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Retrieving dishes from database...</p>
            </div>
          ) : displayedDishes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No dishes found matching filter criteria.</p>
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem' }}>DISH</th>
                    <th style={{ padding: '1rem' }}>CATEGORY</th>
                    <th style={{ padding: '1rem' }}>PRICE</th>
                    <th style={{ padding: '1rem' }}>3D ASSET</th>
                    <th style={{ padding: '1rem' }}>STATUS</th>
                    <th style={{ padding: '1rem' }}>SPECIAL</th>
                    <th style={{ padding: '1rem' }}>ARCHIVED</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDishes.map((dish) => (
                    <tr
                      key={dish._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        opacity: dish.isArchived ? 0.6 : 1,
                        backgroundColor: dish.isArchived ? 'rgba(0,0,0,0.2)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <img
                          src={dish.image}
                          alt={dish.name}
                          loading="lazy"
                          decoding="async"
                          width="48"
                          height="48"
                          style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{dish.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dish.description}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{dish.category}</span>
                      </td>

                      <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>
                        {formatPrice(dish.price)}
                      </td>

                      {/* 3D Asset Status & Quick Preview */}
                      <td style={{ padding: '1rem' }}>
                        {dish.modelStatus === 'available' && dish.model3dUrl ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              className="badge badge-gold"
                              style={{
                                fontSize: '0.7rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                backgroundColor: 'rgba(230, 175, 93, 0.2)',
                                border: '1px solid var(--accent-gold)'
                              }}
                            >
                              <Box size={11} /> 3D Live
                            </span>
                            <button
                              id={`preview-3d-btn-${dish._id}`}
                              type="button"
                              onClick={() => setPreview3DModalDish(dish)}
                              title={`Preview 3D model of ${dish.name}`}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                padding: '3px 6px',
                                color: '#e2e8f0',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Eye size={11} /> Preview
                            </button>
                          </div>
                        ) : dish.modelStatus === 'pending_approval' ? (
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            Pending Review
                          </span>
                        ) : dish.modelStatus === 'in_development' ? (
                          <span className="badge badge-info" style={{ fontSize: '0.7rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                            In Atelier Dev
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            No 3D Model
                          </span>
                        )}
                      </td>

                      {/* Availability Toggle */}
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => handleToggleAvailability(dish)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.3rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: dish.isAvailable ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: dish.isAvailable ? '#34d399' : '#f43f5e'
                          }}
                        >
                          {dish.isAvailable ? <Check size={12} /> : <X size={12} />}
                          {dish.isAvailable ? 'Available' : 'Sold Out'}
                        </button>
                      </td>

                      {/* Featured Special Toggle */}
                      <td style={{ padding: '1rem' }}>
                        <button
                          onClick={() => handleToggleFeatured(dish)}
                          title="Toggle Chef Special featured banner"
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: dish.isFeatured ? 'var(--accent-gold)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          <Sparkles size={16} />
                          {dish.isFeatured ? 'Featured' : 'Standard'}
                        </button>
                      </td>

                      {/* Archive Status */}
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontSize: '0.75rem', color: dish.isArchived ? '#f43f5e' : 'var(--text-muted)' }}>
                          {dish.isArchived ? 'Archived' : 'Active'}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            id={`edit-dish-btn-${dish._id}`}
                            onClick={() => handleOpenEditDish(dish)}
                            title="Edit dish"
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                          >
                            <Edit3 size={15} />
                          </button>

                          <button
                            onClick={() => handleToggleArchive(dish)}
                            title={dish.isArchived ? 'Unarchive dish' : 'Archive dish'}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              color: dish.isArchived ? '#38bdf8' : 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            <Archive size={15} />
                          </button>

                          <button
                            id={`delete-dish-btn-${dish._id}`}
                            onClick={() => handleDeleteDish(dish)}
                            title="Delete dish permanently"
                            style={{
                              background: 'rgba(244, 63, 94, 0.1)',
                              border: '1px solid rgba(244, 63, 94, 0.25)',
                              padding: '0.4rem',
                              borderRadius: 'var(--radius-sm)',
                              color: '#f43f5e',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CATEGORIES TAXONOMY MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div>
          {categoriesLoading ? (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
              <LoadingSpinner size="lg" />
              <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Retrieving categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No categories configured in atelier database.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
              gap: '1.5rem'
            }}>
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className="glass-panel"
                  style={{
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                          {cat.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontFamily: 'monospace' }}>
                          slug: {cat.slug}
                        </span>
                      </div>
                      <Badge variant="neutral">Order #{cat.displayOrder || 0}</Badge>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleOpenEditCategory(cat)}
                      icon={<Edit3 size={14} />}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(cat)}
                      style={{ color: '#f43f5e' }}
                      icon={<Trash2 size={14} />}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DISH CREATE / EDIT */}
      {/* ========================================================= */}
      {dishModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingDish ? `Edit ${editingDish.name}` : 'Add New Culinary Creation'}
          onClick={(e) => { if (e.target === e.currentTarget) setDishModalOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-panel" style={{
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="heading-sm">
                {editingDish ? `Edit "${editingDish.name}"` : 'Add New Culinary Creation'}
              </h2>
              <button
                onClick={() => setDishModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {dishError && (
              <div style={{
                backgroundColor: 'rgba(255, 99, 71, 0.1)',
                border: '1px solid rgba(255, 99, 71, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: '#ff8a75',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {dishError}
              </div>
            )}

            {uploadFeedback && (
              <div style={{
                backgroundColor: 'rgba(52, 211, 153, 0.1)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: '#34d399',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {uploadFeedback}
              </div>
            )}

            <form onSubmit={handleSaveDish} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="admin-dish-name-input" className="form-label">Dish Name *</label>
                  <input
                    id="admin-dish-name-input"
                    type="text"
                    placeholder="e.g. A5 Miyazaki Wagyu Ribeye"
                    value={dishFormData.name}
                    onChange={(e) => {
                      setDishFormData({ ...dishFormData, name: e.target.value });
                      if (dishFieldErrors.name) setDishFieldErrors(prev => ({ ...prev, name: '' }));
                    }}
                    className="form-input"
                    style={{ borderColor: dishFieldErrors.name ? '#ef4444' : undefined }}
                    aria-invalid={!!dishFieldErrors.name}
                    aria-describedby={dishFieldErrors.name ? 'admin-dish-name-error' : undefined}
                  />
                  {dishFieldErrors.name && (
                    <span id="admin-dish-name-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      {dishFieldErrors.name}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="admin-dish-category-select" className="form-label">Category *</label>
                  <select
                    id="admin-dish-category-select"
                    value={dishFormData.category}
                    onChange={(e) => {
                      setDishFormData({ ...dishFormData, category: e.target.value });
                      if (dishFieldErrors.category) setDishFieldErrors(prev => ({ ...prev, category: '' }));
                    }}
                    className="form-input"
                    style={{ borderColor: dishFieldErrors.category ? '#ef4444' : undefined }}
                  >
                    {categories.map(c => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  {dishFieldErrors.category && (
                    <span role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      {dishFieldErrors.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="admin-dish-description-input" className="form-label">Description *</label>
                <textarea
                  id="admin-dish-description-input"
                  rows={3}
                  placeholder="Detail the course ingredients, flavor profile, and preparation method..."
                  value={dishFormData.description}
                  onChange={(e) => {
                    setDishFormData({ ...dishFormData, description: e.target.value });
                    if (dishFieldErrors.description) setDishFieldErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className="form-input"
                  style={{ width: '100%', resize: 'vertical', borderColor: dishFieldErrors.description ? '#ef4444' : undefined }}
                  aria-invalid={!!dishFieldErrors.description}
                  aria-describedby={dishFieldErrors.description ? 'admin-dish-desc-error' : undefined}
                />
                {dishFieldErrors.description && (
                  <span id="admin-dish-desc-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {dishFieldErrors.description}
                  </span>
                )}
              </div>

              {/* Price & Cost Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="admin-dish-price-input" className="form-label">Selling Price (₹) *</label>
                  <input
                    id="admin-dish-price-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="68.00"
                    value={dishFormData.price}
                    onChange={(e) => {
                      setDishFormData({ ...dishFormData, price: e.target.value });
                      if (dishFieldErrors.price) setDishFieldErrors(prev => ({ ...prev, price: '' }));
                    }}
                    className="form-input"
                    style={{ borderColor: dishFieldErrors.price ? '#ef4444' : undefined }}
                    aria-invalid={!!dishFieldErrors.price}
                    aria-describedby={dishFieldErrors.price ? 'admin-dish-price-error' : undefined}
                  />
                  {dishFieldErrors.price && (
                    <span id="admin-dish-price-error" role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      {dishFieldErrors.price}
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Cost Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="22.50"
                    value={dishFormData.costPrice}
                    onChange={(e) => {
                      setDishFormData({ ...dishFormData, costPrice: e.target.value });
                      if (dishFieldErrors.costPrice) setDishFieldErrors(prev => ({ ...prev, costPrice: '' }));
                    }}
                    className="form-input"
                    style={{ borderColor: dishFieldErrors.costPrice ? '#ef4444' : undefined }}
                  />
                  {dishFieldErrors.costPrice && (
                    <span role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                      {dishFieldErrors.costPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Ingredients & Allergens */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Ingredients (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Wagyu beef, black truffle, sea salt"
                    value={dishFormData.ingredients}
                    onChange={(e) => setDishFormData({ ...dishFormData, ingredients: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Allergens (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Dairy, Soy, Nuts"
                    value={dishFormData.allergens}
                    onChange={(e) => setDishFormData({ ...dishFormData, allergens: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Dietary Preferences Checkboxes */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.4rem' }}>Dietary Preferences</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {DIETARY_OPTIONS.map((tag) => {
                    const isChecked = dishFormData.dietary.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => {
                          if (isChecked) {
                            setDishFormData({ ...dishFormData, dietary: dishFormData.dietary.filter(t => t !== tag) });
                          } else {
                            setDishFormData({ ...dishFormData, dietary: [...dishFormData.dietary, tag] });
                          }
                        }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: isChecked ? 'var(--accent-gold)' : 'var(--border-subtle)',
                          backgroundColor: isChecked ? 'rgba(230, 175, 93, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isChecked ? 'var(--accent-gold)' : 'var(--text-secondary)'
                        }}
                      >
                        {isChecked ? '✓ ' : '+ '}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cloudinary Image Upload & URL */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Dish Image (Cloudinary Upload or CDN URL)</label>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={dishFormData.image}
                    onChange={(e) => setDishFormData({ ...dishFormData, image: e.target.value })}
                    className="form-input"
                    style={{ flex: 1 }}
                  />

                  {/* Cloudinary File Input */}
                  <label
                    style={{
                      padding: '0.65rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(230, 175, 93, 0.15)',
                      border: '1px solid var(--accent-gold)',
                      color: 'var(--accent-gold)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Upload size={14} />
                    {isUploadingImage ? 'Uploading...' : 'Upload File'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      disabled={isUploadingImage}
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* Image Preview */}
              {dishFormData.image && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
                  <img
                    src={dishFormData.image}
                    alt="Dish Image Preview"
                    loading="lazy"
                    decoding="async"
                    width="64"
                    height="64"
                    style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Image preview. Validated for high-definition desktop and mobile views.
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3D Model & Interactive Asset Management (Phase 6) */}
              {/* ========================================================= */}
              <div style={{
                padding: '1.25rem',
                backgroundColor: 'rgba(230, 175, 93, 0.05)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(230, 175, 93, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(230, 175, 93, 0.2)', paddingBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Box size={18} color="var(--accent-gold)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      3D Food Asset Management & Verification
                    </span>
                  </div>
                  {dishFormData.model3dUrl && (
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Sparkles size={10} /> Model Configured
                    </span>
                  )}
                </div>

                {/* Model Publication Status Dropdown */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-3d-model-status" className="form-label">Publication Status</label>
                    <select
                      id="admin-3d-model-status"
                      value={dishFormData.modelStatus}
                      onChange={(e) => setDishFormData({ ...dishFormData, modelStatus: e.target.value })}
                      className="form-input"
                    >
                      <option value="available">Available (Live Interactive 3D on Cards)</option>
                      <option value="pending_approval">Pending Studio Approval (Static Fallback)</option>
                      <option value="in_development">In Atelier Development (Static Fallback)</option>
                      <option value="missing_asset">Missing Asset (2D Photography Fallback)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="admin-3d-alt-text" className="form-label">Accessibility Alt Description</label>
                    <input
                      id="admin-3d-alt-text"
                      type="text"
                      placeholder="e.g. 360-degree interactive scan of A5 Miyazaki Wagyu..."
                      value={dishFormData.modelAltText}
                      onChange={(e) => setDishFormData({ ...dishFormData, modelAltText: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* 3D Model (.glb / .gltf) Upload & Actions */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="admin-3d-model-url-input" className="form-label">
                    3D Model (.glb / .gltf) URL or Upload
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      id="admin-3d-model-url-input"
                      type="text"
                      placeholder="/models/food/... or https://..."
                      value={dishFormData.model3dUrl}
                      onChange={(e) => setDishFormData({ ...dishFormData, model3dUrl: e.target.value })}
                      className="form-input"
                      style={{ flex: 1 }}
                    />

                    {/* Upload Model Button */}
                    <label
                      id="admin-upload-3d-model-btn"
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(230, 175, 93, 0.15)',
                        border: '1px solid var(--accent-gold)',
                        color: 'var(--accent-gold)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: isUploading3DModel ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap'
                      }}
                      title="Upload GLB or GLTF 3D model (Max 30MB)"
                    >
                      <Upload size={14} />
                      {isUploading3DModel ? 'Validating...' : dishFormData.model3dUrl ? 'Replace 3D' : 'Upload 3D'}
                      <input
                        type="file"
                        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                        disabled={isUploading3DModel}
                        onChange={handleModelFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {/* Remove 3D Model Button */}
                    {dishFormData.model3dUrl && (
                      <button
                        type="button"
                        id="admin-remove-3d-model-btn"
                        onClick={handleRemove3DModel}
                        title="Safely remove 3D model asset"
                        style={{
                          padding: '0.65rem 0.85rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(244, 63, 94, 0.1)',
                          border: '1px solid rgba(244, 63, 94, 0.3)',
                          color: '#f43f5e',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Trash2 size={13} />
                        Remove 3D
                      </button>
                    )}
                  </div>
                </div>

                {/* 3D Poster / Static Preview Image Upload */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="admin-3d-poster-url-input" className="form-label">
                    3D Poster Preview Image (High-Res Static Fallback)
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      id="admin-3d-poster-url-input"
                      type="text"
                      placeholder="https://... or /uploads/posters/..."
                      value={dishFormData.modelPosterUrl}
                      onChange={(e) => setDishFormData({ ...dishFormData, modelPosterUrl: e.target.value })}
                      className="form-input"
                      style={{ flex: 1 }}
                    />

                    <label
                      id="admin-upload-3d-poster-btn"
                      style={{
                        padding: '0.65rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: isUploading3DPoster ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        whiteSpace: 'nowrap'
                      }}
                      title="Upload static preview image poster for 3D card fallback"
                    >
                      <ImageIcon size={14} />
                      {isUploading3DPoster ? 'Uploading...' : 'Upload Poster'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        disabled={isUploading3DPoster}
                        onChange={handlePosterFileUpload}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>

                {/* Interactive 3D Model Preview Before Saving */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Interactive 3D Model Live Preview
                    </label>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Test 360° rotation, lighting and scale before saving
                    </span>
                  </div>

                  {dishFormData.model3dUrl ? (
                    <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--accent-gold)' }}>
                      <Food3DViewer
                        dish={{
                          ...dishFormData,
                          modelStatus: 'available'
                        }}
                        height="260px"
                        isOpen={dishModalOpen}
                      />
                    </div>
                  ) : (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)'
                    }}>
                      <Box size={28} color="var(--accent-gold)" style={{ margin: '0 auto 0.5rem' }} />
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        No 3D Model Configured
                      </p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Upload a .glb or .gltf file above to preview the interactive 360° sculpture.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles: Availability, Featured, Archived */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '0.75rem 0', borderTop: '1px solid var(--border-subtle)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={dishFormData.isAvailable}
                    onChange={(e) => setDishFormData({ ...dishFormData, isAvailable: e.target.checked })}
                  />
                  Available for Order
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={dishFormData.isFeatured}
                    onChange={(e) => setDishFormData({ ...dishFormData, isFeatured: e.target.checked })}
                  />
                  Featured Special
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={dishFormData.isArchived}
                    onChange={(e) => setDishFormData({ ...dishFormData, isArchived: e.target.checked })}
                  />
                  Archive Dish
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setDishModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  id="admin-save-dish-btn"
                  variant="primary"
                  type="submit"
                  disabled={isCreatingDish || isUpdatingDish}
                >
                  {isCreatingDish || isUpdatingDish ? 'Saving to Database...' : editingDish ? 'Update Dish' : 'Create Dish'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* MODAL: CATEGORY CREATE / EDIT */}
      {/* ========================================================= */}
      {categoryModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingCategory ? `Edit Category ${editingCategory.name}` : 'Create New Category'}
          onClick={(e) => { if (e.target === e.currentTarget) setCategoryModalOpen(false); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 className="heading-sm">
                {editingCategory ? `Edit Category "${editingCategory.name}"` : 'Create New Category'}
              </h2>
              <button
                onClick={() => setCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {categoryError && (
              <div style={{
                backgroundColor: 'rgba(255, 99, 71, 0.1)',
                border: '1px solid rgba(255, 99, 71, 0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: '#ff8a75',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {categoryError}
              </div>
            )}

            <form onSubmit={handleSaveCategory} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Starters, Mains, Caviar Selection"
                  value={categoryFormData.name}
                  onChange={(e) => {
                    setCategoryFormData({ ...categoryFormData, name: e.target.value });
                    if (categoryFieldErrors.name) setCategoryFieldErrors(prev => ({ ...prev, name: '' }));
                  }}
                  className="form-input"
                  style={{ borderColor: categoryFieldErrors.name ? '#ef4444' : undefined }}
                  aria-invalid={!!categoryFieldErrors.name}
                />
                {categoryFieldErrors.name && (
                  <span role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {categoryFieldErrors.name}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  placeholder="Artisan appetizers to awaken the palate..."
                  value={categoryFormData.description}
                  onChange={(e) => {
                    setCategoryFormData({ ...categoryFormData, description: e.target.value });
                    if (categoryFieldErrors.description) setCategoryFieldErrors(prev => ({ ...prev, description: '' }));
                  }}
                  className="form-input"
                  style={{ width: '100%', resize: 'vertical', borderColor: categoryFieldErrors.description ? '#ef4444' : undefined }}
                />
                {categoryFieldErrors.description && (
                  <span role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {categoryFieldErrors.description}
                  </span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={categoryFormData.displayOrder}
                  onChange={(e) => {
                    setCategoryFormData({ ...categoryFormData, displayOrder: e.target.value });
                    if (categoryFieldErrors.displayOrder) setCategoryFieldErrors(prev => ({ ...prev, displayOrder: '' }));
                  }}
                  className="form-input"
                  style={{ borderColor: categoryFieldErrors.displayOrder ? '#ef4444' : undefined }}
                />
                {categoryFieldErrors.displayOrder && (
                  <span role="alert" style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem', display: 'block' }}>
                    {categoryFieldErrors.displayOrder}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant="secondary" type="button" onClick={() => setCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isCreatingCategory || isUpdatingCategory}
                >
                  {isCreatingCategory || isUpdatingCategory ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* CONFIRMATION MODAL (Replaces native blocking window.confirm) */}
      {/* ========================================================= */}
      {confirmModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={confirmModal.title}
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmModal(null); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3500,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--bg-surface)',
            border: confirmModal.danger ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} style={{ color: confirmModal.danger ? '#ef4444' : 'var(--accent-gold)' }} />
              <h2 className="heading-sm" style={{ margin: 0 }}>{confirmModal.title}</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {confirmModal.message}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmModal(null)}
              >
                Cancel
              </Button>
              <Button
                id="admin-confirm-action-btn"
                variant={confirmModal.danger ? 'danger' : 'primary'}
                size="sm"
                onClick={() => {
                  const cb = confirmModal.onConfirm;
                  setConfirmModal(null);
                  if (cb) cb();
                }}
              >
                {confirmModal.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================= */}
      {/* QUICK 3D PREVIEW MODAL (From Admin Table) */}
      {/* ========================================================= */}
      {preview3DModalDish && createPortal(
        <div
          id="admin-quick-3d-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`3D Model Preview for ${preview3DModalDish.name}`}
          onClick={(e) => { if (e.target === e.currentTarget) setPreview3DModalDish(null); }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3500,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div className="glass-panel" style={{
            maxWidth: '560px',
            width: '100%',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative'
          }}>
            <div style={{ position: 'relative' }}>
              <Food3DViewer dish={preview3DModalDish} height="320px" isOpen={true} />
              <button
                id="close-quick-3d-modal-btn"
                onClick={() => setPreview3DModalDish(null)}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  zIndex: 30,
                  background: 'rgba(0, 0, 0, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  {preview3DModalDish.name}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>
                  {preview3DModalDish.category} • {formatPrice(preview3DModalDish.price)}
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setPreview3DModalDish(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
