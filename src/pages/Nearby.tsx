import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Plus, Star, Clock, Phone, Hospital, Home, Coffee, ChevronRight, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { placeApi } from '../api';
import type { Place } from '../types';
import { PLACE_TYPES, getPlaceTypeName, getPlaceTypeColor, timeAgo } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function Nearby() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const typeIcons: Record<string, React.ReactNode> = {
    hospital: <Hospital className="w-5 h-5" />,
    boarding: <Home className="w-5 h-5" />,
    friendly: <Coffee className="w-5 h-5" />,
  };

  useEffect(() => {
    loadPlaces();
  }, [activeType]);

  const loadPlaces = async () => {
    setLoading(true);
    try {
      const response = await placeApi.getAll({
        type: activeType || undefined,
      });
      setPlaces(response.places);
    } catch (e) {
      console.error('Load places error:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              'w-4 h-4',
              star <= Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">同城服务</h2>
            <p className="text-neutral-500 mt-1">发现身边优质的宠物服务场所</p>
          </div>
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/nearby/submit')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-warm-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              提交场所
            </motion.button>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveType(null)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                activeType === null
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-warm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              <MapPin className="w-5 h-5" />
              全部
            </button>
            {PLACE_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setActiveType(activeType === type.id ? null : type.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                  activeType === type.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-warm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {typeIcons[type.id]}
                {type.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          ) : places.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
              <MapPin className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无场所信息</p>
            </div>
          ) : (
            places.map((place, idx) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div
                  onClick={() => navigate(`/nearby/${place.id}`)}
                  className="bg-white rounded-3xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-all cursor-pointer"
                >
                  <div className="flex">
                    {place.images.length > 0 && (
                      <div className="w-48 h-48 flex-shrink-0">
                        <img
                          src={place.images[0]}
                          alt={place.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-neutral-800">{place.name}</h3>
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs',
                              getPlaceTypeColor(place.type)
                            )}>
                              {getPlaceTypeName(place.type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <MapPin className="w-4 h-4" />
                            {place.address}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300" />
                      </div>

                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          {renderStars(place.rating)}
                          <span className="text-sm font-medium text-neutral-700 ml-1">{place.rating}</span>
                        </div>
                        <span className="text-sm text-neutral-400">{place.reviewCount} 条评价</span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-neutral-500 mb-3">
                        {place.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {place.phone}
                          </div>
                        )}
                        {place.businessHours && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {place.businessHours}
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-neutral-600 line-clamp-2">{place.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
