const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email')
      .populate('reviews', 'rating comment createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2, max: 50 }),
  body('bio').optional().isLength({ max: 500 }),
  body('skills').optional().isArray(),
  body('location').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, bio, skills, location, phone } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (skills) updateData.skills = skills;
    if (location) updateData.location = location;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        bio: user.bio,
        location: user.location,
        phone: user.phone,
        rating: user.rating,
        badges: user.badges,
        completedExchanges: user.completedExchanges
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/search
// @desc    Search users by skills or location
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { skills, location, limit = 20, page = 1 } = req.query;
    const query = { isActive: true };

    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password -email')
      .sort({ rating: -1, completedExchanges: -1 })
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
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/suggestions/:postId
// @desc    Get skill-matched user suggestions for a post
// @access  Public
router.get('/suggestions/:postId', async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find users with matching skills
    const matchingUsers = await User.find({
      _id: { $ne: post.author },
      skills: { $in: post.skills },
      isActive: true
    })
    .select('-password -email')
    .sort({ rating: -1 })
    .limit(10);

    res.json({ suggestions: matchingUsers });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/stats/:id
// @desc    Get user statistics
// @access  Public
router.get('/stats/:id', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const Post = require('../models/Post');

    const [reviews, postsCreated, postsCompleted] = await Promise.all([
      Review.find({ reviewee: req.params.id }),
      Post.find({ author: req.params.id }),
      Post.find({ selectedUser: req.params.id, status: 'completed' })
    ]);

    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : 0,
      postsCreated: postsCreated.length,
      postsCompleted: postsCompleted.length,
      completionRate: postsCreated.length > 0 
        ? (postsCompleted.length / postsCreated.length) * 100 
        : 0
    };

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
