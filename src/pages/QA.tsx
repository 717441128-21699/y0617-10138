import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, Plus, TrendingUp, Clock, CheckCircle, Award, ArrowRight } from 'lucide-react';
import Layout from '../components/Layout';
import { qaApi } from '../api';
import type { Question } from '../types';
import { QA_CATEGORIES, getQaCategoryName, timeAgo } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function QA() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'hot' | 'unanswered'>('latest');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadQuestions();
  }, [activeCategory, sortBy]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await qaApi.getAll({
        category: activeCategory || undefined,
        sort: sortBy,
      });
      setQuestions(response.questions);
    } catch (e) {
      console.error('Load questions error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">养宠问答</h2>
            <p className="text-neutral-500 mt-1">提问养宠问题，获得专业解答</p>
          </div>
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/qa/ask')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-2xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              发起提问
            </motion.button>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeCategory === null
                  ? 'bg-secondary-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              全部
            </button>
            {QA_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeCategory === cat.id
                    ? 'bg-secondary-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                sortBy === 'latest' ? 'bg-secondary-100 text-secondary-600 font-medium' : 'text-neutral-500'
              )}
            >
              <Clock className="w-4 h-4" />
              最新
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                sortBy === 'hot' ? 'bg-secondary-100 text-secondary-600 font-medium' : 'text-neutral-500'
              )}
            >
              <TrendingUp className="w-4 h-4" />
              热门
            </button>
            <button
              onClick={() => setSortBy('unanswered')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                sortBy === 'unanswered' ? 'bg-secondary-100 text-secondary-600 font-medium' : 'text-neutral-500'
              )}
            >
              <MessageCircleQuestion className="w-4 h-4" />
              待回答
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-3 border-secondary-200 border-t-secondary-500 rounded-full animate-spin"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-soft">
              <MessageCircleQuestion className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">暂无问题，快来发起第一个提问吧～</p>
            </div>
          ) : (
            questions.map((question, idx) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link
                  to={`/qa/${question.id}`}
                  className="block bg-white rounded-2xl shadow-soft p-5 hover:shadow-soft-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-secondary-100 text-secondary-600 rounded-full text-xs">
                          {getQaCategoryName(question.category)}
                        </span>
                        {question.rewardPoints > 0 && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-xs">
                            <Award className="w-3 h-3" />
                            {question.rewardPoints}积分
                          </span>
                        )}
                        {question.isAnswered && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-600 rounded-full text-xs">
                            <CheckCircle className="w-3 h-3" />
                            已解决
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-neutral-800 mb-2 hover:text-secondary-600 transition-colors">
                        {question.title}
                      </h3>
                      <p className="text-sm text-neutral-500 line-clamp-2">{question.content}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-300 ml-4 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        <img
                          src={question.user.avatar}
                          alt={question.user.nickname}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm text-neutral-600">{question.user.nickname}</span>
                      {question.user.isVet && (
                        <span className="text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">
                          兽医
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      <span>{timeAgo(question.createdAt)}</span>
                      <span>{question.answerCount} 回答</span>
                      <span>{question.viewCount} 浏览</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
