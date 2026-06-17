import { Router } from 'express';
import db from '../db/index.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { formatPet } from './auth.js';
import { calculateDaysUntil } from '../utils/index.js';

const router = Router();

router.get('/reminders', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    
    const pets = db.findMany('pets', (p: any) => p.user_id === userId);
    const petIds = pets.map((p: any) => p.id);
    
    const reminders: any[] = [];
    
    const vaccines = db.findMany('vaccineRecords', (r: any) => 
      petIds.includes(r.pet_id) && r.next_date
    );
    
    vaccines.forEach((v: any) => {
      const daysLeft = calculateDaysUntil(v.next_date);
      if (daysLeft <= 30) {
        const pet = pets.find((p: any) => p.id === v.pet_id);
        reminders.push({
          id: `v-${v.id}`,
          petId: v.pet_id,
          pet: pet ? formatPet(pet) : null,
          type: 'vaccine',
          title: `${v.name}疫苗接种`,
          date: v.next_date,
          daysLeft,
        });
      }
    });
    
    const dewormings = db.findMany('dewormingRecords', (r: any) => 
      petIds.includes(r.pet_id) && r.next_date
    );
    
    dewormings.forEach((d: any) => {
      const daysLeft = calculateDaysUntil(d.next_date);
      if (daysLeft <= 30) {
        const pet = pets.find((p: any) => p.id === d.pet_id);
        reminders.push({
          id: `d-${d.id}`,
          petId: d.pet_id,
          pet: pet ? formatPet(pet) : null,
          type: 'deworming',
          title: `${d.type === 'internal' ? '体内' : '体外'}驱虫`,
          date: d.next_date,
          daysLeft,
        });
      }
    });
    
    reminders.sort((a, b) => a.daysLeft - b.daysLeft);
    
    res.json({ reminders });
  } catch (e) {
    console.error('Get reminders error:', e);
    res.status(500).json({ error: '获取提醒失败' });
  }
});

router.get('/weight', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId } = req.query;
    
    const pets = db.findMany('pets', (p: any) => p.user_id === userId);
    const petIds = pets.map((p: any) => p.id);
    
    let records = db.findMany('weightRecords', (r: any) => petIds.includes(r.pet_id));
    
    if (petId) {
      records = records.filter((r: any) => r.pet_id === parseInt(petId as string));
    }
    
    records.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const formattedRecords = records.map((r: any) => {
      const pet = pets.find((p: any) => p.id === r.pet_id);
      return {
        id: r.id,
        petId: r.pet_id,
        pet: pet ? formatPet(pet) : null,
        weight: r.weight,
        date: r.date,
        note: r.note,
        createdAt: r.created_at,
      };
    });
    
    res.json({ records: formattedRecords });
  } catch (e) {
    console.error('Get weight records error:', e);
    res.status(500).json({ error: '获取体重记录失败' });
  }
});

router.post('/weight', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId, weight, date, note } = req.body;
    
    const pet = db.getById('pets', petId);
    if (!pet || pet.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此宠物' });
    }
    
    if (!weight || !date) {
      return res.status(400).json({ error: '请填写体重和日期' });
    }
    
    const record = db.insert('weightRecords', {
      pet_id: petId,
      weight: parseFloat(weight),
      date,
      note: note || '',
    });
    
    res.json({
      id: record.id,
      petId: record.pet_id,
      pet: formatPet(pet),
      weight: record.weight,
      date: record.date,
      note: record.note,
      createdAt: record.created_at,
    });
  } catch (e) {
    console.error('Create weight record error:', e);
    res.status(500).json({ error: '添加体重记录失败' });
  }
});

router.get('/vaccines', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId } = req.query;
    
    const pets = db.findMany('pets', (p: any) => p.user_id === userId);
    const petIds = pets.map((p: any) => p.id);
    
    let records = db.findMany('vaccineRecords', (r: any) => petIds.includes(r.pet_id));
    
    if (petId) {
      records = records.filter((r: any) => r.pet_id === parseInt(petId as string));
    }
    
    records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const formattedRecords = records.map((r: any) => {
      const pet = pets.find((p: any) => p.id === r.pet_id);
      return {
        id: r.id,
        petId: r.pet_id,
        pet: pet ? formatPet(pet) : null,
        name: r.name,
        date: r.date,
        nextDate: r.next_date,
        hospital: r.hospital,
        note: r.note,
        createdAt: r.created_at,
      };
    });
    
    res.json({ records: formattedRecords });
  } catch (e) {
    console.error('Get vaccine records error:', e);
    res.status(500).json({ error: '获取疫苗记录失败' });
  }
});

