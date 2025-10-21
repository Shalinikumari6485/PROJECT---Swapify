const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    default: ''
  },
  type: {
    type: String,
    enum: ['barter', 'paid'],
    required: true
  },
  // For paid gigs
  paymentAmount: {
    type: Number,
    min: 0
  },
  // Review categories
  categories: {
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    quality: {
      type: Number,
      min: 1,
      max: 5
    },
    timeliness: {
      type: Number,
      min: 1,
      max: 5
    },
    professionalism: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Ensure one review per user per post
reviewSchema.index({ reviewer: 1, post: 1 }, { unique: true });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ rating: 1 });

// Update user rating when review is created
reviewSchema.post('save', async function() {
  const User = mongoose.model('User');
  
  // Calculate new average rating for reviewee
  const reviews = await mongoose.model('Review').find({ reviewee: this.reviewee });
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await User.findByIdAndUpdate(this.reviewee, {
    rating: Math.round(averageRating * 10) / 10,
    totalRatings: reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);
