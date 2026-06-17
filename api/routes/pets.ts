import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { formatUser, formatPet } from './auth.js';
import { calculateAge } from '../utils/index.js';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const pets = db.findMany('pets', (p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    res.json({
      total: pets.length,
      pets: pets.map((p: any) => formatPet(p)),
    });
  } catch (e) {
    console.error('Get pets error:', e);
    res.status(500).json({ error: '获取宠物列表失败' });
  }
});

router.get('/:petId', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const petId = parseInt(req.params.petId);
    
    const pet = db.getById('pets', petId);
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }
    
    res.json(formatPet(pet));
  } catch (e) {
    console.error('Get pet error:', e);
    res.status(500).json({ error: '获取宠物详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { name, species, breed, gender, birthday, avatar, bio } = req.body;
    const userId = req.user!.userId;
    
    if (!name || !species) {
      return res.status(400).json({ error: '请填写宠物名称和种类' });
    }
    
    const pet = db.insert('pets', {
      user_id: userId,
      name: name.trim(),
      species,
      breed: breed || '',
      gender: gender || '',
      birthday: birthday || null,
      avatar: avatar || '',
      bio: bio || '',
    });
    
    res.json(formatPet(pet));
  } catch (e) {
    console.error('Create pet error:', e);
    res.status(500).json({ error: '创建宠物档案失败' });
  }
});

router.put('/:petId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const userId = req.user!.userId;
    const { name, species, breed, gender, birthday, avatar, bio } = req.body;
    
    const pet = db.getById('pets', petId);
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }
    
    if (pet.user_id !== userId) {
      return res.status(403).json({ error: '无权编辑此宠物' });
    }
    
    const updates: any = {};
    if (name) updates.name = name.trim();
    if (species) updates.species = species;
    if (breed !== undefined) updates.breed = breed;
    if (gender !== undefined) updates.gender = gender;
    if (birthday !== undefined) updates.birthday = birthday;
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    
    const updatedPet = db.update('pets', petId, updates);
    
    res.json(formatPet(updatedPet));
  } catch (e) {
    console.error('Update pet error:', e);
    res.status(500).json({ error: '更新宠物档案失败' });
  }
});

router.delete('/:petId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const userId = req.user!.userId;
    
    const pet = db.getById('pets', petId);
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }
    
    if (pet.user_id !== userId) {
      return res.status(403).json({ error: '无权删除此宠物' });
    }
    
    db.removeMany('petPhotos', (p: any) => p.pet_id === petId);
    db.removeMany('weightRecords', (r: any) => r.pet_id === petId);
    db.removeMany('vaccineRecords', (r: any) => r.pet_id === petId);
    db.removeMany('dewormingRecords', (r: any) => r.pet_id === petId);
    db.removeMany('postPets', (pp: any) => pp.pet_id === petId);
    db.remove('pets', petId);
    
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    console.error('Delete pet error:', e);
    res.status(500).json({ error: '删除宠物档案失败' });
  }
});

router.post('/:petId/photos', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const userId = req.user!.userId;
    const { image, caption, date } = req.body;
    
    const pet = db.getById('pets', petId);
    if (!pet) {
      return res.status(404).json({ error: '宠物不存在' });
    }
    
    if (pet.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此宠物' });
    }
    
    if (!image) {
      return res.status(400).json({ error: '请上传照片' });
    }
    
    const photo = db.insert('petPhotos', {
      pet_id: petId,
      image,
      caption: caption || '',
      date: date || new Date().toISOString().split('T')[0],
    });
    
    res.json({
      id: photo.id,
      petId: photo.pet_id,
      image: photo.image,
      caption: photo.caption,
      date: photo.date,
      createdAt: photo.created_at,
    });
  } catch (e) {
    console.error('Add pet photo error:', e);
    res.status(500).json({ error: '添加照片失败' });
  }
});

router.delete('/:petId/photos/:photoId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const petId = parseInt(req.params.petId);
    const photoId = parseInt(req.params.photoId);
    const userId = req.user!.userId;
    
    const pet = db.getById('pets', petId);
    if (!pet || pet.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此照片' });
    }
    
    const photo = db.getById('petPhotos', photoId);
    if (!photo || photo.pet_id !== petId) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    db.remove('petPhotos', photoId);
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    console.error('Delete pet photo error:', e);
    res.status(500).json({ error: '删除照片失败' });
  }
});

export { router as petRouter };
export default router;