router.post('/vaccines', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId, name, date, nextDate, hospital, note } = req.body;
    
    const pet = db.getById('pets', petId);
    if (!pet || pet.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此宠物' });
    }
    
    if (!name || !date) {
      return res.status(400).json({ error: '请填写疫苗名称和日期' });
    }
    
    const record = db.insert('vaccineRecords', {
      pet_id: petId,
      name,
      date,
      next_date: nextDate || null,
      hospital: hospital || '',
      note: note || '',
    });
    
    res.json({
      id: record.id,
      petId: record.pet_id,
      pet: formatPet(pet),
      name: record.name,
      date: record.date,
      nextDate: record.next_date,
      hospital: record.hospital,
      note: record.note,
      createdAt: record.created_at,
    });
  } catch (e) {
    console.error('Create vaccine record error:', e);
    res.status(500).json({ error: '添加疫苗记录失败' });
  }
});

router.get('/deworming', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId } = req.query;
    
    const pets = db.findMany('pets', (p: any) => p.user_id === userId);
    const petIds = pets.map((p: any) => p.id);
    
    let records = db.findMany('dewormingRecords', (r: any) => petIds.includes(r.pet_id));
    
    if (petId) {
      records = records.filter((r: any) => r.pet_id === parseInt(petId as string));
    }
    
    records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const formattedRecords = records.map((r: any) => {
      const pet = pets.find((p: any) => p.id === r.pet_id);
      return {
        id: r.id,
        petId: r.pet_id,
        pet: pet ? formatPet(pet) : null,
        type: r.type,
        date: r.date,
        nextDate: r.next_date,
        product: r.product,
        note: r.note,
        createdAt: r.created_at,
      };
    });
    
    res.json({ records: formattedRecords });
  } catch (e) {
    console.error('Get deworming records error:', e);
    res.status(500).json({ error: '获取驱虫记录失败' });
  }
});

router.post('/deworming', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { petId, type, date, nextDate, product, note } = req.body;
    
    const pet = db.getById('pets', petId);
    if (!pet || pet.user_id !== userId) {
      return res.status(403).json({ error: '无权操作此宠物' });
    }
    
    if (!type || !date) {
      return res.status(400).json({ error: '请填写驱虫类型和日期' });
    }
    
    const record = db.insert('dewormingRecords', {
      pet_id: petId,
      type,
      date,
      next_date: nextDate || null,
      product: product || '',
      note: note || '',
    });
    
    res.json({
      id: record.id,
      petId: record.pet_id,
      pet: formatPet(pet),
      type: record.type,
      date: record.date,
      nextDate: record.next_date,
      product: record.product,
      note: record.note,
      createdAt: record.created_at,
    });
  } catch (e) {
    console.error('Create deworming record error:', e);
    res.status(500).json({ error: '添加驱虫记录失败' });
  }
});

router.delete('/:type/:recordId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { type, recordId } = req.params;
    
    const validTypes = ['weight', 'vaccines', 'deworming'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: '无效的记录类型' });
    }
    
    const tableMap: Record<string, string> = {
      weight: 'weightRecords',
      vaccines: 'vaccineRecords',
      deworming: 'dewormingRecords',
    };
    
    const table = tableMap[type] as any;
    const record = db.getById(table, parseInt(recordId));
    
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    
    const pet = db.getById('pets', record.pet_id);
    if (!pet || pet.user_id !== userId) {
      return res.status(403).json({ error: '无权删除此记录' });
    }
    
    db.remove(table, parseInt(recordId));
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    console.error('Delete health record error:', e);
    res.status(500).json({ error: '删除记录失败' });
  }
});

export { router as healthRouter };
export default router;
