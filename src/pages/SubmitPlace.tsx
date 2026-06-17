import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, MapPin, Upload, X, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { placeApi, uploadImage } from '../api';
import { PLACE_TYPES } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function SubmitPlace() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    type: 'hospital',
    address: '',
    phone: '',
    businessHours: '',
    description: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    for (const file of Array.from(files)) {
      if (images.length >= 9) {
        alert('最多只能上传9张图片');
        break;
      }
      
      setUploadingImage(true);
      try {
        const url = await uploadImage(file);
        setImages(prev => [...prev, url]);
      } catch (e) {
        console.error('Upload image error:', e);
        alert('图片上传失败');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('请填写场所名称和地址');
      return;
    }

    setLoading(true);
    try {
      await placeApi.create({
        ...formData,
        images,
      });
      navigate('/nearby');
    } catch (e: any) {
      alert(e.response?.data?.error || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const typeIcons: Record<string, React.ReactNode> = {
    hospital: '🏥',
    boarding: '🏠',
    friendly: '☕',
  };

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
            <h2 className="font-display text-2xl font-bold text-neutral-800">提交场所</h2>
            <p className="text-neutral-500 text-sm">分享你发现的优质宠物服务场所</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">场所类型 *</label>
            <div className="grid grid-cols-3 gap-3">
              {PLACE_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  className={cn(
                    'p-4 rounded-2xl flex flex-col items-center gap-2 transition-all',
                    formData.type === type.id
                      ? 'bg-primary-100 ring-2 ring-primary-400'
                      : 'bg-neutral-50 hover:bg-neutral-100'
                  )}
                >
                  <span className="text-2xl">{typeIcons[type.id]}</span>
                  <span className={cn(
                    'text-sm font-medium',
                    formData.type === type.id ? 'text-primary-600' : 'text-neutral-600'
                  )}>
                    {type.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">场所名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="请输入场所名称"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">详细地址 *</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="请输入详细地址"
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">联系电话</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="请输入联系电话"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">营业时间</label>
              <input
                type="text"
                name="businessHours"
                value={formData.businessHours}
                onChange={handleChange}
                placeholder="如：9:00-21:00"
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">场所介绍</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="请简单介绍这个场所的服务、环境等..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">上传照片</label>
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {images.length < 9 && (
              <label className="flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-colors">
                <Upload className="w-6 h-6 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {uploadingImage ? '上传中...' : '点击上传照片（最多9张）'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-warm-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '提交中...' : '提交场所'}
          </motion.button>
        </form>
      </div>
    </Layout>
  );
}
