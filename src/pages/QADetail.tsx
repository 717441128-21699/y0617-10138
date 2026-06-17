import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, HeartPulse, Plus, Clock, Award, CheckCircle, 
  Send, User, Calendar, Eye, MessageSquare
} from 'lucide-react';
import Layout from '../components/Layout';
import { qaApi } from '../api';
import type { Question } from '../types';
import { getQaCategoryName, timeAgo, formatDateTime } from '../utils';
import { useAuthStore } from '../store/auth';

export default function QADetail() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  const loadQuestion = async () => {
    if (!questionId) return;
    setLoading(true);
    try {
      const data = await qaApi.getById(parseInt(questionId));
      setQuestion(data);
    } catch (e) {
      console.error('Load question error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !questionId || !isAuthenticated) return;

    setSubmitting(true);
    try {
      await qaApi.addAnswer(parseInt(questionId), {
        content: answerText.trim(),
      });
      setAnswerText('');
      loadQuestion();
    } catch (e) {
      console.error('Submit answer error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptAnswer = async (answerId: number) => {
    if (!questionId || !user || question?.user.id !== user.id) return;
    if (window.confirm('确定采纳这个回答吗？')) {
      try {
        await qaApi.acceptAnswer(parseInt(questionId), answerId);
        loadQuestion();
      } catch (e) {
        console.error('Accept answer error:', e);
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-3 border-secondary-200 border-t-secondary-500 rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-neutral-500">问题不存在</p>
          <button onClick={() => navigate('/qa')} className="mt-4 text-secondary-500">
            返回问答列表
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/qa')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <h2 className="font-display text-2xl font-bold text-neutral-800">问题详情</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-secondary-100 text-secondary-600 rounded-full text-sm">
                {getQaCategoryName(question.category)}
              </span>
              {question.rewardPoints > 0 && (
                <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm">
                  <Award className="w-4 h-4" />
                  悬赏 {question.rewardPoints} 积分
                </span>
              )}
              {question.isAnswered && (
                <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                  <CheckCircle className="w-4 h-4" />
                  已解决
                </span>
              )}
            </div>

            <h1 className="font-bold text-2xl text-neutral-800 mb-4">{question.title}</h1>
            <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap mb-6">
              {question.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${question.user.id}`}>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-100">
                    <img
                      src={question.user.avatar}
                      alt={question.user.nickname}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>
                <div>
                  <Link
                    to={`/profile/${question.user.id}`}
                    className="font-medium text-neutral-800 hover:text-secondary-600 transition-colors"
                  >
                    {question.user.nickname}
                  </Link>
                  {question.user.isVet && (
                    <span className="ml-2 text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">
                      认证兽医
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {timeAgo(question.createdAt)}
                  <span className="text-neutral-400 text-xs">· {formatDateTime(question.createdAt)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {question.viewCount}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="font-bold text-lg text-neutral-800 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-secondary-500" />
              回答 ({question.answers.length})
            </h3>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitAnswer} className="mb-6">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="写下你的回答..."
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 rounded-xl border border-neutral-200 focus:border-secondary-400 focus:ring-2 focus:ring-secondary-100 outline-none transition-all resize-none"
                />
                <div className="flex justify-end mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!answerText.trim() || submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? '提交中...' : '提交回答'}
                  </motion.button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 mb-6 bg-neutral-50 rounded-xl">
                <p className="text-sm text-neutral-500">
                  登录后即可回答问题
                  <button
                    onClick={() => navigate('/login')}
                    className="text-secondary-500 ml-2 hover:underline"
                  >
                    去登录
                  </button>
                </p>
              </div>
            )}

            <div className="space-y-4">
              {question.answers.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  暂无回答，快来帮助这位宠物主吧～
                </div>
              ) : (
                question.answers.map((answer, idx) => (
                  <motion.div
                    key={answer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      answer.isAccepted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-neutral-100 hover:border-secondary-200'
                    }`}
                  >
                    {answer.isAccepted && (
                      <div className="flex items-center gap-2 mb-3 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">已被采纳为最佳回答</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Link to={`/profile/${answer.user.id}`}>
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-secondary-100">
                            <img
                              src={answer.user.avatar}
                              alt={answer.user.nickname}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </Link>
                        <div>
                          <Link
                            to={`/profile/${answer.user.id}`}
                            className="font-medium text-neutral-800 hover:text-secondary-600 transition-colors"
                          >
                            {answer.user.nickname}
                          </Link>
                          {answer.user.isVet && (
                            <span className="ml-2 text-xs bg-secondary-100 text-secondary-600 px-1.5 py-0.5 rounded">
                              认证兽医
                            </span>
                          )}
                          <div className="text-xs text-neutral-400">
                            {timeAgo(answer.createdAt)} · {formatDateTime(answer.createdAt)}
                          </div>
                        </div>
                      </div>

                      {!question.isAnswered && user?.id === question.user.id && (
                        <button
                          onClick={() => handleAcceptAnswer(answer.id)}
                          className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          采纳
                        </button>
                      )}
                    </div>

                    <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                      {answer.content}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
