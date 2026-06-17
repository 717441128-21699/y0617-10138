import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PawPrint, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../api';
import { useAuthStore } from '../store/auth';
import { generateAvatar } from '../utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.token, response.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@pet.com');
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-soft-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 mb-4">
              <PawPrint className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              欢迎回来
            </h1>
            <p className="text-neutral-500 mt-2">登录您的萌宠乐园账号</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">邮箱</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-neutral-600">
                <input type="checkbox" className="rounded text-primary-500 focus:ring-primary-400" />
                记住我
              </label>
              <button type="button" className="text-primary-500 hover:text-primary-600">
                忘记密码？
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-warm-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </motion.button>
          </form>

          <div className="mt-4">
            <button
              onClick={handleDemoLogin}
              className="w-full py-2 bg-secondary-50 text-secondary-600 rounded-xl text-sm font-medium hover:bg-secondary-100 transition-colors"
            >
              使用演示账号登录 (demo@pet.com / 123456)
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-neutral-500">
            还没有账号？{' '}
            <Link to="/register" className="text-primary-500 font-medium hover:text-primary-600">
              立即注册
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
