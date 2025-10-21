import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FiPlus, FiDollarSign, FiRefreshCw, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreatePost = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'barter',
    category: '',
    skills: '',
    location: '',
    budget: '',
    offeredSkills: ''
  });
  const [loading, setLoading] = useState(false);

  const categories = [
    'academic', 'design', 'programming', 'writing', 
    'marketing', 'photography', 'music', 'art', 
    'tutoring', 'consulting', 'other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const skillsArray = formData.skills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);

      const offeredSkillsArray = formData.offeredSkills
        .split(',')
        .map(skill => skill.trim())
        .filter(skill => skill);

      const postData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        skills: skillsArray,
        location: formData.location,
        budget: formData.type === 'paid' ? parseInt(formData.budget) : undefined,
        offeredSkills: formData.type === 'barter' ? offeredSkillsArray : undefined
      };

      const response = await axios.post('/api/posts', postData);
      toast.success('Post created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'barter',
        category: '',
        skills: '',
        location: '',
        budget: '',
        offeredSkills: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create post';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Post Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="barter"
                  checked={formData.type === 'barter'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="flex items-center space-x-2">
                  <FiRefreshCw className="w-4 h-4" />
                  <span>Barter (Exchange Skills)</span>
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="paid"
                  checked={formData.type === 'paid'}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="flex items-center space-x-2">
                  <FiDollarSign className="w-4 h-4" />
                  <span>Paid Gig</span>
                </span>
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field"
              placeholder="What do you need help with?"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              rows={4}
              placeholder="Describe what you need in detail..."
              required
            />
          </div>

          {/* Skills Needed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Needed *
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              className="input-field"
              placeholder="JavaScript, Design, Writing... (comma separated)"
              required
            />
          </div>

          {/* Offered Skills (for barter) */}
          {formData.type === 'barter' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills You Can Offer *
              </label>
              <input
                type="text"
                name="offeredSkills"
                value={formData.offeredSkills}
                onChange={handleChange}
                className="input-field"
                placeholder="Photoshop, Tutoring, Music... (comma separated)"
                required
              />
            </div>
          )}

          {/* Budget (for paid) */}
          {formData.type === 'paid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget (₹) *
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="input-field"
                placeholder="500"
                min="1"
                required
              />
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div className="relative">
              <FiMapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Mumbai, India"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>{loading ? 'Creating...' : 'Create Post'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
