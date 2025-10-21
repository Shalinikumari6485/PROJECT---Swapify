const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: './config.env' });

// Import models
const User = require('./models/User');
const Post = require('./models/Post');
const Review = require('./models/Review');

// Sample data
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'password123',
    bio: 'Passionate graphic designer and photography enthusiast. Love helping others learn creative skills!',
    skills: ['Graphic Design', 'Photography', 'Adobe Photoshop', 'Illustration'],
    location: 'Mumbai, India',
    phone: '+91 98765 43210',
    rating: 4.8,
    totalRatings: 15,
    completedExchanges: 12,
    badges: ['newbie', 'helper', 'expert'],
    isVerified: true
  },
  {
    name: 'Raj Patel',
    email: 'raj@example.com',
    password: 'password123',
    bio: 'Computer Science student specializing in web development. Available for tutoring and project help.',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'Web Development'],
    location: 'Delhi, India',
    phone: '+91 98765 43211',
    rating: 4.9,
    totalRatings: 8,
    completedExchanges: 6,
    badges: ['newbie', 'helper'],
    isVerified: true
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'password123',
    bio: 'Mathematics tutor and academic writer. Helping students excel in their studies.',
    skills: ['Mathematics', 'Academic Writing', 'Tutoring', 'Statistics', 'Calculus'],
    location: 'Bangalore, India',
    phone: '+91 98765 43212',
    rating: 4.7,
    totalRatings: 22,
    completedExchanges: 18,
    badges: ['newbie', 'helper', 'expert'],
    isVerified: true
  },
  {
    name: 'Mike Chen',
    email: 'mike@example.com',
    password: 'password123',
    bio: 'Music producer and audio engineer. Offering music production lessons and mixing services.',
    skills: ['Music Production', 'Audio Engineering', 'Sound Design', 'Mixing', 'Mastering'],
    location: 'Chennai, India',
    phone: '+91 98765 43213',
    rating: 4.6,
    totalRatings: 7,
    completedExchanges: 5,
    badges: ['newbie', 'helper'],
    isVerified: false
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    password: 'password123',
    bio: 'Content writer and social media manager. Helping businesses grow their online presence.',
    skills: ['Content Writing', 'Social Media Marketing', 'Copywriting', 'SEO', 'Digital Marketing'],
    location: 'Pune, India',
    phone: '+91 98765 43214',
    rating: 4.9,
    totalRatings: 11,
    completedExchanges: 9,
    badges: ['newbie', 'helper', 'expert'],
    isVerified: true
  },
  {
    name: 'Admin User',
    email: 'admin@swapify.com',
    password: 'admin123',
    bio: 'Platform administrator',
    skills: ['Administration', 'Platform Management'],
    location: 'India',
    phone: '+91 98765 43215',
    rating: 5.0,
    totalRatings: 1,
    completedExchanges: 0,
    badges: ['newbie'],
    isVerified: true,
    isAdmin: true
  }
];

const samplePosts = [
  {
    title: 'Need help with React.js project - Will teach Photoshop in return',
    description: 'I\'m working on a React.js e-commerce website and need help with state management and API integration. In return, I can teach you advanced Photoshop techniques including photo manipulation and digital art creation.',
    type: 'barter',
    category: 'programming',
    skills: ['React', 'JavaScript', 'State Management', 'API Integration'],
    location: 'Mumbai, India',
    offeredSkills: ['Photoshop', 'Digital Art', 'Photo Manipulation'],
    status: 'open'
  },
  {
    title: 'Looking for Mathematics tutor - Can help with web development',
    description: 'I need help understanding calculus and linear algebra concepts. I can offer web development services including building responsive websites and implementing modern JavaScript features.',
    type: 'barter',
    category: 'academic',
    skills: ['Calculus', 'Linear Algebra', 'Mathematics'],
    location: 'Delhi, India',
    offeredSkills: ['Web Development', 'JavaScript', 'Responsive Design'],
    status: 'open'
  },
  {
    title: 'Logo Design Needed - ₹500 budget',
    description: 'I need a professional logo design for my startup company. The logo should be modern, minimalist, and work well in both digital and print formats. Please include source files.',
    type: 'paid',
    category: 'design',
    skills: ['Logo Design', 'Branding', 'Adobe Illustrator'],
    location: 'Bangalore, India',
    budget: 500,
    currency: 'INR',
    status: 'open'
  },
  {
    title: 'Content Writing for Blog - ₹300 per article',
    description: 'I need 5 high-quality blog articles about digital marketing trends. Each article should be 800-1000 words, SEO optimized, and include relevant keywords. Payment upon completion.',
    type: 'paid',
    category: 'writing',
    skills: ['Content Writing', 'SEO', 'Digital Marketing', 'Blog Writing'],
    location: 'Chennai, India',
    budget: 300,
    currency: 'INR',
    status: 'open'
  },
  {
    title: 'Music Production Lessons - Will teach graphic design',
    description: 'I want to learn music production using Ableton Live. I can teach you graphic design principles, color theory, and how to create stunning visual content in return.',
    type: 'barter',
    category: 'music',
    skills: ['Music Production', 'Ableton Live', 'Sound Design'],
    location: 'Pune, India',
    offeredSkills: ['Graphic Design', 'Color Theory', 'Visual Design'],
    status: 'open'
  },
  {
    title: 'Photography Session - ₹800 for 2 hours',
    description: 'Need a professional photographer for a product photoshoot. Should have experience with product photography, lighting setup, and post-processing. Equipment provided.',
    type: 'paid',
    category: 'photography',
    skills: ['Product Photography', 'Lighting', 'Post Processing', 'Photoshop'],
    location: 'Mumbai, India',
    budget: 800,
    currency: 'INR',
    status: 'open'
  }
];

const sampleReviews = [
  {
    rating: 5,
    comment: 'Excellent work! Alice delivered exactly what I needed and was very professional throughout the process.',
    type: 'paid',
    categories: {
      communication: 5,
      quality: 5,
      timeliness: 5,
      professionalism: 5
    },
    paymentAmount: 500
  },
  {
    rating: 4,
    comment: 'Great tutor! Raj explained complex concepts clearly and helped me understand React better.',
    type: 'barter',
    categories: {
      communication: 4,
      quality: 5,
      timeliness: 4,
      professionalism: 4
    }
  },
  {
    rating: 5,
    comment: 'Priya is an amazing math tutor. She made calculus seem easy and was very patient with my questions.',
    type: 'barter',
    categories: {
      communication: 5,
      quality: 5,
      timeliness: 5,
      professionalism: 5
    }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/swapify');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`Created user: ${user.name}`);
    }

    // Create posts with random authors
    const posts = [];
    for (const postData of samplePosts) {
      const randomUser = users[Math.floor(Math.random() * (users.length - 1))]; // Exclude admin
      const post = new Post({
        ...postData,
        author: randomUser._id
      });
      await post.save();
      posts.push(post);
      console.log(`Created post: ${post.title}`);
    }

    // Create reviews
    for (let i = 0; i < sampleReviews.length; i++) {
      const reviewData = sampleReviews[i];
      const reviewer = users[i % (users.length - 1)]; // Exclude admin
      const reviewee = users[(i + 1) % (users.length - 1)]; // Exclude admin
      const post = posts[i % posts.length];

      const review = new Review({
        ...reviewData,
        reviewer: reviewer._id,
        reviewee: reviewee._id,
        post: post._id
      });
      await review.save();
      console.log(`Created review from ${reviewer.name} to ${reviewee.name}`);
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${users.length} users, ${posts.length} posts, and ${sampleReviews.length} reviews`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedDatabase();
