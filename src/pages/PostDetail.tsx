import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MessageCircle, Send, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { postApi } from '../api';
import type { Post, Comment } from '../types';
import { timeAgo, getSpeciesName, getSpeciesColor, formatDate, formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    if (!postId) return;
    try {
      const data = await postApi.getById(parseInt(postId));
      setPost(data);
      setIsLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch (e) {
      console.error('Load post error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!postId) return;
    try {
      const data = await postApi.getComments(parseInt(postId));
      setComments(data.comments);
    } catch (e) {
      console.error('Load comments error:', e);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !postId) return;
    try {
      if (isLiked) {
        await postApi.unlike(parseInt(postId));
        setLikeCount(prev => prev - 1);
      } else {
        await postApi.like(parseInt(postId));
        setLikeCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !postId || !isAuthenticated) return;

    setSubmittingComment(true);
    try {
      const newComment = await postApi.addComment(parseInt(postId), {
        content: commentText.trim(),
      });
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 });
      }
    } catch (e) {
      console.error('Submit comment error:', e);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-neutral-500">动态不存在</p>
          <button onClick={() => navigate('/square')} className="mt-4 text-primary-500">
            返回广场
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h2 className="font-display text-2xl font-bold text-neutral-800">动态详情</h2>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-soft overflow-hidden"
        >
          <div className="p-6">
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
                      <span className="flex items-center gap-1 text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        认证兽医
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-neutral-500">
                    <span>{timeAgo(post.createdAt)}</span>
                    <span className="text-neutral-400 text-xs">· {formatDateTime(post.createdAt)}</span>
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
            </div>

            <p className="text-neutral-700 leading-relaxed mb-4 whitespace-pre-wrap text-lg">
              {post.content}
            </p>

            {post.images.length > 0 && (
              <div className={`grid gap-2 mb-4 ${
                post.images.length === 1 ? 'grid-cols-1' :
                post.images.length === 2 ? 'grid-cols-2' :
                post.images.length === 3 ? 'grid-cols-3' :
                'grid-cols-2'
              }`}>
                {post.images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl overflow-hidden ${
                      post.images.length === 1 ? 'aspect-auto' : 'aspect-square'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm cursor-pointer hover:bg-primary-100 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors group ${
                  isLiked ? 'text-red-500' : 'text-neutral-500 hover:bg-red-50'
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
                <span className="text-sm">{likeCount}</span>
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-neutral-500">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{post.commentCount}</span>
              </div>
            </div>
          </div>
        </motion.article>

        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h3 className="font-bold text-lg text-neutral-800 mb-4">
            评论 ({comments.length})
          </h3>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="flex gap-3 mb-6">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-100 flex-shrink-0">
                <img
                  src={user?.avatar || ''}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="写下你的评论..."
                  className="flex-1 px-4 py-2 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!commentText.trim() || submittingComment}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 mb-6 bg-neutral-50 rounded-xl">
              <p className="text-sm text-neutral-500">
                登录后即可发表评论
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary-500 ml-2 hover:underline"
                >
                  去登录
                </button>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                暂无评论，快来抢沙发吧～
              </div>
            ) : (
              comments.map((comment, idx) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-3"
                >
                  <Link to={`/profile/${comment.user.id}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-100 flex-shrink-0">
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/profile/${comment.user.id}`}
                        className="font-medium text-neutral-800 text-sm hover:text-primary-500 transition-colors"
                      >
                        {comment.user.nickname}
                      </Link>
                      {comment.user.isVet && (
                        <span className="flex items-center gap-1 text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded-full">
                          <CheckCircle className="w-2.5 h-2.5" />
                          兽医
                        </span>
                      )}
                      <span className="text-xs text-neutral-400">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-neutral-700 text-sm">{comment.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
