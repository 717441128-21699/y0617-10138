import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { formatUser, formatPet } from './auth.js';
import { calculateDaysUntil } from '../utils/index.js';

const router = Router();

function formatPost(post: any, currentUserId?: number) {
  const user = db.getById('users', post.user_id);
  const images = db.findMany('postImages', (img: any) => img.post_id === post.id)
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((img: any) => img.image);
  const tags = db.findMany('postTags', (t: any) => t.post_id === post.id)
    .map((t: any) => t.tag);
  const petIds = db.findMany('postPets', (pp: any) => pp.post_id === post.id)
    .map((pp: any) => pp.pet_id);
  const pets = petIds.map((petId: number) => {
    const pet = db.getById('pets', petId);
    return pet ? formatPet(pet) : null;
  }).filter(Boolean);
  
  let isLiked = false;
  if (currentUserId) {
    isLiked = db.findOne('likes', (l: any) => 
      l.post_id === post.id && l.user_id === currentUserId
    ) !== undefined;
  }
  
  return {
    id: post.id,
    userId: post.user_id,
    user: user ? formatUser(user, currentUserId) : null,
    content: post.content,
    images,
    tags,
    pets,
    likeCount: post.like_count,
    commentCount: post.comment_count,
    shareCount: post.share_count,
    isLiked,
    createdAt: post.created_at,
  };
}

router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { 
      page = '1', 
      limit = '20', 
      sort = 'latest', 
      species, 
      tag,
      following,
    } = req.query;
    
    const currentUserId = req.user?.userId;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    let posts = db.getAll('posts');
    
    if (following === 'true' && currentUserId) {
      const followedIds = db.findMany('follows', (f: any) => f.follower_id === currentUserId)
        .map((f: any) => f.following_id);
      followedIds.push(currentUserId);
      posts = posts.filter((p: any) => followedIds.includes(p.user_id));
    }
    
    if (species) {
      const postIdsWithSpecies = db.findMany('postPets', (pp: any) => {
        const pet = db.getById('pets', pp.pet_id);
        return pet && pet.species === species;
      }).map((pp: any) => pp.post_id);
      posts = posts.filter((p: any) => postIdsWithSpecies.includes(p.id));
    }
    
    if (tag) {
      const postIdsWithTag = db.findMany('postTags', (t: any) => t.tag === tag)
        .map((t: any) => t.post_id);
      posts = posts.filter((p: any) => postIdsWithTag.includes(p.id));
    }
    
    if (sort === 'hot') {
      posts.sort((a: any, b: any) => 
        (b.like_count + b.comment_count * 2) - (a.like_count + a.comment_count * 2)
      );
    } else {
      posts.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    const start = (pageNum - 1) * limitNum;
    const paginatedPosts = posts.slice(start, start + limitNum);
    
    res.json({
      total: posts.length,
      page: pageNum,
      limit: limitNum,
      hasMore: start + limitNum < posts.length,
      posts: paginatedPosts.map((p: any) => formatPost(p, currentUserId)),
    });
  } catch (e) {
    console.error('Get posts error:', e);
    res.status(500).json({ error: '获取动态失败' });
  }
});

router.get('/:postId', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const currentUserId = req.user?.userId;
    
    const post = db.getById('posts', postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    
    res.json(formatPost(post, currentUserId));
  } catch (e) {
    console.error('Get post error:', e);
    res.status(500).json({ error: '获取动态详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, images = [], tags = [], petIds = [] } = req.body;
    const userId = req.user!.userId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入内容' });
    }
    
    const post = db.insert('posts', {
      user_id: userId,
      content: content.trim(),
      like_count: 0,
      comment_count: 0,
      share_count: 0,
    });
    
    images.forEach((img: string, idx: number) => {
      db.insert('postImages', {
        post_id: post.id,
        image: img,
        sort_order: idx,
      });
    });
    
    tags.forEach((tag: string) => {
      if (tag.trim()) {
        db.insert('postTags', {
          post_id: post.id,
          tag: tag.trim(),
        });
      }
    });
    
    petIds.forEach((petId: number) => {
      const pet = db.getById('pets', petId);
      if (pet && pet.user_id === userId) {
        db.insert('postPets', {
          post_id: post.id,
          pet_id: petId,
        });
      }
    });
    
    res.json(formatPost(post, userId));
  } catch (e) {
    console.error('Create post error:', e);
    res.status(500).json({ error: '发布动态失败' });
  }
});

