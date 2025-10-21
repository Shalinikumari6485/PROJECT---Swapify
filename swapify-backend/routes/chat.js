const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'name avatar rating')
    .populate('post', 'title type category')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/:chatId
// @desc    Get chat messages
// @access  Private
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { 
        chat: req.params.chatId, 
        sender: { $ne: req.user._id },
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/create
// @desc    Create a new chat
// @access  Private
router.post('/create', auth, [
  body('postId').notEmpty().withMessage('Post ID is required'),
  body('message').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, message } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is authorized to chat (author or selected user)
    const isAuthor = post.author.toString() === req.user._id.toString();
    const isSelectedUser = post.selectedUser && post.selectedUser.toString() === req.user._id.toString();

    if (!isAuthor && !isSelectedUser) {
      return res.status(403).json({ message: 'Not authorized to chat for this post' });
    }

    // Determine the other participant
    const otherParticipant = isAuthor ? post.selectedUser : post.author;

    if (!otherParticipant) {
      return res.status(400).json({ message: 'No other participant found' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, otherParticipant] },
      post: postId
    });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user._id, otherParticipant],
        post: postId
      });
      await chat.save();
    }

    // Send initial message if provided
    if (message) {
      const newMessage = new Message({
        chat: chat._id,
        sender: req.user._id,
        content: message
      });
      await newMessage.save();

      // Update chat's last message and activity
      chat.lastMessage = newMessage._id;
      chat.lastActivity = new Date();
      await chat.save();

      await newMessage.populate('sender', 'name avatar');
      return res.status(201).json({
        message: 'Chat created and message sent',
        chat,
        newMessage
      });
    }

    res.status(201).json({
      message: 'Chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/:chatId/message
// @desc    Send a message
// @access  Private
router.post('/:chatId/message', auth, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const newMessage = new Message({
      chat: req.params.chatId,
      sender: req.user._id,
      content: req.body.content,
      messageType: req.body.messageType || 'text'
    });

    await newMessage.save();

    // Update chat's last message and activity
    chat.lastMessage = newMessage._id;
    chat.lastActivity = new Date();
    await chat.save();

    await newMessage.populate('sender', 'name avatar');

    res.status(201).json({
      message: 'Message sent successfully',
      newMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/:chatId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.updateMany(
      { 
        chat: req.params.chatId, 
        sender: { $ne: req.user._id },
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/:chatId
// @desc    Delete/Deactivate a chat
// @access  Private
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.isActive = false;
    await chat.save();

    res.json({ message: 'Chat deactivated successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
