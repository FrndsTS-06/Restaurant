const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide dish name'],
      trim: true,
      maxlength: [120, 'Dish name cannot exceed 120 characters']
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide dish description'],
      trim: true,
      maxlength: [600, 'Description cannot exceed 600 characters']
    },
    category: {
      type: String,
      required: [true, 'Please provide dish category'],
      trim: true
    },
    categoryRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    price: {
      type: Number,
      required: [true, 'Please provide price'],
      min: [0, 'Price must be non-negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price must be non-negative'],
      default: 0
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'
    },
    model3dUrl: {
      type: String,
      trim: true,
      default: ''
    },
    modelPosterUrl: {
      type: String,
      trim: true,
      default: ''
    },
    modelStatus: {
      type: String,
      enum: ['available', 'pending_approval', 'missing_asset', 'in_development'],
      default: 'missing_asset'
    },
    modelAltText: {
      type: String,
      trim: true,
      default: ''
    },
    tags: [{
      type: String,
      trim: true
    }],
    dietary: [{
      type: String,
      enum: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Spicy', 'Nut-Free', 'Halal']
    }],
    allergens: [{
      type: String,
      trim: true
    }],
    ingredients: [{
      type: String,
      trim: true
    }],
    isAvailable: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 4.9,
      min: 1,
      max: 5
    },
    reviewsCount: {
      type: Number,
      default: 0
    },
    prepTimeMinutes: {
      type: Number,
      default: 20,
      min: 1
    },
    calories: {
      type: Number,
      default: 450,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// MongoDB Compound & Text Indexes for fast querying
menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ isArchived: 1, isAvailable: 1, category: 1 });
menuItemSchema.index({ categoryRef: 1 });
menuItemSchema.index({ slug: 1 }, { unique: true, sparse: true });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ rating: -1 });
menuItemSchema.index({ isFeatured: 1 });
menuItemSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Auto-generate slug
menuItemSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
