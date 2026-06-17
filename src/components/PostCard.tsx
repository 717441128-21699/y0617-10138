import { Heart, MessageCircle, Repeat2, Share2, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import type { Post } from '../types';
import { timeAgo, getSpeciesName, getSpeciesColor } from '../utils';
import { useState } from 'react';
import { postApi } from '../api';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onUpdate?: () => void;
}

export default function PostCard({ post, onUpdate }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setIsLikeAnimating(true);
    
    try {
      if (isLiked) {
        await postApi.unlike(post.id);
        setLikeCount(prev => prev - 1);
      } else {
        await postApi.like(post.id);
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
      onUpdate?.();
    } catch (e) {
      console.error('Like error:', e);
    }
    
    setTimeout(() => setIsLikeAnimating(false), 500);
  };

  const handleShare = async () => {
    try {
      await postApi.share(post.id);
      if (navigator.share) {
        navigator.share({
          title: '萌宠动态',
          text: post.content,
          url: window.location.href,
        });
      } else {
        alert('已分享！');
      }
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-shadow duration-300"
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.user.id}`}>
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-100">
                <img 
                  src={post.user.avatar} 
                  alt={post.user.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Link 
                  to={`/profile/${post.user.id}`}
                  className="font-semibold text-neutral-800 hover:text-primary-500 transition-colors"
                >
                  {post.user.nickname}
                </Link>
                {post.user.isVet && (
                  <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full">
                    认证兽医
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>{timeAgo(post.createdAt)}</span>
                {post.pets.length > 0 && (
                  <>
                    <span>·</span>
                    {post.pets.map(pet => (
                      <span 
                        key={pet.id} 
                        className={`px-2 py-0.5 rounded-full text-xs ${getSpeciesColor(pet.species)}`}
                      >
                        {getSpeciesName(pet.species)}
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-neutral-400" />
          </button>
        </div>
        
        <Link to={`/square/${post.id}`}>
          <p className="text-neutral-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {post.content}
          </p>
        </Link>
        
        {post.images.length > 0 && (
          <div className={`grid gap-2 mb-4 ${
            post.images.length === 1 ? 'grid-cols-1' :
            post.images.length === 2 ? 'grid-cols-2' :
            post.images.length === 3 ? 'grid-cols-3' :
            'grid-cols-2'
          }`}>
            {post.images.slice(0, 4).map((img, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-2xl overflow-hidden ${
                  post.images.length === 4 && idx === 3 ? 'aspect-square' : 'aspect-square'
                }`}
              >
                <img 
                  src={img} 
                  alt=""
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                {post.images.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">+{post.images.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map(tag => (
              <span 
                key={tag}
                className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm hover:bg-primary-100 cursor-pointer transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 transition-colors group"
          >
            <motion.div
              animate={isLikeAnimating ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <Heart 
                className={`w-5 h-5 transition-colors ${
                  isLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-neutral-400 group-hover:text-red-400'
                }`} 
              />
            </motion.div>
            <span className={`text-sm ${isLiked ? 'text-red-500' : 'text-neutral-500'}`}>
              {likeCount}
            </span>
          </motion.button>
          
          <Link 
            to={`/square/${post.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors group"
          >
            <MessageCircle className="w-5 h-5 text-neutral-400 group-hover:text-blue-400" />
            <span className="text-sm text-neutral-500">{post.commentCount}</span>
          </Link>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-green-50 transition-colors group"
          >
            <Repeat2 className="w-5 h-5 text-neutral-400 group-hover:text-green-400" />
            <span className="text-sm text-neutral-500">{post.shareCount}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-50 transition-colors group"
          >
            <Share2 className="w-5 h-5 text-neutral-400 group-hover:text-purple-400" />
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
