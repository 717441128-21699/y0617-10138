import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User as UserIcon, Cat, Heart, Newspaper, Award, 
  Settings, UserPlus, UserCheck, Edit3, Plus, Calendar, 
  HeartPulse, Camera, Image as ImageIcon, PawPrint
} from 'lucide-react';
import Layout from '../components/Layout';
import { userApi, petApi, healthApi, postApi } from '../api';
import type { User, Post, Pet } from '../types';
import { 
  generatePetImage, timeAgo, formatDate, 
  getSpeciesName, getSpeciesColor, formatDateTime 
} from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';
import PostCard from '../components/PostCard';

type TabType = 'posts' | 'pets' | 'favorites';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  
  const activeTab: TabType = (searchParams.get('tab') as TabType) || 'posts';
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [petHealthData, setPetHealthData] = useState<Record<number, { vaccine: number; deworming: number; weight: number }>>({});
  const [petPosts, setPetPosts] = useState<Record<number, Post[]>>({});
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile = currentUser?.id === parseInt(userId || '0');

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (!userId) return;
    loadProfile();
  }, [userId, location.key]);

  useEffect(() => {
    if (!userId) return;
    if (activeTab === 'posts') {
      loadUserPosts();
    } else if (activeTab === 'pets') {
      loadUserPets();
    }
  }, [userId, activeTab, location.key]);

  const loadProfile = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [userData, followersData, followingData] = await Promise.all([
        userApi.getById(parseInt(userId)),
        userApi.getFollowers(parseInt(userId)),
        userApi.getFollowing(parseInt(userId)),
      ]);
      setProfileUser(userData);
      setFollowersCount(followersData.users.length);
      setFollowingCount(followingData.users.length);
      if (currentUser) {
        setIsFollowing(userData.isFollowing);
      }
    } catch (e) {
      console.error('Load profile error:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!userId) return;
    try {
      const response = await userApi.getPosts(parseInt(userId));
      setPosts(response.posts);
    } catch (e) {
      console.error('Load user posts error:', e);
    }
  };

  const loadUserPets = async () => {
    if (!userId) return;
    try {
      const response = await userApi.getPets(parseInt(userId));
      setPets(response.pets);
      
      if (response.pets.length > 0) {
        const [allHealthRes, allPostsRes] = await Promise.all([
          Promise.all(response.pets.map(pet => Promise.all([
            healthApi.getVaccineRecords(pet.id),
            healthApi.getDewormingRecords(pet.id),
            healthApi.getWeightRecords(pet.id),
          ]))),
          Promise.all(response.pets.map(pet => postApi.getAll({ petId: pet.id, limit: 3 } as any))),
        ]);
        
        const healthMap: Record<number, { vaccine: number; deworming: number; weight: number }> = {};
        const postsMap: Record<number, Post[]> = {};
        
        response.pets.forEach((pet, idx) => {
          const [vac, dew, wei] = allHealthRes[idx];
          healthMap[pet.id] = {
            vaccine: vac.records?.length || 0,
            deworming: dew.records?.length || 0,
            weight: wei.records?.length || 0,
          };
          postsMap[pet.id] = allPostsRes[idx]?.posts || [];
        });
        
        setPetHealthData(healthMap);
        setPetPosts(postsMap);
      }
    } catch (e) {
      console.error('Load user pets error:', e);
    }
  };

  const handleFollow = async () => {
    if (!userId || !isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      if (isFollowing) {
        await userApi.unfollow(parseInt(userId));
        setFollowersCount(prev => prev - 1);
      } else {
        await userApi.follow(parseInt(userId));
        setFollowersCount(prev => prev + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (e) {
      console.error('Follow error:', e);
    }
  };

  const handleCreatePet = () => {
    navigate('/pets/new', { 
      state: { 
        fromProfile: userId,
        returnTab: 'pets',
      } 
    });
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

  if (!profileUser) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-neutral-500">用户不存在</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <h2 className="font-display text-2xl font-bold text-neutral-800">个人主页</h2>
          </div>
          {isOwnProfile && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-white rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-neutral-600" />
            </button>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary-400 to-secondary-400 relative">
            <div className="absolute -bottom-12 left-8">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profileUser.avatar || generatePetImage('cat', 'user')}
                  alt={profileUser.nickname}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="pt-16 pb-6 px-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-2xl text-neutral-800">{profileUser.nickname}</h1>
                  {profileUser.isVet && (
                    <span className="flex items-center gap-1 text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full">
                      <Award className="w-3 h-3" />
                      认证兽医
                    </span>
                  )}
                </div>
                <p className="text-neutral-500 mt-1">
                  @{profileUser.nickname}
                </p>
                {profileUser.bio && (
                  <p className="text-neutral-600 mt-3">{profileUser.bio}</p>
                )}
              </div>
              {!isOwnProfile && isAuthenticated && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFollow}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2 rounded-xl font-medium transition-all',
                    isFollowing
                      ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-warm'
                  )}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      已关注
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      关注
                    </>
                  )}
                </motion.button>
              )}
              {isOwnProfile && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 px-5 py-2 bg-neutral-100 text-neutral-600 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  编辑资料
                </motion.button>
              )}
            </div>

            <div className="flex items-center gap-8 mt-6 pt-6 border-t border-neutral-100">
              <button 
                onClick={() => setActiveTab('posts')}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <div className="text-2xl font-bold text-neutral-800">{posts.length}</div>
                <div className="text-sm text-neutral-500">动态</div>
              </button>
              <div className="text-center cursor-pointer">
                <div className="text-2xl font-bold text-neutral-800">{followersCount}</div>
                <div className="text-sm text-neutral-500">粉丝</div>
              </div>
              <div className="text-center cursor-pointer">
                <div className="text-2xl font-bold text-neutral-800">{followingCount}</div>
                <div className="text-sm text-neutral-500">关注</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-500">{profileUser.points}</div>
                <div className="text-sm text-neutral-500">积分</div>
              </div>
            </div>
          </div>

          <div className="flex border-t border-neutral-100">
            {[
              { id: 'posts', label: '动态', icon: Newspaper },
              { id: 'pets', label: '宠物', icon: Cat, count: pets.length },
              { id: 'favorites', label: '收藏', icon: Heart },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-all',
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                    : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-bold',
                    activeTab === tab.id 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-neutral-200 text-neutral-600'
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
                <Newspaper className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">暂无动态</p>
              </div>
            ) : (
              posts.map(post => (
                <PostCard key={post.id} post={post} onUpdate={() => loadUserPosts()} />
              ))
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="space-y-6">
            {isOwnProfile && (
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreatePet}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-warm-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  添加新宠物
                </motion.button>
              </div>
            )}

            {pets.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Cat className="w-10 h-10 text-primary-300" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">还没有宠物档案</h3>
                <p className="text-neutral-500">
                  {isOwnProfile ? '创建宠物档案，记录成长点滴吧' : 'Ta还没有添加宠物哦'}
                </p>
                {isOwnProfile && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreatePet}
                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl font-medium hover:shadow-warm-lg transition-all"
                  >
                    <Plus className="w-5 h-5" />
                    创建第一只宠物
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {pets.map((pet, petIdx) => {
                  const healthData = petHealthData[pet.id] || { vaccine: 0, deworming: 0, weight: 0 };
                  const relatedPosts = petPosts[pet.id] || [];
                  const latestPhoto = pet.photos?.[0];
                  
                  return (
                    <motion.div
                      key={pet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: petIdx * 0.08 }}
                      className="bg-white rounded-3xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-shadow"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-64 relative">
                          <Link 
                            to={`/pets/${pet.id}`}
                            className="block h-48 md:h-full relative overflow-hidden"
                          >
                            <img
                              src={pet.avatar || generatePetImage(pet.species, pet.id.toString())}
                              alt={pet.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getSpeciesColor(pet.species)}`}>
                                {getSpeciesName(pet.species)}
                              </span>
                            </div>
                          </Link>
                        </div>

                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <Link to={`/pets/${pet.id}`}>
                                <h3 className="font-bold text-xl text-neutral-800 hover:text-primary-500 transition-colors">
                                  {pet.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-3 text-sm text-neutral-500 mt-1">
                                <span className={cn(
                                  'inline-flex items-center gap-1',
                                  pet.gender === 'male' ? 'text-blue-500' : 'text-pink-500'
                                )}>
                                  <span className={cn(
                                    'w-2 h-2 rounded-full',
                                    pet.gender === 'male' ? 'bg-blue-400' : 'bg-pink-400'
                                  )} />
                                  {pet.gender === 'male' ? '男孩' : '女孩'}
                                </span>
                                {pet.breed && <span>{pet.breed}</span>}
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {pet.age}岁
                                </span>
                              </div>
                              {pet.birthday && (
                                <div className="text-xs text-neutral-400 mt-1">
                                  生日：{formatDate(pet.birthday)}
                                </div>
                              )}
                            </div>
                            {isOwnProfile && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => navigate(`/health?petId=${pet.id}`)}
                                  className="px-3 py-1.5 text-sm text-secondary-600 bg-secondary-50 rounded-xl hover:bg-secondary-100 transition-colors flex items-center gap-1.5"
                                >
                                  <HeartPulse className="w-4 h-4" />
                                  健康
                                </button>
                                <button
                                  onClick={() => navigate(`/pets/${pet.id}/edit`)}
                                  className="px-3 py-1.5 text-sm text-primary-600 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
                                >
                                  编辑
                                </button>
                              </div>
                            )}
                          </div>

                          {pet.bio && (
                            <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{pet.bio}</p>
                          )}

                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-3 bg-blue-50 rounded-2xl text-center">
                              <div className="text-lg font-bold text-blue-600">{healthData.vaccine}</div>
                              <div className="text-xs text-blue-500">疫苗</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-2xl text-center">
                              <div className="text-lg font-bold text-green-600">{healthData.deworming}</div>
                              <div className="text-xs text-green-500">驱虫</div>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-2xl text-center">
                              <div className="text-lg font-bold text-purple-600">{healthData.weight}</div>
                              <div className="text-xs text-purple-500">体重</div>
                            </div>
                          </div>

                          {latestPhoto && (
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5" />
                                  最近照片
                                  {latestPhoto.createdAt && (
                                    <span className="text-neutral-400">· {formatDateTime(latestPhoto.createdAt)}</span>
                                  )}
                                </div>
                                <Link 
                                  to={`/pets/${pet.id}`}
                                  className="text-xs text-primary-500 hover:text-primary-600"
                                >
                                  查看全部
                                </Link>
                              </div>
                              <Link to={`/pets/${pet.id}`}>
                                <div className="aspect-video rounded-2xl overflow-hidden">
                                  <img
                                    src={latestPhoto.image}
                                    alt={latestPhoto.caption || pet.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              </Link>
                              {latestPhoto.caption && (
                                <p className="text-sm text-neutral-600 mt-2">{latestPhoto.caption}</p>
                              )}
                            </div>
                          )}

                          {relatedPosts.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-xs font-medium text-neutral-500 flex items-center gap-1.5">
                                  <Newspaper className="w-3.5 h-3.5" />
                                  相关动态
                                </div>
                                <span className="text-xs text-neutral-400">共 {relatedPosts.length} 条</span>
                              </div>
                              <div className="space-y-2">
                                {relatedPosts.slice(0, 2).map(post => (
                                  <Link
                                    key={post.id}
                                    to={`/post/${post.id}`}
                                    className="block p-3 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-colors"
                                  >
                                    <div className="flex gap-3">
                                      {post.images?.[0] && (
                                        <img
                                          src={post.images[0]}
                                          alt=""
                                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-neutral-700 line-clamp-2">
                                          {post.content}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                          {timeAgo(post.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'favorites' && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500">收藏功能开发中...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
