import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { formatUser } from './auth.js';

const router = Router();

function formatPlace(place: any) {
  const images = db.findMany('placeImages', (img: any) => img.place_id === place.id)
    .map((img: any) => img.image);
  
  const reviews = db.findMany('reviews', (r: any) => r.place_id === place.id)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((r: any) => {
      const user = db.getById('users', r.user_id);
      const reviewImages = db.findMany('reviewImages', (ri: any) => ri.review_id === r.id)
        .map((ri: any) => ri.image);
      
      return {
        id: r.id,
        placeId: r.place_id,
        userId: r.user_id,
        user: user ? formatUser(user) : null,
        rating: r.rating,
        content: r.content,
        images: reviewImages,
        createdAt: r.created_at,
      };
    });
  
  return {
    id: place.id,
    name: place.name,
    type: place.type,
    address: place.address,
    phone: place.phone,
    businessHours: place.business_hours,
    images,
    description: place.description,
    rating: place.rating,
    reviewCount: place.review_count,
    lat: place.lat,
    lng: place.lng,
    createdBy: place.created_by,
    isApproved: !!place.is_approved,
    createdAt: place.created_at,
    reviews,
  };
}

router.get('/', optionalAuthMiddleware, async (req, res) => {
  try {
    const { type, lat, lng, radius = '5000' } = req.query;
    
    let places = db.getAll('places').filter((p: any) => p.is_approved);
    
    if (type) {
      places = places.filter((p: any) => p.type === type);
    }
    
    places.sort((a: any, b: any) => b.review_count - a.review_count);
    
    res.json({
      total: places.length,
      places: places.map((p: any) => formatPlace(p)),
    });
  } catch (e) {
    console.error('Get places error:', e);
    res.status(500).json({ error: '获取场所列表失败' });
  }
});

router.get('/:placeId', optionalAuthMiddleware, async (req, res) => {
  try {
    const placeId = parseInt(req.params.placeId);
    
    const place = db.getById('places', placeId);
    if (!place || !place.is_approved) {
      return res.status(404).json({ error: '场所不存在' });
    }
    
    res.json(formatPlace(place));
  } catch (e) {
    console.error('Get place error:', e);
    res.status(500).json({ error: '获取场所详情失败' });
  }
});

router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { name, type, address, phone, businessHours, images = [], description, lat, lng } = req.body;
    
    if (!name || !type || !address) {
      return res.status(400).json({ error: '请填写必要信息' });
    }
    
    const place = db.insert('places', {
      name: name.trim(),
      type,
      address: address.trim(),
      phone: phone || '',
      business_hours: businessHours || '',
      description: description || '',
      rating: 0,
      review_count: 0,
      lat: lat || 0,
      lng: lng || 0,
      created_by: userId,
      is_approved: 1,
    });
    
    images.forEach((img: string) => {
      db.insert('placeImages', {
        place_id: place.id,
        image: img,
      });
    });
    
    res.json(formatPlace(place));
  } catch (e) {
    console.error('Create place error:', e);
    res.status(500).json({ error: '提交场所失败' });
  }
});

router.post('/:placeId/reviews', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const placeId = parseInt(req.params.placeId);
    const userId = req.user!.userId;
    const { rating, content, images = [] } = req.body;
    
    const place = db.getById('places', placeId);
    if (!place) {
      return res.status(404).json({ error: '场所不存在' });
    }
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: '请选择有效的评分' });
    }
    
    const existingReview = db.findOne('reviews', (r: any) => 
      r.place_id === placeId && r.user_id === userId
    );
    
    if (existingReview) {
      return res.status(400).json({ error: '您已经评价过该场所' });
    }
    
    const review = db.insert('reviews', {
      place_id: placeId,
      user_id: userId,
      rating,
      content: content || '',
    });
    
    images.forEach((img: string) => {
      db.insert('reviewImages', {
        review_id: review.id,
        image: img,
      });
    });
    
    const allReviews = db.findMany('reviews', (r: any) => r.place_id === placeId);
    const avgRating = allReviews.length > 0 
      ? (allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : rating;
    
    db.update('places', placeId, {
      rating: parseFloat(avgRating),
      review_count: allReviews.length,
    });
    
    const user = db.getById('users', userId);
    
    res.json({
      id: review.id,
      placeId: review.place_id,
      userId: review.user_id,
      user: user ? formatUser(user) : null,
      rating: review.rating,
      content: review.content,
      images,
      createdAt: review.created_at,
    });
  } catch (e) {
    console.error('Create review error:', e);
    res.status(500).json({ error: '提交评价失败' });
  }
});

export { router as placeRouter };
export default router;
