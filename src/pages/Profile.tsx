import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, User as UserIcon, Cat, Heart, Newspaper, Award, 
  Settings, UserPlus, UserCheck, Edit3
} from 'lucide-react';
import Layout from '../components/Layout';
import { userApi } from '../api';
import type { User, Post, Pet } from '../types';
import { generatePetImage, timeAgo } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posts' | 'pets' | 'favorites'>('posts');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile = currentUser?.id === parseInt(userId || '0');

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
  }, [userId, activeTab]);

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
      <div className="max-w-3xl mx-auto space-y-6">
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
              <div className="text-center">
                <div className="text-2xl font-bold text-neutral-800">{posts.length}</div>
                <div className="text-sm text-neutral-500">动态</div>
              </div>
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
              { id: 'pets', label: '宠物', icon: Cat },
              { id: 'favorites', label: '收藏', icon: Heart },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pets.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-soft">
                <Cat className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">暂无宠物档案</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/pets/new')}
                    className="mt-4 px-5 py-2 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                  >
                    创建宠物档案
                  </button>
                )}
              </div>
            ) : (
              pets.map((pet, idx) => (
                <motion.div
                  key={pet.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    to={`/pets/${pet.id}`}
                    className="block bg-white rounded-2xl shadow-soft overflow-hidden hover:shadow-soft-lg transition-shadow"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img
                        src={pet.avatar || generatePetImage(pet.species, pet.id.toString())}
                        alt={pet.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg text-neutral-800">{pet.name}</h3>
                      <p className="text-sm text-neutral-500">{pet.breed}</p>
                    </div>
                  </Link>
                </motion.div>
              ))
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
