import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Clock, Hash, Search } from 'lucide-react';
import Layout from '../components/Layout';
import PostCard from '../components/PostCard';
import { postApi } from '../api';
import type { Post } from '../types';
import { cn } from '../lib/utils';

export default function Square() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'latest' | 'hot'>('latest');
  const [hotTags, setHotTags] = useState<{ tag: string; count: number }[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadHotTags();
  }, []);

  useEffect(() => {
    loadPosts(true);
  }, [sortBy, activeTag]);

  const loadHotTags = async () => {
    try {
      const response = await postApi.getHotTags();
      setHotTags(response.tags);
    } catch (e) {
      console.error('Load hot tags error:', e);
    }
  };

  const loadPosts = async (reset = false) => {
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await postApi.getAll({
        page: currentPage,
        limit: 10,
        sort: sortBy,
        tag: activeTag || undefined,
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

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPosts();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-neutral-800">
            动态广场
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                sortBy === 'latest'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              <Clock className="w-4 h-4" />
              最新
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                sortBy === 'hot'
                  ? 'bg-primary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              <Flame className="w-4 h-4" />
              热门
            </button>
          </div>
        </div>
        
        <div className="relative mb-4">
          <div className="flex items-center gap-2 bg-neutral-100 rounded-xl px-4 py-3">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索话题、内容..."
              className="bg-transparent border-none outline-none flex-1"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4 text-neutral-400" />
          <span className="text-sm text-neutral-500">热门话题</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors',
              activeTag === null
                ? 'bg-primary-100 text-primary-600'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            全部
          </button>
          {hotTags.slice(0, 12).map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm transition-colors',
                activeTag === tag
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              #{tag}
            </button>
          ))}
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
            <PostCard post={post} />
          </motion.div>
        ))}
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
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
