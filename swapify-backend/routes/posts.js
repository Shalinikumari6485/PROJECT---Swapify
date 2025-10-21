const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts with filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { 
      type, 
      category, 
      location, 
      skills, 
      budgetMin, 
      budgetMax,
      limit = 20, 
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'open' };

    if (type) query.type = type;
    if (category) query.category = category;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillArray };
    }

    // Budget filtering for paid posts
    if (type === 'paid') {
      const budgetQuery = {};
      if (budgetMin) budgetQuery.$gte = parseInt(budgetMin);
      if (budgetMax) budgetQuery.$lte = parseInt(budgetMax);
      if (Object.keys(budgetQuery).length > 0) {
        query.budget = budgetQuery;
      }
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const posts = await Post.find(query)
      .populate('author', 'name rating badges avatar')
      .sort(sortOptions)
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
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/posts/:id
// @desc    Get single post by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name rating badges avatar bio skills location')
      .populate('interestedUsers.user', 'name rating badges avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5-100 characters'),
  body('description').isLength({ min: 20, max: 1000 }).withMessage('Description must be 20-1000 characters'),
  body('type').isIn(['barter', 'paid']).withMessage('Type must be barter or paid'),
  body('category').isIn([
    'academic', 'design', 'programming', 'writing', 
    'marketing', 'photography', 'music', 'art', 
    'tutoring', 'consulting', 'other'
  ]).withMessage('Invalid category'),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('budget').optional().isNumeric().withMessage('Budget must be a number'),
  body('offeredSkills').optional().isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      type,
      category,
      skills,
      location,
      budget,
      offeredSkills,
      images = []
    } = req.body;

    // Validate budget for paid posts
    if (type === 'paid' && (!budget || budget <= 0)) {
      return res.status(400).json({ message: 'Budget is required for paid posts' });
    }

    // Validate offered skills for barter posts
    if (type === 'barter' && (!offeredSkills || offeredSkills.length === 0)) {
      return res.status(400).json({ message: 'Offered skills are required for barter posts' });
    }

    const postData = {
      title,
      description,
      type,
      category,
      skills,
      location,
      author: req.user._id,
      images
    };

    if (type === 'paid') {
      postData.budget = budget;
      postData.currency = 'INR';
    } else {
      postData.offeredSkills = offeredSkills;
    }

    const post = new Post(postData);
    await post.save();

    await post.populate('author', 'name rating badges avatar');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    if (post.status !== 'open') {
      return res.status(400).json({ message: 'Cannot update closed or in-progress posts' });
    }

    const allowedUpdates = ['title', 'description', 'skills', 'location', 'budget', 'offeredSkills', 'images'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('author', 'name rating badges avatar');

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/interest
// @desc    Express interest in a post
// @access  Private
router.post('/:id/interest', auth, [
  body('message').optional().trim().isLength({ max: 200 })
], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot express interest in your own post' });
    }

    if (post.status !== 'open') {
      return res.status(400).json({ message: 'Post is no longer accepting interest' });
    }

    // Check if already expressed interest
    const existingInterest = post.interestedUsers.find(
      interest => interest.user.toString() === req.user._id.toString()
    );

    if (existingInterest) {
      return res.status(400).json({ message: 'Already expressed interest in this post' });
    }

    post.interestedUsers.push({
      user: req.user._id,
      message: req.body.message || ''
    });

    await post.save();

    res.json({ message: 'Interest expressed successfully' });
  } catch (error) {
    console.error('Express interest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/select
// @desc    Select a user for the post
// @access  Private
router.post('/:id/select', auth, [
  body('userId').notEmpty().withMessage('User ID is required')
], async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to select user for this post' });
    }

    if (post.status !== 'open') {
      return res.status(400).json({ message: 'Post is no longer open for selection' });
    }

    const { userId } = req.body;

    // Check if user expressed interest
    const interest = post.interestedUsers.find(
      interest => interest.user.toString() === userId
    );

    if (!interest) {
      return res.status(400).json({ message: 'User has not expressed interest in this post' });
    }

    post.selectedUser = userId;
    post.status = 'in_progress';

    await post.save();

    res.json({ message: 'User selected successfully' });
  } catch (error) {
    console.error('Select user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/posts/:id/complete
// @desc    Mark post as completed
// @access  Private
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isSelectedUser = post.selectedUser && post.selectedUser.toString() === req.user._id.toString();

    if (!isAuthor && !isSelectedUser) {
      return res.status(403).json({ message: 'Not authorized to complete this post' });
    }

    if (post.status !== 'in_progress') {
      return res.status(400).json({ message: 'Post is not in progress' });
    }

    post.status = 'completed';

    // Update user completed exchanges
    if (isAuthor) {
      await User.findByIdAndUpdate(post.selectedUser, {
        $inc: { completedExchanges: 1 }
      });
    } else {
      await User.findByIdAndUpdate(post.author, {
        $inc: { completedExchanges: 1 }
      });
    }

    await post.save();

    res.json({ message: 'Post marked as completed' });
  } catch (error) {
    console.error('Complete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
