import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Cat, Dog, Bird, Bug, PawPrint, Save, Upload } from 'lucide-react';
import Layout from '../components/Layout';
import { petApi, uploadImage } from '../api';
import type { Pet } from '../types';
import { generatePetImage } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

const speciesOptions = [
  { id: 'cat', name: '猫咪', icon: Cat, color: 'bg-accent-pink text-pink-600' },
  { id: 'dog', name: '狗狗', icon: Dog, color: 'bg-accent-yellow text-yellow-700' },
  { id: 'bird', name: '鸟类', icon: Bird, color: 'bg-accent-blue text-blue-600' },
  { id: 'reptile', name: '爬宠', icon: Bug, color: 'bg-secondary-200 text-secondary-700' },
  { id: 'other', name: '其他', icon: PawPrint, color: 'bg-accent-purple text-purple-600' },
];

const genderOptions = [
  { id: 'male', name: '男孩', color: 'bg-blue-100 text-blue-600' },
  { id: 'female', name: '女孩', color: 'bg-pink-100 text-pink-600' },
];

export default function PetForm() {
  const { petId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  const isEdit = !!petId;
  const fromRegister = (location.state as any)?.fromRegister;

  const [formData, setFormData] = useState({
    name: '',
    species: 'cat',
    breed: '',
    gender: 'male',
    birthday: '',
    avatar: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (isEdit) {
      loadPet();
    }
  }, [isAuthenticated, isEdit]);

  const loadPet = async () => {
    if (!petId) return;
    setLoading(true);
    try {
      const pet = await petApi.getById(parseInt(petId));
      setFormData({
        name: pet.name,
        species: pet.species,
        breed: pet.breed,
        gender: pet.gender,
        birthday: pet.birthday,
        avatar: pet.avatar,
        bio: pet.bio,
      });
      setAvatarPreview(pet.avatar || generatePetImage(pet.species, pet.id.toString()));
    } catch (e) {
      console.error('Load pet error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadImage(file);
        setAvatarPreview(url);
        setFormData(prev => ({ ...prev, avatar: url }));
      } catch (e) {
        console.error('Upload avatar error:', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('请输入宠物名称');
      return;
    }

    setSaveLoading(true);
    try {
      const avatarUrl = formData.avatar || generatePetImage(formData.species, Date.now().toString());
      
      if (isEdit && petId) {
        await petApi.update(parseInt(petId), {
          ...formData,
          avatar: avatarUrl,
        });
        navigate(`/pets/${petId}`, { replace: true });
      } else {
        await petApi.create({
          ...formData,
          avatar: avatarUrl,
        });
        if (fromRegister) {
          navigate('/', { replace: true });
        } else {
          navigate('/pets', { replace: true });
        }
      }
    } catch (e: any) {
      alert(e.response?.data?.error || '保存失败，请重试');
    } finally {
      setSaveLoading(false);
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(fromRegister ? '/' : (isEdit && petId ? `/pets/${petId}` : '/pets'), { replace: true })}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold text-neutral-800">
              {isEdit ? '编辑宠物档案' : (fromRegister ? '欢迎加入！创建您的第一只宠物档案' : '创建宠物档案')}
            </h2>
            <p className="text-neutral-500 text-sm">
              {fromRegister ? '完成后即可开始分享宠物日常' : '为您的爱宠建立专属档案'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft p-6 space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-primary-100 shadow-soft">
                <img
                  src={avatarPreview || generatePetImage(formData.species, 'preview')}
                  alt="头像预览"
                  className="w-full h-full object-cover"
                />
              </div>
              <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors shadow-warm">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">宠物名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="请输入宠物名称"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">宠物种类 *</label>
            <div className="grid grid-cols-5 gap-3">
              {speciesOptions.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, species: option.id }));
                    setAvatarPreview(generatePetImage(option.id, 'preview'));
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-2xl transition-all',
                    formData.species === option.id
                      ? 'bg-primary-100 ring-2 ring-primary-400'
                      : 'bg-neutral-50 hover:bg-neutral-100'
                  )}
                >
                  <option.icon className={cn('w-6 h-6', formData.species === option.id ? 'text-primary-600' : 'text-neutral-500')} />
                  <span className={cn('text-xs font-medium', formData.species === option.id ? 'text-primary-600' : 'text-neutral-600')}>
                    {option.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">品种</label>
              <input
                type="text"
                name="breed"
                value={formData.breed}
                onChange={handleChange}
                placeholder="如：英国短毛猫"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">性别</label>
              <div className="flex gap-3">
                {genderOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gender: option.id }))}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      formData.gender === option.id
                        ? option.color + ' ring-2 ring-offset-2'
                        : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                    )}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">出生日期</label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">宠物简介</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="介绍一下您的爱宠吧..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={saveLoading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-warm-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saveLoading ? '保存中...' : (isEdit ? '保存修改' : '创建档案')}
          </motion.button>
        </form>
      </div>
    </Layout>
  );
}
