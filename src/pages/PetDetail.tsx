import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, Plus, Camera, HeartPulse, Edit2, 
  Trash2, User as UserIcon, Award, ChevronRight
} from 'lucide-react';
import Layout from '../components/Layout';
import { petApi, userApi } from '../api';
import type { Pet, User } from '../types';
import { 
  getSpeciesName, getSpeciesColor, formatDate, 
  formatDateTime, generatePetImage, timeAgo 
} from '../utils';
import { useAuthStore } from '../store/auth';

export default function PetDetail() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [pet, setPet] = useState<Pet | null>(null);
  const [petOwner, setPetOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { user: currentUser, isAuthenticated, logout } = useAuthStore();

  const isOwner = currentUser?.id === pet?.userId;

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
      
      if (data.userId) {
        try {
          const owner = await userApi.getById(data.userId);
          setPetOwner(owner);
        } catch (e) {
          console.error('Load pet owner error:', e);
        }
      }
    } catch (e) {
      console.error('Load pet error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = () => {
    if (!isOwner) return;
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

  const handleDeletePet = async () => {
    if (!pet || !isOwner) return;
    if (!window.confirm(`确定要删除 ${pet.name} 的档案吗？此操作无法撤销。`)) return;
    
    try {
      await petApi.delete(pet.id);
      navigate('/pets', { replace: true });
    } catch (e) {
      console.error('Delete pet error:', e);
      alert('删除失败，请重试');
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
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">
              {pet.name}的成长相册
            </h2>
            <p className="text-neutral-500 text-sm">
              {isOwner ? '记录每一个珍贵瞬间' : `来自 ${petOwner?.nickname || '宠物主人'} 的宝贝`}
            </p>
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
              {isOwner ? (
                <>
                  <button
                    onClick={() => navigate(`/pets/${pet.id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    编辑资料
                  </button>
                  <button
                    onClick={() => navigate(`/health?petId=${pet.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-full hover:bg-secondary-600 transition-colors"
                  >
                    <HeartPulse className="w-4 h-4" />
                    健康记录
                  </button>
                  <button
                    onClick={handleDeletePet}
                    className="p-2 bg-white/80 backdrop-blur rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="删除宠物档案"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                petOwner && (
                  <Link
                    to={`/profile/${petOwner.id}`}
                    className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur rounded-full hover:bg-white transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-primary-200">
                      <img
                        src={petOwner.avatar || generatePetImage('cat', petOwner.id.toString())}
                        alt={petOwner.nickname}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-700">
                      {petOwner.nickname}的主页
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                  </Link>
                )
              )}
            </div>
          </div>

          <div className="pt-20 pb-6 px-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-2xl text-neutral-800 flex items-center gap-2 mb-2">
                  {pet.name}
                  <span className={`w-3 h-3 rounded-full ${pet.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'}`} />
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-sm ${getSpeciesColor(pet.species)}`}>
                    {getSpeciesName(pet.species)}
                  </span>
                  {pet.breed && (
                    <span className="text-neutral-600">{pet.breed}</span>
                  )}
                  <span className="text-neutral-400">·</span>
                  <span className={pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'}>
                    {pet.gender === 'male' ? '男孩' : '女孩'}
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-neutral-500">{pet.age}岁</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-neutral-400 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>生日：{pet.birthday ? formatDate(pet.birthday) : '未设置'}</span>
                </div>
              </div>
              
              {!isOwner && petOwner && (
                <Link
                  to={`/profile/${petOwner.id}`}
                  className="flex items-center gap-3 p-3 bg-warm-50 rounded-2xl hover:bg-warm-100 transition-colors self-start"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow">
                    <img
                      src={petOwner.avatar || generatePetImage('cat', petOwner.id.toString())}
                      alt={petOwner.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-neutral-800">{petOwner.nickname}</span>
                      {petOwner.isVet && (
                        <span className="flex items-center gap-0.5 text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded-full">
                          <Award className="w-2.5 h-2.5" />
                          兽医
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500">查看主人主页</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 ml-1" />
                </Link>
              )}
            </div>
            
            {pet.bio && (
              <div className="p-4 bg-neutral-50 rounded-2xl">
                <p className="text-neutral-600">{pet.bio}</p>
              </div>
            )}
            
            {petOwner && isOwner && (
              <div className="mt-6 flex items-center justify-between p-4 bg-primary-50/50 rounded-2xl border border-primary-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow">
                    <img
                      src={petOwner.avatar || generatePetImage('cat', petOwner.id.toString())}
                      alt={petOwner.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-neutral-700">
                      你是 {pet.name} 的主人
                    </div>
                    <div className="text-xs text-neutral-500">
                      档案创建于 {timeAgo(pet.createdAt)}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/profile/${petOwner.id}`}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  管理我的主页
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-lg text-neutral-800">成长时间线</h3>
              <p className="text-sm text-neutral-500 mt-1">
                共 {pet.photos.length} 张照片
              </p>
            </div>
            {isOwner && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPhoto}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:shadow-warm transition-all"
              >
                <Plus className="w-4 h-4" />
                添加照片
              </motion.button>
            )}
          </div>

          {pet.photos.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">
                {isOwner 
                  ? `还没有照片，快记录${pet.name}的成长瞬间吧～`
                  : '主人还没有上传照片哦'
                }
              </p>
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
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-sm text-neutral-500">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(photo.date)}</span>
                            {photo.createdAt && (
                              <span className="text-neutral-400 text-xs">
                                {formatDateTime(photo.createdAt)}
                              </span>
                            )}
                          </div>
                          {isOwner && (
                            <button
                              onClick={() => {
                                if (window.confirm('确定要删除这张照片吗？')) {
                                  petApi.deletePhoto(pet.id, photo.id).then(() => loadPet());
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-500"
                              title="删除照片"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
