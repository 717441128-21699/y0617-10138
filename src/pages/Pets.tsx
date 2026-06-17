import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Calendar, HeartPulse, Camera, Edit2, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { petApi, authApi } from '../api';
import type { Pet } from '../types';
import { getSpeciesName, getSpeciesColor, formatDate, generatePetImage } from '../utils';
import { useAuthStore } from '../store/auth';

export default function Pets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPets();
  }, [isAuthenticated, location.key]);

  const loadPets = async () => {
    setLoading(true);
    try {
      const response = await petApi.getAll();
      setPets(response.pets);
    } catch (e) {
      console.error('Load pets error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId: number) => {
    if (window.confirm('确定要删除这个宠物档案吗？')) {
      try {
        await petApi.delete(petId);
        loadPets();
      } catch (e) {
        console.error('Delete pet error:', e);
      }
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">我的宠物</h2>
            <p className="text-neutral-500 mt-1">管理您的爱宠档案，记录成长点滴</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/pets/new')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-warm-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            添加宠物
          </motion.button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        ) : pets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-12 h-12 text-primary-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">还没有宠物档案</h3>
            <p className="text-neutral-500 mb-6">点击上方按钮，创建您的第一个宠物档案吧</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/pets/new')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-warm-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              创建宠物档案
            </motion.button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pets.map((pet, idx) => (
              <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-3xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-shadow"
            >
              <div className="relative h-40 bg-gradient-to-br from-primary-100 to-secondary-100">
                <div className="absolute -bottom-12 left-6">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-lg">
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
                      className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                
                <div className="pt-16 pb-6 px-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-xl text-neutral-800">{pet.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-500">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getSpeciesColor(pet.species)}`}>
                          {getSpeciesName(pet.species)}
                        </span>
                        <span>·</span>
                        <span>{pet.breed || '未知品种'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-500">{pet.age}</div>
                      <div className="text-xs text-neutral-400">岁</div>
                    </div>
                  </div>
                  
                  {pet.bio && (
                    <p className="text-sm text-neutral-600 mb-4">{pet.bio}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(pet.birthday)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${pet.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                      <span>{pet.gender === 'male' ? '男孩' : '女孩'}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Link
                      to={`/pets/${pet.id}`}
                      className="flex-1 py-2 bg-primary-50 text-primary-600 rounded-xl text-center text-sm font-medium hover:bg-primary-100 transition-colors"
                    >
                      成长相册
                    </Link>
                    <Link
                      to={`/health?petId=${pet.id}`}
                      className="flex-1 py-2 bg-secondary-50 text-secondary-600 rounded-xl text-center text-sm font-medium hover:bg-secondary-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <HeartPulse className="w-4 h-4" />
                      健康记录
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
