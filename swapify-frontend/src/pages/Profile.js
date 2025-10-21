import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FiUser, FiMail, FiMapPin, FiStar, FiRefreshCw, FiEdit, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setProfile(user);
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/users/stats/${user.id}`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setProfile(prev => ({
      ...prev,
      skills
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/api/users/profile', {
        name: profile.name,
        bio: profile.bio,
        skills: profile.skills,
        location: profile.location,
        phone: profile.phone
      });
      
      updateUser(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfile(user);
    setIsEditing(false);
  };

  const getBadgeColor = (badge) => {
    const colors = {
      newbie: 'badge-newbie',
      helper: 'badge-helper',
      expert: 'badge-expert',
      superstar: 'badge-superstar',
      mentor: 'badge-mentor'
    };
    return colors[badge] || 'badge-newbie';
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center">
              <FiUser className="w-12 h-12 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {profile.name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <FiStar className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">{profile.rating?.toFixed(1) || 'New'}</span>
                  <span>({profile.totalRatings || 0} reviews)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiRefreshCw className="w-5 h-5" />
                  <span>{profile.completedExchanges || 0} exchanges</span>
                </div>
              </div>
              {profile.badges && profile.badges.length > 0 && (
                <div className="flex space-x-2 mt-2">
                  {profile.badges.map((badge, index) => (
                    <span key={index} className={`badge ${getBadgeColor(badge)}`}>
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-outline flex items-center space-x-2"
          >
            <FiEdit className="w-4 h-4" />
            <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-700">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-400" />
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={profile.location || ''}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Location"
                  />
                ) : (
                  <span className="text-gray-700">{profile.location || 'Not specified'}</span>
                )}
              </div>
              {profile.phone && (
                <div className="flex items-center space-x-3">
                  <FiUser className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Phone number"
                    />
                  ) : (
                    <span className="text-gray-700">{profile.phone}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bio</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={profile.bio || ''}
                onChange={handleInputChange}
                className="input-field"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-700">
                {profile.bio || 'No bio available'}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills</h3>
          {isEditing ? (
            <input
              type="text"
              value={profile.skills?.join(', ') || ''}
              onChange={handleSkillsChange}
              className="input-field"
              placeholder="JavaScript, Design, Writing... (comma separated)"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No skills listed</span>
              )}
            </div>
          )}
        </div>

        {/* Save/Cancel Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-4 mt-6">
            <button
              onClick={handleCancel}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiX className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <FiSave className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">
                {stats.totalReviews}
              </div>
              <div className="text-gray-600">Total Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.postsCreated}
              </div>
              <div className="text-gray-600">Posts Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {stats.postsCompleted}
              </div>
              <div className="text-gray-600">Posts Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
