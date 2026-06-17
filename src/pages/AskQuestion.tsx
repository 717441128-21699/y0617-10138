import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { qaApi, petApi } from '../api';
import { QA_CATEGORIES } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function AskQuestion() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(QA_CATEGORIES[0].id);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('请填写标题和问题内容');
      return;
    }

    if (rewardPoints > user?.points) {
      alert('积分不足');
      return;
    }

    setLoading(true);
    try {
      const question = await qaApi.create({
        title: title.trim(),
        content: content.trim(),
        category,
        rewardPoints,
      });
      navigate(`/qa/${question.id}`);
    } catch (e: any) {
      alert(e.response?.data?.error || '发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

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
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">发起提问</h2>
            <p className="text-neutral-500 text-sm">描述你的养宠问题，获取专业解答</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">问题分类 *</label>
            <div className="grid grid-cols-2 gap-2">
              {QA_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    'p-3 rounded-xl text-sm font-medium transition-all text-left',
                    category === cat.id
                      ? 'bg-secondary-100 text-secondary-600 ring-2 ring-secondary-400'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">问题标题 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="简明扼要地描述你的问题"
              maxLength={100}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all"
            />
            <div className="text-right text-xs text-neutral-400 mt-1">{title.length}/100</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">问题详情 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述问题背景、症状等信息，有助于获得更准确的回答..."
              rows={8}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              悬赏积分
              <span className="text-xs text-neutral-400 font-normal ml-2">
                （我的积分：{user?.points || 0}）
              </span>
            </label>
            <div className="flex items-center gap-2">
              {[0, 10, 20, 50, 100].map(points => (
                <button
                  key={points}
                  type="button"
                  onClick={() => setRewardPoints(points)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                    rewardPoints === points
                      ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  )}
                >
                  {points === 0 ? '不悬赏' : `${points}积分`}
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              悬赏的积分将在采纳回答时奖励给回答者，优质回答更易获得关注
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="w-full py-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '发布中...' : '发布问题'}
          </motion.button>
        </form>
      </div>
    </Layout>
  );
}
