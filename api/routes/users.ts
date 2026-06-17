import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { formatUser } from './auth.js';

const router = Router();

router.get('/:userId', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const currentUserId = req.user?.userId;
    
    const user = db.getById('users', userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(formatUser(user, currentUserId));
  } catch (e) {
    console.error('Get user error:', e);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

router.post('/:userId/follow', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userIdToFollow = parseInt(req.params.userId);
    const currentUserId = req.user!.userId;
    
    if (userIdToFollow === currentUserId) {
      return res.status(400).json({ error: '不能关注自己' });
    }
    
    const userToFollow = db.getById('users', userIdToFollow);
    if (!userToFollow) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const existingFollow = db.findOne('follows', (f: any) => 
      f.follower_id === currentUserId && f.following_id === userIdToFollow
    );
    
    if (existingFollow) {
      return res.status(400).json({ error: '已经关注该用户' });
    }
    
    db.insert('follows', {
      follower_id: currentUserId,
      following_id: userIdToFollow,
    });
    
    res.json({ success: true, message: '关注成功' });
  } catch (e) {
    console.error('Follow error:', e);
    res.status(500).json({ error: '关注失败' });
  }
});

router.delete('/:userId/follow', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userIdToUnfollow = parseInt(req.params.userId);
    const currentUserId = req.user!.userId;
    
    const deleted = db.removeMany('follows', (f: any) => 
      f.follower_id === currentUserId && f.following_id === userIdToUnfollow
    );
    
    if (deleted === 0) {
      return res.status(400).json({ error: '未关注该用户' });
    }
    
    res.json({ success: true, message: '取消关注成功' });
  } catch (e) {
    console.error('Unfollow error:', e);
    res.status(500).json({ error: '取消关注失败' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { nickname, avatar, bio } = req.body;
    const userId = req.user!.userId;
    
    const updates: any = {};
    if (nickname) updates.nickname = nickname;
    if (avatar !== undefined) updates.avatar = avatar;
    if (bio !== undefined) updates.bio = bio;
    
    const updatedUser = db.update('users', userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(formatUser(updatedUser, userId));
  } catch (e) {
    console.error('Update profile error:', e);
    res.status(500).json({ error: '更新资料失败' });
  }
});

router.get('/:userId/posts', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const posts = db.findMany('posts', (p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    res.json({
      total: posts.length,
      posts: posts.slice(0, 20),
    });
  } catch (e) {
    console.error('Get user posts error:', e);
    res.status(500).json({ error: '获取用户动态失败' });
  }
});

router.get('/:userId/pets', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const pets = db.findMany('pets', (p: any) => p.user_id === userId)
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const formattedPets = pets.map((pet: any) => ({
      ...pet,
      photos: db.findMany('petPhotos', (ph: any) => ph.pet_id === pet.id)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }));
    
    res.json({
      total: formattedPets.length,
      pets: formattedPets,
    });
  } catch (e) {
    console.error('Get user pets error:', e);
    res.status(500).json({ error: '获取用户宠物失败' });
  }
});

router.get('/:userId/followers', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const follows = db.findMany('follows', (f: any) => f.following_id === userId);
    const followerIds = follows.map((f: any) => f.follower_id);
    const followers = db.findMany('users', (u: any) => followerIds.includes(u.id));
    
    res.json({
      total: followers.length,
      users: followers.map((u: any) => formatUser(u)),
    });
  } catch (e) {
    console.error('Get followers error:', e);
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
});

router.get('/:userId/following', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const follows = db.findMany('follows', (f: any) => f.follower_id === userId);
    const followingIds = follows.map((f: any) => f.following_id);
    const following = db.findMany('users', (u: any) => followingIds.includes(u.id));
    
    res.json({
      total: following.length,
      users: following.map((u: any) => formatUser(u)),
    });
  } catch (e) {
    console.error('Get following error:', e);
    res.status(500).json({ error: '获取关注列表失败' });
  }
});

export { router as userRouter };
export default router;
