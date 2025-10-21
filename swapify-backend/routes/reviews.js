const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews/:userId
// @desc    Get reviews for a user
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;

    const reviews = await Review.find({ reviewee: req.params.userId })
      .populate('reviewer', 'name avatar')
      .populate('post', 'title type category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ reviewee: req.params.userId });

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', auth, [
  body('reviewee').notEmpty().withMessage('Reviewee ID is required'),
  body('post').notEmpty().withMessage('Post ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('type').isIn(['barter', 'paid']).withMessage('Type must be barter or paid'),
  body('categories.communication').optional().isInt({ min: 1, max: 5 }),
  body('categories.quality').optional().isInt({ min: 1, max: 5 }),
  body('categories.timeliness').optional().isInt({ min: 1, max: 5 }),
  body('categories.professionalism').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      reviewee,
      post: postId,
      rating,
      comment,
      type,
      paymentAmount,
      categories
    } = req.body;

    // Check if post exists and user is authorized to review
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author or selected user
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isSelectedUser = post.selectedUser && post.selectedUser.toString() === req.user._id.toString();

    if (!isAuthor && !isSelectedUser) {
      return res.status(403).json({ message: 'Not authorized to review this post' });
    }

    // Check if post is completed
    if (post.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed posts' });
    }

    // Determine who to review
    const reviewTarget = isAuthor ? post.selectedUser : post.author;

    if (reviewTarget.toString() !== reviewee) {
      return res.status(400).json({ message: 'Invalid reviewee' });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({
      reviewer: req.user._id,
      post: postId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this post' });
    }

    // Create review
    const reviewData = {
      reviewer: req.user._id,
      reviewee,
      post: postId,
      rating,
      comment: comment || '',
      type
    };

    if (type === 'paid' && paymentAmount) {
      reviewData.paymentAmount = paymentAmount;
    }

    if (categories) {
      reviewData.categories = categories;
    }

    const review = new Review(reviewData);
    await review.save();

    await review.populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'reviewee', select: 'name avatar' },
      { path: 'post', select: 'title type category' }
    ]);

    res.status(201).json({
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reviews/:reviewId
// @desc    Update a review
// @access  Private
router.put('/:reviewId', auth, [
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('comment').optional().trim().isLength({ max: 500 }),
  body('categories.communication').optional().isInt({ min: 1, max: 5 }),
  body('categories.quality').optional().isInt({ min: 1, max: 5 }),
  body('categories.timeliness').optional().isInt({ min: 1, max: 5 }),
  body('categories.professionalism').optional().isInt({ min: 1, max: 5 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const allowedUpdates = ['rating', 'comment', 'categories', 'paymentAmount'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.reviewId,
      updates,
      { new: true, runValidators: true }
    ).populate([
      { path: 'reviewer', select: 'name avatar' },
      { path: 'reviewee', select: 'name avatar' },
      { path: 'post', select: 'title type category' }
    ]);

    res.json({
      message: 'Review updated successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:reviewId
// @desc    Delete a review
// @access  Private
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reviews/stats/:userId
// @desc    Get review statistics for a user
// @access  Public
router.get('/stats/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.userId });

    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      },
      categoryAverages: {}
    };

    // Calculate category averages if available
    const reviewsWithCategories = reviews.filter(r => r.categories);
    if (reviewsWithCategories.length > 0) {
      const categories = ['communication', 'quality', 'timeliness', 'professionalism'];
      categories.forEach(category => {
        const categoryReviews = reviewsWithCategories.filter(r => r.categories[category]);
        if (categoryReviews.length > 0) {
          stats.categoryAverages[category] = 
            categoryReviews.reduce((sum, r) => sum + r.categories[category], 0) / categoryReviews.length;
        }
      });
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
