const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['barter', 'paid'],
    default: 'barter'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'academic', 'design', 'programming', 'writing', 
      'marketing', 'photography', 'music', 'art', 
      'tutoring', 'consulting', 'other'
    ]
  },
  skills: [{
    type: String,
    trim: true
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: String,
    required: true
  },
  // For barter posts
  offeredSkills: [{
    type: String,
    trim: true
  }],
  // For paid posts
  budget: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  // Status tracking
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  // Matching
  interestedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  selectedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Images
  images: [{
    type: String
  }],
  // Timestamps
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for better search performance
postSchema.index({ title: 'text', description: 'text', skills: 'text' });
postSchema.index({ category: 1, type: 1, status: 1 });
postSchema.index({ location: 1 });
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Post', postSchema);
