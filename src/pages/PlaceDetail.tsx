import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Clock, Phone, Plus, Send, HeartPulse } from 'lucide-react';
import Layout from '../components/Layout';
import { placeApi } from '../api';
import type { Place } from '../types';
import { getPlaceTypeName, getPlaceTypeColor, timeAgo } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function PlaceDetail() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadPlace();
  }, [placeId]);

  const loadPlace = async () => {
    if (!placeId) return;
    setLoading(true);
    try {
      const data = await placeApi.getById(parseInt(placeId));
      setPlace(data);
    } catch (e) {
      console.error('Load place error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !placeId || !isAuthenticated) return;

    setSubmittingReview(true);
    try {
      await placeApi.addReview(parseInt(placeId), {
        rating,
        content: reviewText.trim(),
      });
      setReviewText('');
      setRating(5);
      loadPlace();
    } catch (e) {
      console.error('Submit review error:', e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (value: number, interactive = false, onChange?: (v: number) => void) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              'w-5 h-5 transition-colors',
              interactive ? 'cursor-pointer' : '',
              star <= value ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
            )}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
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

  if (!place) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-neutral-500">场所不存在</p>
          <button onClick={() => navigate('/nearby')} className="mt-4 text-primary-500">
            返回同城
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/nearby')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h2 className="font-display text-2xl font-bold text-neutral-800">场所详情</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          {place.images.length > 0 && (
            <div>
              <div className="aspect-video">
                <img
                  src={place.images[selectedImage]}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {place.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {place.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={cn(
                        'w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all',
                        selectedImage === idx ? 'border-primary-500' : 'border-transparent'
                      )}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="font-bold text-2xl text-neutral-800">{place.name}</h1>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-sm',
                    getPlaceTypeColor(place.type)
                  )}>
                    {getPlaceTypeName(place.type)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {renderStars(place.rating)}
                    <span className="font-bold text-lg text-neutral-700 ml-1">{place.rating}</span>
                  </div>
                  <span className="text-sm text-neutral-500">{place.reviewCount} 条评价</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3 text-neutral-600">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">地址</div>
                  <div className="text-sm">{place.address}</div>
                </div>
              </div>
              {place.phone && (
                <div className="flex items-center gap-3 text-neutral-600">
                  <Phone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">电话</div>
                    <div className="text-sm">{place.phone}</div>
                  </div>
                </div>
              )}
              {place.businessHours && (
                <div className="flex items-center gap-3 text-neutral-600">
                  <Clock className="w-5 h-5 text-primary-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">营业时间</div>
                    <div className="text-sm">{place.businessHours}</div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-neutral-600 leading-relaxed">{place.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6">
          <h3 className="font-bold text-lg text-neutral-800 mb-4">用户评价 ({place.reviews.length})</h3>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-neutral-50 rounded-2xl">
              <div className="mb-3">
                <label className="block text-sm font-medium text-neutral-700 mb-2">评分</label>
                {renderStars(rating, true, setRating)}
              </div>
              <div className="flex gap-2">
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
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="写下你的评价..."
                    className="flex-1 px-4 py-2 bg-white rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!reviewText.trim() || submittingReview}
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 mb-6 bg-neutral-50 rounded-xl">
              <p className="text-sm text-neutral-500">
                登录后即可发表评价
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
            {place.reviews.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                暂无评价，快来发表第一条评价吧～
              </div>
            ) : (
              place.reviews.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-neutral-50 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${review.user.id}`}>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-100">
                          <img
                            src={review.user.avatar}
                            alt={review.user.nickname}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                      <div>
                        <Link
                          to={`/profile/${review.user.id}`}
                          className="font-medium text-neutral-800 hover:text-primary-600 transition-colors"
                        >
                          {review.user.nickname}
                        </Link>
                        <div className="flex items-center gap-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-neutral-400">{timeAgo(review.createdAt)}</span>
                  </div>
                  <p className="text-neutral-700">{review.content}</p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
