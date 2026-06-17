import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { formatUser, formatPet } from './auth.js';

const router = Router();

function formatQuestion(question: any, currentUserId?: number) {
  const user = db.getById('users', question.user_id);
  const answers = db.findMany('answers', (a: any) => a.question_id === question.id)
    .sort((a: any, b: any) => {
      if (a.is_accepted && !b.is_accepted) return -1;
      if (!a.is_accepted && b.is_accepted) return 1;
      return b.like_count - a.like_count;
    })
    .map((a: any) => {
      const answerUser = db.getById('users', a.user_id);
      return {
        id: a.id,
        questionId: a.question_id,
        userId: a.user_id,
        user: answerUser ? formatUser(answerUser, currentUserId) : null,
        content: a.content,
        isAccepted: !!a.is_accepted,
        likeCount: a.like_count,
        createdAt: a.created_at,
      };
    });
  
  return {
    id: question.id,
    userId: question.user_id,
    user: user ? formatUser(user, currentUserId) : null,
    title: question.title,
    content: question.content,
    category: question.category,
    rewardPoints: question.reward_points,
    viewCount: question.view_count,
    answerCount: answers.length,
    isAnswered: !!question.accepted_answer_id,
    acceptedAnswerId: question.accepted_answer_id,
    createdAt: question.created_at,
    answers,
  };
}

router.get('/', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '20', category, sort = 'latest', answered } = req.query;
    const currentUserId = req.user?.userId;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    let questions = db.getAll('questions');
    
    if (category) {
      questions = questions.filter((q: any) => q.category === category);
    }
    
    if (answered === 'true') {
      questions = questions.filter((q: any) => q.accepted_answer_id);
    } else if (answered === 'false') {
      questions = questions.filter((q: any) => !q.accepted_answer_id);
    }
    
    if (sort === 'hot') {
      questions.sort((a: any, b: any) => 
        (b.view_count + b.reward_points * 2) - (a.view_count + a.reward_points * 2)
      );
    } else if (sort === 'unanswered') {
      questions.sort((a: any) => a.accepted_answer_id ? 1 : -1);
    } else {
      questions.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    
    const start = (pageNum - 1) * limitNum;
    const paginatedQuestions = questions.slice(start, start + limitNum);
    
    res.json({
      total: questions.length,
      page: pageNum,
      limit: limitNum,
      hasMore: start + limitNum < questions.length,
      questions: paginatedQuestions.map((q: any) => formatQuestion(q, currentUserId)),
    });
  } catch (e) {
    console.error('Get questions error:', e);
    res.status(500).json({ error: '获取问题列表失败' });
  }
});

router.get('/:questionId', optionalAuthMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const currentUserId = req.user?.userId;
    
    const question = db.getById('questions', questionId);
    if (!question) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    db.update('questions', questionId, {
      view_count: question.view_count + 1,
    });
    
    question.view_count += 1;
    res.json(formatQuestion(question, currentUserId));
  } catch (e) {
    console.error('Get question error:', e);
    res.status(500).json({ error: '获取问题详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, content, category, rewardPoints = 0, petIds = [] } = req.body;
    const userId = req.user!.userId;
    
    if (!title || !content) {
      return res.status(400).json({ error: '请填写标题和问题描述' });
    }
    
    const user = db.getById('users', userId);
    if (!user || user.points < rewardPoints) {
      return res.status(400).json({ error: '积分不足' });
    }
    
    const question = db.insert('questions', {
      user_id: userId,
      title: title.trim(),
      content: content.trim(),
      category: category || 'other',
      reward_points: rewardPoints,
      view_count: 0,
      accepted_answer_id: null,
    });
    
    if (rewardPoints > 0) {
      db.update('users', userId, {
        points: user.points - rewardPoints,
      });
    }
    
    res.json(formatQuestion(question, userId));
  } catch (e) {
    console.error('Create question error:', e);
    res.status(500).json({ error: '发起问题失败' });
  }
});

router.post('/:questionId/answers', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const { content } = req.body;
    const userId = req.user!.userId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: '请填写回答内容' });
    }
    
    const question = db.getById('questions', questionId);
    if (!question) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    const answer = db.insert('answers', {
      question_id: questionId,
      user_id: userId,
      content: content.trim(),
      is_accepted: 0,
      like_count: 0,
    });
    
    const user = db.getById('users', userId);
    
    res.json({
      id: answer.id,
      questionId: answer.question_id,
      userId: answer.user_id,
      user: user ? formatUser(user) : null,
      content: answer.content,
      isAccepted: !!answer.is_accepted,
      likeCount: answer.like_count,
      createdAt: answer.created_at,
    });
  } catch (e) {
    console.error('Create answer error:', e);
    res.status(500).json({ error: '提交回答失败' });
  }
});

router.post('/:questionId/answers/:answerId/accept', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const questionId = parseInt(req.params.questionId);
    const answerId = parseInt(req.params.answerId);
    const userId = req.user!.userId;
    
    const question = db.getById('questions', questionId);
    if (!question) {
      return res.status(404).json({ error: '问题不存在' });
    }
    
    if (question.user_id !== userId) {
      return res.status(403).json({ error: '只有提问者可以采纳回答' });
    }
    
    if (question.accepted_answer_id) {
      return res.status(400).json({ error: '该问题已有采纳的回答' });
    }
    
    const answer = db.getById('answers', answerId);
    if (!answer || answer.question_id !== questionId) {
      return res.status(404).json({ error: '回答不存在' });
    }
    
    db.update('answers', answerId, {
      is_accepted: 1,
    });
    
    db.update('questions', questionId, {
      accepted_answer_id: answerId,
    });
    
    const answerUser = db.getById('users', answer.user_id);
    if (answerUser) {
      const bonus = Math.floor(question.reward_points * (answerUser.is_vet ? 1.5 : 1));
      db.update('users', answer.user_id, {
        points: answerUser.points + bonus + 10,
      });
    }
    
    res.json({ success: true, message: '采纳成功' });
  } catch (e) {
    console.error('Accept answer error:', e);
    res.status(500).json({ error: '采纳回答失败' });
  }
});

router.post('/:questionId/answers/:answerId/like', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const answerId = parseInt(req.params.answerId);
    
    const answer = db.getById('answers', answerId);
    if (!answer) {
      return res.status(404).json({ error: '回答不存在' });
    }
    
    db.update('answers', answerId, {
      like_count: answer.like_count + 1,
    });
    
    res.json({ success: true, likeCount: answer.like_count + 1 });
  } catch (e) {
    console.error('Like answer error:', e);
    res.status(500).json({ error: '点赞失败' });
  }
});

export { router as qaRouter };
export default router;
