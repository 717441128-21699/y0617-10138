import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Compass, 
  PawPrint, 
  MessageCircleQuestion, 
  HeartPulse, 
  MapPin, 
  User, 
  Bell, 
  Plus,
  LogOut,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    { path: '/', label: '首页', icon: Home },
    { path: '/square', label: '广场', icon: Compass },
    { path: '/pets', label: '宠物', icon: PawPrint },
    { path: '/qa', label: '问答', icon: MessageCircleQuestion },
    { path: '/health', label: '健康', icon: HeartPulse },
    { path: '/nearby', label: '同城', icon: MapPin },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreatePost = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/create-post');
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <span className="font-display text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                萌宠乐园
              </span>
            </NavLink>
            
            <div className="hidden md:flex items-center gap-1 bg-neutral-100 rounded-full px-4 py-2 w-80">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="搜索动态、用户、话题..."
                className="bg-transparent border-none outline-none flex-1 text-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <button className="relative p-2 hover:bg-neutral-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5 text-neutral-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreatePost}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full font-medium hover:shadow-warm-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">发布动态</span>
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <NavLink to="/profile" className="flex items-center gap-2 hover:bg-neutral-100 rounded-full px-3 py-1 transition-colors">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-200">
                      <img 
                        src={user?.avatar || generateAvatar(user?.id?.toString())} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">{user?.nickname}</span>
                  </NavLink>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink 
                  to="/login" 
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-primary-500 transition-colors"
                >
                  登录
                </NavLink>
                <NavLink 
                  to="/register" 
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-full hover:bg-primary-600 transition-colors"
                >
                  注册
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="flex gap-6">
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all',
                    isActive 
                      ? 'bg-gradient-to-r from-primary-500/10 to-secondary-500/10 text-primary-600 font-medium' 
                      : 'text-neutral-600 hover:bg-white hover:shadow-soft'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              
              {isAuthenticated && (
                <div className="mt-6 pt-6 border-t border-neutral-200">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-neutral-500 hover:bg-white hover:text-red-500 rounded-2xl transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </nav>
          </aside>
          
          <main className="flex-1 min-w-0">
            {children}
          </main>
          
          <aside className="hidden xl:block w-72 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {isAuthenticated && user && (
                <div className="bg-white rounded-3xl p-5 shadow-soft">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-200">
                      <img 
                        src={user.avatar || generateAvatar(user.id.toString())} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1">
                        {user.nickname}
                        {user.isVet && (
                          <span className="text-xs bg-secondary-100 text-secondary-600 px-2 py-0.5 rounded-full">
                            认证兽医
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-500">{user.points} 积分</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-warm-50 rounded-xl p-2">
                      <div className="font-bold text-primary-600">{user.followingCount || 0}</div>
                      <div className="text-xs text-neutral-500">关注</div>
                    </div>
                    <div className="bg-warm-50 rounded-xl p-2">
                      <div className="font-bold text-primary-600">{user.followerCount || 0}</div>
                      <div className="text-xs text-neutral-500">粉丝</div>
                    </div>
                    <div className="bg-warm-50 rounded-xl p-2">
                      <div className="font-bold text-primary-600">{user.postCount || 0}</div>
                      <div className="text-xs text-neutral-500">动态</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-3xl p-5 shadow-soft">
                <h3 className="font-display text-lg font-bold mb-4 text-neutral-800">热门话题</h3>
                <div className="space-y-2">
                  {['#猫咪日常', '#狗狗成长记', '#养宠经验分享', '#宠物健康', '#萌宠搞笑瞬间'].map((tag, idx) => (
                    <div 
                      key={tag}
                      className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-warm-50 cursor-pointer transition-colors"
                    >
                      <span className="text-sm font-medium text-neutral-700">{tag}</span>
                      <span className="text-xs text-neutral-400">{(idx + 1) * 123} 动态</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-5 text-white">
                <h3 className="font-display text-lg font-bold mb-2">科学养宠</h3>
                <p className="text-sm text-white/80 mb-4">
                  每天学习一点养宠知识，让爱宠更健康快乐
                </p>
                <button className="w-full py-2 bg-white/20 backdrop-blur rounded-xl text-sm font-medium hover:bg-white/30 transition-colors">
                  查看科普
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
      
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1 px-3 py-1',
                isActive ? 'text-primary-500' : 'text-neutral-400'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={handleCreatePost}
            className="flex flex-col items-center gap-1 px-3 py-1 text-primary-500"
          >
            <div className="w-10 h-10 -mt-4 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-warm">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs">发布</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

function generateAvatar(seed?: string): string {
  const s = seed || Math.random().toString(36).substring(7);
  const prompt = encodeURIComponent(`cute avatar portrait, cartoon style, warm colors, pet lover`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
}
