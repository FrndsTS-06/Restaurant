import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGetMenuItemsQuery, useGetCategoriesQuery } from '../../store/api/apiSlice';
import { formatPrice } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useCart } from '../../hooks/useCart';
import { Search, Utensils, Info, Check, Filter, AlertTriangle, Sparkles, X, ArrowUpDown, Box, ZoomIn } from 'lucide-react';
import { Food3DCard } from '../../components/3d/Food3DCard';
import { Food3DViewer } from '../../components/3d/Food3DViewer';
import { ImageZoomModal } from '../../components/common/ImageZoomModal';

const DIETARY_OPTIONS = ['All', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Nut-Free', 'Halal'];

export const MenuPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDietary, setSelectedDietary] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All'); // 'All' | 'true' | 'false'
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'prepTime' | 'name'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [zoomedDish, setZoomedDish] = useState(null);
  const [addedNotification, setAddedNotification] = useState(null);

  const { addToCart } = useCart();

  // Keyboard navigation: Escape closes dish details modal
  useEffect(() => {
    if (!selectedDishModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedDishModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDishModal]);

  // Lock background scroll when dish modal is open
  useEffect(() => {
    if (selectedDishModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedDishModal]);

  // RTK Query: fetch categories from MongoDB
  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery();
  const categories = categoriesData?.data || [];

  // RTK Query: fetch dishes with reactive database filters
  const {
    data: menuResponse,
    isLoading: dishesLoading,
    isFetching: dishesFetching,
    error: menuError
  } = useGetMenuItemsQuery({
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    dietary: selectedDietary !== 'All' ? selectedDietary : undefined,
    isAvailable: selectedAvailability === 'true' ? 'true' : selectedAvailability === 'false' ? 'false' : undefined,
    search: activeSearch || undefined,
    limit: 50
  });

  const dishes = menuResponse?.data || [];

  // Client-side sorting logic
  const sortedDishes = [...dishes].sort((a, b) => {
    if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'prepTime') return (a.prepTimeMinutes || 0) - (b.prepTimeMinutes || 0);
    if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
    // recommended: featured first, then original order
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return 0;
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const handleAddDish = (dish) => {
    if (!dish.isAvailable) return;
    addToCart(dish, 1);
    setAddedNotification(`Added "${dish.name}" to your order.`);
    setTimeout(() => setAddedNotification(null), 3000);
  };

  return (
    <div className="menu-page animate-fade-in pt-20 pb-28 sm:pt-24 sm:pb-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto 3.5rem' }}>
          <Badge variant="gold">Grand Carte & Tasting Menu</Badge>
          <h1 className="heading-xl" style={{ marginTop: '0.75rem', marginBottom: '1rem' }}>
            Seasonal Culinary <span className="gradient-text-gold">Repertoire</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
            Discover our meticulously composed culinary creations. Fresh harvests, wild-caught seafood, and artisan prime cuts sourced with unwavering precision.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <div className="glass-panel" style={{ padding: '2rem 2.25rem', marginBottom: '3.5rem', borderRadius: 'var(--radius-lg)' }}>
          {/* Search Bar & Dropdown Filters */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem'
          }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 1 300px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="menu-search-input"
                  type="text"
                  placeholder="Search dishes by ingredient or name (e.g. Wagyu, Truffle)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.75rem', paddingRight: searchQuery ? '2.5rem' : '1rem' }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Search
              </Button>
            </form>

            {/* Dietary & Availability Dropdowns */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dietary:</span>
                <select
                  id="dietary-filter-select"
                  value={selectedDietary}
                  onChange={(e) => setSelectedDietary(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  {DIETARY_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                <select
                  id="availability-filter-select"
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <option value="All">All Dishes</option>
                  <option value="true">Available Now</option>
                  <option value="false">Sold Out / Seasonal</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowUpDown size={15} color="var(--accent-gold)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort:</span>
                <select
                  id="sort-dishes-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                >
                  <option value="recommended">Featured Repertoire</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="prepTime">Quickest Preparation</option>
                  <option value="name">Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (Dynamically loaded from Database) */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem'
          }}>
            <button
              id="category-pill-all"
              onClick={() => setSelectedCategory('All')}
              className={`filter-pill ${selectedCategory === 'All' ? 'active' : ''}`}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid',
                borderColor: selectedCategory === 'All' ? 'var(--accent-gold)' : 'var(--border-subtle)',
                backgroundColor: selectedCategory === 'All' ? 'rgba(230, 175, 93, 0.15)' : 'transparent',
                color: selectedCategory === 'All' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              All Categories
            </button>

            {categoriesLoading ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>Loading culinary categories...</span>
            ) : (
              categories.map((cat) => (
                <button
                  key={cat._id}
                  id={`category-pill-${cat.slug || cat.name.toLowerCase()}`}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`filter-pill ${selectedCategory === cat.name ? 'active' : ''}`}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: selectedCategory === cat.name ? 'var(--accent-gold)' : 'var(--border-subtle)',
                    backgroundColor: selectedCategory === cat.name ? 'rgba(230, 175, 93, 0.15)' : 'transparent',
                    color: selectedCategory === cat.name ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {cat.name}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Cart Toast Notification */}
        {addedNotification && (
          <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 4000,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--accent-gold)',
            boxShadow: 'var(--shadow-xl)',
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)', padding: '0.35rem', borderRadius: '50%', color: '#34d399' }}>
              <Check size={16} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{addedNotification}</span>
          </div>
        )}

        {/* Menu Items Grid */}
        {dishesLoading ? (
          <div style={{ padding: '6rem 0', textAlign: 'center' }}>
            <LoadingSpinner size="lg" />
            <p style={{ marginTop: '1.25rem', color: 'var(--text-muted)' }}>Summoning our culinary catalogue from the atelier cellar...</p>
          </div>
        ) : menuError ? (
          <div style={{ padding: '4rem 0', textAlign: 'center', color: '#ff8a75' }}>
            <p>Failed to load culinary menu items. Please check backend connectivity.</p>
          </div>
        ) : dishes.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
            <Utensils size={40} color="var(--accent-gold)" style={{ margin: '0 auto 1rem' }} />
            <h3 className="heading-sm" style={{ marginBottom: '0.5rem' }}>No Courses Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              We could not find any culinary selections matching your active criteria.
            </p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDietary('All');
                setSelectedAvailability('All');
                handleClearSearch();
              }}
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '2rem'
          }}>
            {sortedDishes.map((dish) => (
              <Food3DCard
                key={dish._id}
                dish={dish}
                onSelectDish={(selected) => setSelectedDishModal(selected)}
                onAddDish={handleAddDish}
                onView3D={(selected) => setSelectedDishModal(selected)}
                onZoomImage={(selected) => setZoomedDish(selected)}
              />
            ))}
          </div>
        )}

        {/* Comprehensive Modal for Dish Details, Ingredients & Allergens */}
        {selectedDishModal && createPortal(
          <div
            id="dish-detail-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Culinary Details for ${selectedDishModal.name}`}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedDishModal(null);
            }}
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
              maxWidth: '580px',
              width: '100%',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div style={{ position: 'relative' }}>
                <Food3DViewer dish={selectedDishModal} height="320px" isOpen={!!selectedDishModal} />
                <button
                  type="button"
                  id="dish-detail-magnify-photo-btn"
                  onClick={() => setZoomedDish(selectedDishModal)}
                  title="Magnify high-resolution culinary photography"
                  style={{
                    position: 'absolute',
                    bottom: '0.85rem',
                    right: '0.85rem',
                    zIndex: 25,
                    backgroundColor: 'rgba(11, 12, 16, 0.85)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(230, 175, 93, 0.5)',
                    borderRadius: '9999px',
                    padding: '0.4rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#fcd34d',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <ZoomIn size={13} />
                  <span>Zoom Photo</span>
                </button>
                <button
                  id="close-dish-modal-btn"
                  onClick={() => setSelectedDishModal(null)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
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

              <div style={{ padding: '1.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: 'var(--accent-gold)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {selectedDishModal.category}
                  </div>
                  {!selectedDishModal.isAvailable && (
                    <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>Currently Sold Out</span>
                  )}
                </div>

                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0' }}>
                  {selectedDishModal.name}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                  {selectedDishModal.description}
                </p>

                {/* Dietary Tags */}
                {selectedDishModal.dietary && selectedDishModal.dietary.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                    {selectedDishModal.dietary.map(d => (
                      <span key={d} className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Ingredients Section */}
                {selectedDishModal.ingredients && selectedDishModal.ingredients.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                      Ingredients
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {selectedDishModal.ingredients.map(ing => (
                        <span key={ing} style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(255, 255, 255, 0.05)', fontSize: '0.75rem', color: '#e2e8f0' }}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergens Notification */}
                {selectedDishModal.allergens && selectedDishModal.allergens.length > 0 && (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem'
                  }}>
                    <AlertTriangle size={18} color="#f59e0b" />
                    <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                      <strong>Allergen Warning:</strong> Contains {selectedDishModal.allergens.join(', ')}.
                    </div>
                  </div>
                )}

                {/* Nutrition and Metrics */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  padding: '1rem 0',
                  borderTop: '1px solid var(--border-subtle)',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: '1.5rem',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PRICE</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '1.1rem' }}>
                      {formatPrice(selectedDishModal.price)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PREP TIME</div>
                    <div style={{ fontWeight: 600 }}>{selectedDishModal.prepTimeMinutes || 20} mins</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CALORIES</div>
                    <div style={{ fontWeight: 600 }}>{selectedDishModal.calories || 450} kcal</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <Button variant="secondary" onClick={() => setSelectedDishModal(null)}>
                    Close
                  </Button>
                  <Button
                    disabled={!selectedDishModal.isAvailable}
                    onClick={() => {
                      handleAddDish(selectedDishModal);
                      setSelectedDishModal(null);
                    }}
                    icon={<Utensils size={16} />}
                  >
                    {selectedDishModal.isAvailable ? 'Add to Order' : 'Sold Out'}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* High-Resolution Culinary Photography Zoom Lightbox */}
        <ImageZoomModal
          dish={zoomedDish}
          isOpen={!!zoomedDish}
          onClose={() => setZoomedDish(null)}
        />
      </div>
    </div>
  );
};
