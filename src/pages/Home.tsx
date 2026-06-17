import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cat, Dog, Bird, Bug, PawPrint, TrendingUp, Clock, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import { postApi } from '../api';
import type { Post } from '../types';
import { SPECIES_CATEGORIES } from '../types';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSpecies, setActiveSpecies] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest');
  const [showFollowing, setShowFollowing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { isAuthenticated } = useAuthStore();

  const loadPosts = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await postApi.getAll({
        page: currentPage,
        limit: 10,
        sort: sortBy,
        species: activeSpecies || undefined,
        following: isAuthenticated && showFollowing,
      });
      
      if (reset) {
        setPosts(response.posts);
        setPage(2);
      } else {
        setPosts(prev => [...prev, ...response.posts]);
        setPage(prev => prev + 1);
      }
      setHasMore(response.hasMore);
    } catch (e) {
      console.error('Load posts error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(true);
  }, [activeSpecies, sortBy, showFollowing]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  const handlePostUpdate = () => {
    loadPosts(true);
  };

  const speciesIcons: Record<string, React.ReactNode> = {
    cat: <Cat className="w-5 h-5" />,
    dog: <Dog className="w-5 h-5" />,
    bird: <Bird className="w-5 h-5" />,
    reptile: <Bug className="w-5 h-5" />,
    other: <PawPrint className="w-5 h-5" />,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <h2 className="font-display text-2xl font-bold text-neutral-800 mb-4">
            {isAuthenticated && showFollowing ? '我的关注' : '推荐动态'}
          </h2>
          
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => setActiveSpecies(null)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                activeSpecies === null
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-warm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              <PawPrint className="w-5 h-5" />
              全部
            </button>
            {SPECIES_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveSpecies(activeSpecies === cat.id ? null : cat.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full transition-all',
                  activeSpecies === cat.id
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-warm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {speciesIcons[cat.id]}
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortBy('latest')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  sortBy === 'latest'
                    ? 'bg-primary-100 text-primary-600 font-medium'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Clock className="w-4 h-4" />
                最新
              </button>
              <button
                onClick={() => setSortBy('hot')}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  sortBy === 'hot'
                    ? 'bg-primary-100 text-primary-600 font-medium'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <TrendingUp className="w-4 h-4" />
                热门
              </button>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={() => setShowFollowing(!showFollowing)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                  showFollowing
                    ? 'bg-secondary-100 text-secondary-600 font-medium'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                <Filter className="w-4 h-4" />
                仅看关注
              </button>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <PostCard post={post} onUpdate={handlePostUpdate} />
            </motion.div>
          ))}
          
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          )}
          
          {!loading && posts.length === 0 && (
            <div className="text-center py-16">
              <PawPrint className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无动态，快去关注更多宠物主吧～</p>
            </div>
          )}
          
          {!loading && hasMore && (
            <button
              onClick={loadMore}
              className="w-full py-3 text-primary-500 hover:bg-primary-50 rounded-xl transition-colors"
            >
              加载更多
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
