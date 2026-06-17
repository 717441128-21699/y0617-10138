import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Plus, Camera, HeartPulse, Edit2 } from 'lucide-react';
import Layout from '../components/Layout';
import { petApi } from '../api';
import type { Pet } from '../types';
import { getSpeciesName, getSpeciesColor, formatDate, formatDateTime, generatePetImage } from '../utils';
import { useAuthStore } from '../store/auth';

export default function PetDetail() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPet();
  }, [petId, isAuthenticated, location.key]);

  const loadPet = async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const data = await petApi.getById(parseInt(petId));
      setPet(data);
    } catch (e) {
      console.error('Load pet error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = () => {
    // 简化处理，实际项目中会有图片上传组件
    const caption = prompt('请输入照片描述：');
    if (caption && petId) {
      petApi.addPhoto(parseInt(petId), {
        image: generatePetImage(pet?.species || 'cat', Date.now().toString()),
        caption,
        date: formatDate(new Date()),
      }).then(() => {
        loadPet();
      });
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!pet) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-neutral-500">宠物不存在</p>
          <button onClick={() => navigate('/pets')} className="mt-4 text-primary-500">
            返回宠物列表
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pets')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">{pet.name}的成长相册</h2>
            <p className="text-neutral-500 text-sm">记录每一个珍贵瞬间</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="relative h-48 bg-gradient-to-br from-primary-200 via-accent-pink to-secondary-200">
            <div className="absolute -bottom-16 left-8">
              <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={pet.avatar || generatePetImage(pet.species, pet.id.toString())}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => navigate(`/pets/${pet.id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                编辑
              </button>
              <button
                onClick={() => navigate(`/health?petId=${pet.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors"
              >
                <HeartPulse className="w-4 h-4" />
                健康记录
              </button>
            </div>
          </div>

          <div className="pt-20 pb-6 px-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-2xl text-neutral-800 flex items-center gap-2">
                  {pet.name}
                  <span className={`w-3 h-3 rounded-full ${pet.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-sm ${getSpeciesColor(pet.species)}`}>
                    {getSpeciesName(pet.species)}
                  </span>
                  <span className="text-neutral-500">{pet.breed || '未知品种'}</span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-neutral-500">{pet.age}岁</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-neutral-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(pet.birthday)}
                </div>
              </div>
            </div>
            {pet.bio && (
              <p className="text-neutral-600">{pet.bio}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-neutral-800">成长时间线</h3>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddPhoto}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-warm transition-all"
            >
              <Plus className="w-4 h-4" />
              添加照片
            </motion.button>
          </div>

          {pet.photos.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">还没有照片，快记录{pet.name}的成长瞬间吧～</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-200 to-secondary-200"></div>
              
              <div className="space-y-8">
                {pet.photos.map((photo, idx) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative pl-20"
                  >
                    <div className="absolute left-6 w-5 h-5 rounded-full bg-white border-4 border-primary-400 shadow-warm"></div>
                    
                    <div className="bg-warm-50 rounded-2xl overflow-hidden hover:shadow-soft transition-shadow">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={photo.image}
                          alt={photo.caption}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(photo.date)}</span>
                          {photo.createdAt && (
                            <span className="text-neutral-400 text-xs">
                              {formatDateTime(photo.createdAt)}
                            </span>
                          )}
                        </div>
                        {photo.caption && (
                          <p className="text-neutral-700">{photo.caption}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
