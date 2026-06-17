import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Image, Hash, Send, X, Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { postApi, petApi, uploadImage } from '../api';
import type { Pet } from '../types';
import { getSpeciesColor, generatePetImage } from '../utils';
import { useAuthStore } from '../store/auth';
import { cn } from '../lib/utils';

export default function CreatePost() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPets, setSelectedPets] = useState<number[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadPets();
  }, [isAuthenticated]);

  const loadPets = async () => {
    try {
      const response = await petApi.getAll();
      setPets(response.pets);
    } catch (e) {
      console.error('Load pets error:', e);
    }
  };

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

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const togglePet = (petId: number) => {
    setSelectedPets(prev => 
      prev.includes(petId) 
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) {
      alert('请输入内容或上传图片');
      return;
    }

    setLoading(true);
    try {
      await postApi.create({
        content: content.trim(),
        images,
        tags,
        petIds: selectedPets,
      });
      navigate('/square');
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
            <h2 className="font-display text-2xl font-bold text-neutral-800">发布动态</h2>
            <p className="text-neutral-500 text-sm">分享您和爱宠的美好瞬间</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-soft p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary-100 flex-shrink-0">
              <img
                src={user?.avatar || generatePetImage('cat', 'user')}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-neutral-800">{user?.nickname}</div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你和爱宠的故事..."
                rows={5}
                className="w-full mt-2 border-none outline-none resize-none text-neutral-700 placeholder:text-neutral-400"
              />
            </div>
          </div>

          {images.length > 0 && (
            <div className={`grid gap-2 ${
              images.length === 1 ? 'grid-cols-1' :
              images.length === 2 ? 'grid-cols-2' :
              images.length === 3 ? 'grid-cols-3' :
              'grid-cols-3'
            }`}>
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 9 && (
            <div>
              <label className="flex flex-col items-center justify-center gap-2 py-8 border-2 border-dashed border-neutral-200 rounded-2xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-colors">
                <Image className="w-8 h-8 text-neutral-400" />
                <span className="text-sm text-neutral-500">
                  {uploadingImage ? '上传中...' : '点击上传图片（最多9张）'}
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
            </div>
          )}

          {pets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">关联宠物</label>
              <div className="flex flex-wrap gap-2">
                {pets.map(pet => (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => togglePet(pet.id)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl transition-all',
                      selectedPets.includes(pet.id)
                        ? 'bg-primary-100 ring-2 ring-primary-400'
                        : 'bg-neutral-50 hover:bg-neutral-100'
                    )}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden">
                      <img
                        src={pet.avatar || generatePetImage(pet.species, pet.id.toString())}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className={cn(
                      'text-sm font-medium',
                      selectedPets.includes(pet.id) ? 'text-primary-600' : 'text-neutral-600'
                    )}>
                      {pet.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <Hash className="w-4 h-4 inline mr-1" />
              添加话题标签
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="输入标签后按回车添加（最多5个）"
                className="flex-1 px-4 py-2 rounded-xl border border-neutral-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
                className="px-4 py-2 bg-primary-100 text-primary-600 rounded-xl text-sm font-medium hover:bg-primary-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
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
            {loading ? '发布中...' : '发布动态'}
          </motion.button>
        </form>
      </div>
    </Layout>
  );
}
