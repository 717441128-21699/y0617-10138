import { Router } from 'express';
import db from '../db/index.js';
import { generateToken, hashPassword, comparePassword, authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { calculateAge } from '../utils/index.js';

const router = Router();

function formatUser(user: any, currentUserId?: number) {
  const pets = db.findMany('pets', (p: any) => p.user_id === user.id);
  
  const following = db.findMany('follows', (f: any) => f.follower_id === user.id);
  const followers = db.findMany('follows', (f: any) => f.following_id === user.id);
  const posts = db.findMany('posts', (p: any) => p.user_id === user.id);
  
  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    isFollowing = db.findOne('follows', (f: any) => 
      f.follower_id === currentUserId && f.following_id === user.id
    ) !== undefined;
  }
  
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    nickname: user.nickname,
    avatar: user.avatar,
    bio: user.bio,
    points: user.points,
    isVet: !!user.is_vet,
    createdAt: user.created_at,
    followingCount: following.length,
    followerCount: followers.length,
    postCount: posts.length,
    isFollowing,
    pets: pets.map((p: any) => formatPet(p)),
  };
}

function formatPet(pet: any) {
  const photos = db.findMany('petPhotos', (ph: any) => ph.pet_id === pet.id)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return {
    id: pet.id,
    userId: pet.user_id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    gender: pet.gender,
    birthday: pet.birthday,
    avatar: pet.avatar,
    bio: pet.bio,
    createdAt: pet.created_at,
    age: calculateAge(pet.birthday),
    photos: photos.map((ph: any) => ({
      id: ph.id,
      petId: ph.pet_id,
      image: ph.image,
      caption: ph.caption,
      date: ph.date,
      createdAt: ph.created_at,
    })),
  };
}

router.post('/register', async (req, res) => {
  try {
    const { email, phone, password, nickname } = req.body;
    
    if (!email || !password || !nickname) {
      return res.status(400).json({ error: '请填写必要信息' });
    }
    
    const existingUser = db.findOne('users', (u: any) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }
    
    if (phone) {
      const existingPhone = db.findOne('users', (u: any) => u.phone === phone);
      if (existingPhone) {
        return res.status(400).json({ error: '该手机号已被注册' });
      }
    }
    
    const user = db.insert('users', {
      email,
      phone: phone || '',
      password_hash: hashPassword(password),
      nickname,
      avatar: '',
      bio: '',
      points: 100,
      is_vet: 0,
    });
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.json({
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        points: user.points,
        isVet: !!user.is_vet,
      },
    });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: '请填写邮箱和密码' });
    }
    
    const user = db.findOne('users', (u: any) => u.email === email);
    if (!user) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }
    
    if (!comparePassword(password, user.password_hash)) {
      return res.status(400).json({ error: '邮箱或密码错误' });
    }
    
    const token = generateToken({ userId: user.id, email: user.email });
    
    res.json({
      token,
      user: {
        id: user.id,
        nickname: user.nickname,
        avatar: user.avatar,
        points: user.points,
        isVet: !!user.is_vet,
      },
    });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
});

router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = db.getById('users', req.user!.userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(formatUser(user, user.id));
  } catch (e) {
    console.error('Get me error:', e);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

export { router as authRouter, formatUser, formatPet };
export default router;