router.post('/:postId/like', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user!.userId;
    
    const post = db.getById('posts', postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    
    const existingLike = db.findOne('likes', (l: any) => 
      l.post_id === postId && l.user_id === userId
    );
    
    if (existingLike) {
      return res.status(400).json({ error: '已经点赞' });
    }
    
    db.insert('likes', {
      post_id: postId,
      user_id: userId,
    });
    
    db.update('posts', postId, {
      like_count: post.like_count + 1,
    });
    
    res.json({ success: true, likeCount: post.like_count + 1 });
  } catch (e) {
    console.error('Like post error:', e);
    res.status(500).json({ error: '点赞失败' });
  }
});

router.delete('/:postId/like', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user!.userId;
    
    const post = db.getById('posts', postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    
    const deleted = db.removeMany('likes', (l: any) => 
      l.post_id === postId && l.user_id === userId
    );
    
    if (deleted === 0) {
      return res.status(400).json({ error: '未点赞' });
    }
    
    db.update('posts', postId, {
      like_count: Math.max(0, post.like_count - 1),
    });
    
    res.json({ success: true, likeCount: Math.max(0, post.like_count - 1) });
  } catch (e) {
    console.error('Unlike post error:', e);
    res.status(500).json({ error: '取消点赞失败' });
  }
});

router.post('/:postId/share', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    const post = db.getById('posts', postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    
    db.update('posts', postId, {
      share_count: post.share_count + 1,
    });
    
    res.json({ success: true, shareCount: post.share_count + 1 });
  } catch (e) {
    console.error('Share post error:', e);
    res.status(500).json({ error: '转发失败' });
  }
});

router.get('/:postId/comments', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    const comments = db.findMany('comments', (c: any) => c.post_id === postId)
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const formattedComments = comments.map((comment: any) => {
      const user = db.getById('users', comment.user_id);
      let replyTo = null;
      if (comment.reply_to_id) {
        const replyToComment = db.getById('comments', comment.reply_to_id);
        if (replyToComment) {
          const replyToUser = db.getById('users', replyToComment.user_id);
          replyTo = replyToUser ? formatUser(replyToUser) : null;
        }
      }
      
      return {
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        user: user ? formatUser(user) : null,
        replyToId: comment.reply_to_id,
        replyTo,
        content: comment.content,
        likeCount: comment.like_count,
        createdAt: comment.created_at,
      };
    });
    
    res.json({
      total: formattedComments.length,
      comments: formattedComments,
    });
  } catch (e) {
    console.error('Get comments error:', e);
    res.status(500).json({ error: '获取评论失败' });
  }
});

router.post('/:postId/comments', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { content, replyToId } = req.body;
    const userId = req.user!.userId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请输入评论内容' });
    }
    
    const post = db.getById('posts', postId);
    if (!post) {
      return res.status(404).json({ error: '动态不存在' });
    }
    
    if (replyToId) {
      const replyToComment = db.getById('comments', replyToId);
      if (!replyToComment || replyToComment.post_id !== postId) {
        return res.status(400).json({ error: '回复的评论不存在' });
      }
    }
    
    const comment = db.insert('comments', {
      post_id: postId,
      user_id: userId,
      reply_to_id: replyToId || null,
      content: content.trim(),
      like_count: 0,
    });
    
    db.update('posts', postId, {
      comment_count: post.comment_count + 1,
    });
    
    const user = db.getById('users', userId);
    res.json({
      id: comment.id,
      postId: comment.post_id,
      userId: comment.user_id,
      user: user ? formatUser(user) : null,
      replyToId: comment.reply_to_id,
      content: comment.content,
      likeCount: comment.like_count,
      createdAt: comment.created_at,
    });
  } catch (e) {
    console.error('Create comment error:', e);
    res.status(500).json({ error: '评论失败' });
  }
});

router.get('/tags/hot', async (_req, res) => {
  try {
    const allTags = db.getAll('postTags');
    const tagCounts: Record<string, number> = {};
    
    allTags.forEach((t: any) => {
      tagCounts[t.tag] = (tagCounts[t.tag] || 0) + 1;
    });
    
    const hotTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));
    
    res.json({ tags: hotTags });
  } catch (e) {
    console.error('Get hot tags error:', e);
    res.status(500).json({ error: '获取热门标签失败' });
  }
});

export { router as postRouter, formatPost };
export default router;
