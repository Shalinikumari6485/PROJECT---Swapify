import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiUser, FiMapPin, FiClock, FiStar, FiDollarSign, FiRefreshCw, FiMessageCircle, FiHeart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PostDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [interestMessage, setInterestMessage] = useState('');
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to express interest');
      return;
    }

    if (!interestMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setLoadingAction(true);
    try {
      await axios.post(`/api/posts/${id}/interest`, {
        message: interestMessage
      });
      toast.success('Interest expressed successfully!');
      setShowInterestForm(false);
      setInterestMessage('');
      fetchPost(); // Refresh post data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to express interest';
      toast.error(message);
    } finally {
      setLoadingAction(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      academic: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      programming: 'bg-green-100 text-green-800',
      writing: 'bg-yellow-100 text-yellow-800',
      marketing: 'bg-pink-100 text-pink-800',
      photography: 'bg-indigo-100 text-indigo-800',
      music: 'bg-red-100 text-red-800',
      art: 'bg-orange-100 text-orange-800',
      tutoring: 'bg-teal-100 text-teal-800',
      consulting: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return <LoadingSpinner text="Loading post details..." />;
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Post not found</h2>
        <p className="text-gray-600">The post you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  const isAuthor = isAuthenticated && user?.id === post.author?._id;
  const hasExpressedInterest = post.interestedUsers?.some(
    interest => interest.user?._id === user?.id
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              <span className={`badge ${getCategoryColor(post.category)}`}>
                {post.category}
              </span>
              <span className={`badge ${post.type === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {post.type === 'paid' ? 'Paid' : 'Barter'}
              </span>
              <span className={`badge ${post.status === 'open' ? 'bg-green-100 text-green-800' : post.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                {post.status}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {post.title}
            </h1>
            
            {post.type === 'paid' && (
              <div className="flex items-center space-x-2 text-green-600 text-xl font-semibold mb-4">
                <FiDollarSign className="w-6 h-6" />
                <span>{post.budget} {post.currency}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 text-lg leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Required Skills:</h3>
          <div className="flex flex-wrap gap-2">
            {post.skills.map((skill, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-teal-100 text-teal-800 text-sm rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Offered Skills (for barter posts) */}
        {post.type === 'barter' && post.offeredSkills && post.offeredSkills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Offered in Return:</h3>
            <div className="flex flex-wrap gap-2">
              {post.offeredSkills.map((skill, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <FiMapPin className="w-4 h-4" />
              <span>{post.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiClock className="w-4 h-4" />
              <span>Posted {formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Author Info */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Posted by</h3>
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <FiUser className="w-8 h-8 text-teal-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-800">
              {post.author?.name}
            </h4>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FiStar className="w-4 h-4 text-yellow-500" />
                <span>{post.author?.rating?.toFixed(1) || 'New'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiRefreshCw className="w-4 h-4" />
                <span>{post.author?.completedExchanges || 0} exchanges</span>
              </div>
            </div>
            {post.author?.bio && (
              <p className="text-gray-700 mt-2">{post.author.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isAuthor && post.status === 'open' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          {!hasExpressedInterest ? (
            <div>
              <button
                onClick={() => setShowInterestForm(true)}
                className="btn-primary w-full mb-4 flex items-center justify-center space-x-2"
              >
                <FiHeart className="w-5 h-5" />
                <span>Express Interest</span>
              </button>
              
              {showInterestForm && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to {post.author?.name}
                    </label>
                    <textarea
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      className="input-field"
                      rows={4}
                      placeholder="Tell them why you're interested and what you can offer..."
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleExpressInterest}
                      disabled={loadingAction}
                      className="btn-primary flex-1"
                    >
                      {loadingAction ? 'Sending...' : 'Send Interest'}
                    </button>
                    <button
                      onClick={() => setShowInterestForm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiHeart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Interest Expressed!
              </h3>
              <p className="text-gray-600">
                You've expressed interest in this post. The author will be notified.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Interested Users (for author) */}
      {isAuthor && post.interestedUsers && post.interestedUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Interested Users ({post.interestedUsers.length})
          </h3>
          <div className="space-y-4">
            {post.interestedUsers.map((interest, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {interest.user?.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <FiStar className="w-3 h-3 text-yellow-500" />
                        <span>{interest.user?.rating?.toFixed(1) || 'New'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {interest.message && (
                  <p className="text-gray-700 text-sm mt-2 pl-13">
                    "{interest.message}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
