const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Review = require('../models/Review');
const Chat = require('../models/Chat');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth);
router.use(adminAuth);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalReviews,
      totalChats,
      activeUsers,
      completedPosts,
      recentUsers,
      recentPosts
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Review.countDocuments(),
      Chat.countDocuments(),
      User.countDocuments({ isActive: true }),
      Post.countDocuments({ status: 'completed' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      Post.find().sort({ createdAt: -1 }).limit(5).populate('author', 'name')
    ]);

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      posts: {
        total: totalPosts,
        completed: completedPosts,
        completionRate: totalPosts > 0 ? (completedPosts / totalPosts) * 100 : 0
      },
      reviews: {
        total: totalReviews
      },
      chats: {
        total: totalChats
      },
      recent: {
        users: recentUsers,
        posts: recentPosts
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { limit = 20, page = 1, search, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:userId/status
// @desc    Update user status (active/inactive)
// @access  Private (Admin only)
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.userId;

    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot change your own status' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: status === 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/posts
// @desc    Get all posts with pagination
// @access  Private (Admin only)
router.get('/posts', async (req, res) => {
  try {
    const { limit = 20, page = 1, status, type, category } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (category) query.category = category;

    const posts = await Post.find(query)
      .populate('author', 'name email')
      .populate('selectedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/posts/:postId
// @desc    Delete a post (admin)
// @access  Private (Admin only)
router.delete('/posts/:postId', async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Admin delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews with pagination
// @access  Private (Admin only)
router.get('/reviews', async (req, res) => {
  try {
    const { limit = 20, page = 1, rating } = req.query;
    const query = {};

    if (rating) query.rating = parseInt(rating);

    const reviews = await Review.find(query)
      .populate('reviewer', 'name email')
      .populate('reviewee', 'name email')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Admin get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/reviews/:reviewId
// @desc    Delete a review (admin)
// @access  Private (Admin only)
router.delete('/reviews/:reviewId', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Admin delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get platform reports and analytics
// @access  Private (Admin only)
router.get('/reports', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const [
      userGrowth,
      postGrowth,
      categoryStats,
      locationStats,
      topUsers
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Post.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Post.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Post.aggregate([
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      User.find()
        .sort({ completedExchanges: -1, rating: -1 })
        .limit(10)
        .select('name rating completedExchanges badges')
    ]);

    res.json({
      reports: {
        userGrowth,
        postGrowth,
        categoryStats,
        locationStats,
        topUsers
      }
    });
  } catch (error) {
    console.error('Admin reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
