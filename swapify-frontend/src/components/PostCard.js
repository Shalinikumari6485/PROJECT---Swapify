import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiClock, FiUser, FiStar, FiDollarSign, FiRefreshCw } from 'react-icons/fi';

const PostCard = ({ post }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
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

  return (
    <div className="card hover:shadow-xl transition-all duration-300 group">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`badge ${getCategoryColor(post.category)}`}>
              {post.category}
            </span>
            <span className={`badge ${post.type === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {post.type === 'paid' ? 'Paid' : 'Barter'}
            </span>
          </div>
          
          <Link 
            to={`/post/${post._id}`}
            className="text-lg font-semibold text-gray-800 hover:text-teal-600 transition-colors duration-200 line-clamp-2"
          >
            {post.title}
          </Link>
        </div>
        
        {post.type === 'paid' && (
          <div className="flex items-center space-x-1 text-green-600 font-semibold">
            <FiDollarSign className="w-4 h-4" />
            <span>{post.budget}</span>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {post.description}
      </p>

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {post.skills.slice(0, 3).map((skill, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
            >
              {skill}
            </span>
          ))}
          {post.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              +{post.skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Author Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <FiUser className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-medium text-gray-800 text-sm">
              {post.author?.name}
            </p>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <FiStar className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-gray-600">
                  {post.author?.rating?.toFixed(1) || 'New'}
                </span>
              </div>
              {post.author?.badges?.length > 0 && (
                <span className={`badge ${getBadgeColor(post.author.badges[post.author.badges.length - 1])}`}>
                  {post.author.badges[post.author.badges.length - 1]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500">
          <div className="flex items-center space-x-1 mb-1">
            <FiMapPin className="w-3 h-3" />
            <span>{post.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FiClock className="w-3 h-3" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link 
          to={`/post/${post._id}`}
          className="w-full btn-primary text-center block group-hover:bg-teal-700 transition-colors duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PostCard;
