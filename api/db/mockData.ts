import db from '../db/index.js';
import { hashPassword } from '../middleware/auth.js';
import { generatePetImage, generateAvatar, generatePlaceImage } from '../utils/index.js';

export function initMockData() {
  const users = db.getAll('users');
  if (users.length > 0) {
    console.log('Database already has data, skipping mock data initialization');
    return;
  }

  console.log('Initializing mock data...');

  const avatars = [
    generateAvatar('user1'),
    generateAvatar('user2'),
    generateAvatar('user3'),
    generateAvatar('user4'),
    generateAvatar('vet'),
  ];

  const mockUsers = [
    {
      email: 'demo@pet.com',
      phone: '13800138000',
      password_hash: hashPassword('123456'),
      nickname: '爱猫人士',
      avatar: avatars[0],
      bio: '家里有三只猫主子，资深铲屎官',
      points: 520,
      is_vet: 0,
    },
    {
      email: 'vet@pet.com',
      phone: '13900139000',
      password_hash: hashPassword('123456'),
      nickname: '李兽医',
      avatar: avatars[4],
      bio: '执业兽医，从业10年，擅长小动物内科',
      points: 1280,
      is_vet: 1,
    },
    {
      email: 'doglover@pet.com',
      phone: '13700137000',
      password_hash: hashPassword('123456'),
      nickname: '铲屎官小王',
      avatar: avatars[2],
      bio: '金毛和柯基的铲屎官，热爱户外运动',
      points: 360,
      is_vet: 0,
    },
    {
      email: 'birdfan@pet.com',
      phone: '13600136000',
      password_hash: hashPassword('123456'),
      nickname: '鹦鹉爱好者',
      avatar: avatars[3],
      bio: '养了5只鹦鹉，专注鸟类饲养15年',
      points: 420,
      is_vet: 0,
    },
    {
      email: 'reptile@pet.com',
      phone: '13500135000',
      password_hash: hashPassword('123456'),
      nickname: '爬宠达人',
      avatar: avatars[1],
      bio: '守宫、蛇、蜥蜴都有，爬宠爱好者集合！',
      points: 280,
      is_vet: 0,
    },
  ];

  const createdUsers = mockUsers.map(u => db.insert('users', u));
  console.log(`Created ${createdUsers.length} users`);

  const mockPets = [
    {
      user_id: createdUsers[0].id,
      name: '橘子',
      species: 'cat',
      breed: '英国短毛猫',
      gender: 'male',
      birthday: '2022-03-15',
      avatar: generatePetImage('cat', 'orange'),
      bio: '爱吃小鱼干的胖橘，性格慵懒',
    },
    {
      user_id: createdUsers[0].id,
      name: '奶茶',
      species: 'cat',
      breed: '布偶猫',
      gender: 'female',
      birthday: '2023-01-20',
      avatar: generatePetImage('cat', 'milktea'),
      bio: '蓝眼睛的小公主，超级粘人',
    },
    {
      user_id: createdUsers[2].id,
      name: '豆豆',
      species: 'dog',
      breed: '金毛寻回犬',
      gender: 'male',
      birthday: '2021-06-10',
      avatar: generatePetImage('dog', 'doudou'),
      bio: '阳光大男孩，最爱游泳和接飞盘',
    },
    {
      user_id: createdUsers[2].id,
      name: '汉堡',
      species: 'dog',
      breed: '柯基',
      gender: 'male',
      birthday: '2023-08-05',
      avatar: generatePetImage('dog', 'hamburger'),
      bio: '小短腿大屁股，走路一摇一摆',
    },
    {
      user_id: createdUsers[3].id,
      name: '皮皮',
      species: 'bird',
      breed: '虎皮鹦鹉',
      gender: 'male',
      birthday: '2022-11-12',
      avatar: generatePetImage('bird', 'pipi'),
      bio: '会说"你好"的话痨小鹦鹉',
    },
    {
      user_id: createdUsers[4].id,
      name: '小龙',
      species: 'reptile',
      breed: '豹纹守宫',
      gender: 'male',
      birthday: '2021-04-20',
      avatar: generatePetImage('reptile', 'xiaolong'),
      bio: '温顺的小守宫，爱吃面包虫',
    },
  ];

  const createdPets = mockPets.map(p => db.insert('pets', p));
  console.log(`Created ${createdPets.length} pets`);

  const petPhotoContents = [
    { caption: '刚到家的第一天', daysAgo: 365 },
    { caption: '第一次洗澡', daysAgo: 300 },
    { caption: '生日派对', daysAgo: 200 },
    { caption: '晒太阳的午后', daysAgo: 100 },
    { caption: '新衣服穿不下了', daysAgo: 50 },
    { caption: '最近长胖了', daysAgo: 10 },
  ];

  createdPets.forEach(pet => {
    petPhotoContents.slice(0, 4).forEach((photo, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - photo.daysAgo);
      db.insert('petPhotos', {
        pet_id: pet.id,
        image: generatePetImage(pet.species, `${pet.name}-${idx}`),
        caption: photo.caption,
        date: date.toISOString().split('T')[0],
      });
    });
  });

  const mockPosts = [
    {
      user_id: createdUsers[0].id,
      content: '今天橘子和奶茶又打架了，为了抢一个纸箱子🤣 你们说谁赢了？',
      tags: ['猫咪日常', '家有二猫'],
      petIds: [createdPets[0].id, createdPets[1].id],
      images: [generatePetImage('cat', 'fight1'), generatePetImage('cat', 'fight2')],
    },
    {
      user_id: createdUsers[2].id,
      content: '周末带豆豆和汉堡去郊野公园玩，两个小家伙玩疯了！晚上回家倒头就睡😂',
      tags: ['狗狗日常', '周末遛狗'],
      petIds: [createdPets[2].id, createdPets[3].id],
      images: [generatePetImage('dog', 'park1'), generatePetImage('dog', 'park2'), generatePetImage('dog', 'park3')],
    },
    {
      user_id: createdUsers[3].id,
      content: '皮皮今天学会了说"晚安"！训练了一个月终于有成果了，感动😭',
      tags: ['鹦鹉训练', '养宠心得'],
      petIds: [createdPets[4].id],
      images: [generatePetImage('bird', 'training')],
    },
    {
      user_id: createdUsers[4].id,
      content: '小龙蜕皮完成了！新皮肤超级漂亮，给大家看看～ 守宫蜕皮的时候不要打扰哦',
      tags: ['爬宠日常', '养宠知识'],
      petIds: [createdPets[5].id],
      images: [generatePetImage('reptile', 'shed1'), generatePetImage('reptile', 'shed2')],
    },
    {
      user_id: createdUsers[1].id,
      content: '【兽医科普】夏季宠物中暑的识别与急救！🌡️\n\n症状：呼吸急促、牙龈发红、体温升高、精神萎靡\n\n急救：立即移到阴凉处，用湿毛巾擦拭身体，少量多次喂凉水，严重请立即送医！',
      tags: ['兽医科普', '夏季养宠', '宠物健康'],
      petIds: [],
      images: [],
    },
    {
      user_id: createdUsers[0].id,
      content: '奶茶今天生日啦！🎂 满2岁了，给她买了小鱼干蛋糕，吃得可开心了～',
      tags: ['猫咪生日', '家有萌宠'],
      petIds: [createdPets[1].id],
      images: [generatePetImage('cat', 'birthday1'), generatePetImage('cat', 'birthday2')],
    },
  ];

  mockPosts.forEach((post, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (mockPosts.length - idx) * 2);
    
    const createdPost = db.insert('posts', {
      user_id: post.user_id,
      content: post.content,
      like_count: Math.floor(Math.random() * 100) + 10,
      comment_count: Math.floor(Math.random() * 20) + 2,
      share_count: Math.floor(Math.random() * 10),
      created_at: date.toISOString(),
    });

    post.images.forEach((img, imgIdx) => {
      db.insert('postImages', {
        post_id: createdPost.id,
        image: img,
        sort_order: imgIdx,
      });
    });

    post.tags.forEach(tag => {
      db.insert('postTags', {
        post_id: createdPost.id,
        tag,
      });
    });

    post.petIds.forEach(petId => {
      db.insert('postPets', {
        post_id: createdPost.id,
        pet_id: petId,
      });
    });

    db.insert('likes', {
      post_id: createdPost.id,
      user_id: createdUsers[(idx + 1) % createdUsers.length].id,
    });
  });

  console.log(`Created ${mockPosts.length} posts`);

  const mockComments = [
    { post_idx: 0, user_idx: 2, content: '哈哈哈哈太可爱了！我赌橘子赢！' },
    { post_idx: 0, user_idx: 3, content: '奶茶好优雅，橘猫肯定打不过' },
    { post_idx: 1, user_idx: 0, content: '太幸福了！两个小可爱' },
    { post_idx: 1, user_idx: 4, content: '柯基的屁股太好笑了😂' },
    { post_idx: 2, user_idx: 0, content: '太聪明了！怎么训练的求教程' },
    { post_idx: 4, user_idx: 0, content: '谢谢李医生！收藏了！' },
    { post_idx: 4, user_idx: 2, content: '专业！我家狗去年差点中暑，太可怕了' },
    { post_idx: 5, user_idx: 1, content: '生日快乐！要健健康康哦～' },
  ];

  mockComments.forEach((comment, idx) => {
    const posts = db.getAll('posts');
    const postId = posts[comment.post_idx].id;
    const userId = createdUsers[comment.user_idx].id;
    
    db.insert('comments', {
      post_id: postId,
      user_id: userId,
      content: comment.content,
      like_count: Math.floor(Math.random() * 10),
    });
  });

  console.log(`Created ${mockComments.length} comments`);

  db.insert('follows', {
    follower_id: createdUsers[0].id,
    following_id: createdUsers[1].id,
  });
  db.insert('follows', {
    follower_id: createdUsers[0].id,
    following_id: createdUsers[2].id,
  });
  db.insert('follows', {
    follower_id: createdUsers[2].id,
    following_id: createdUsers[0].id,
  });
  db.insert('follows', {
    follower_id: createdUsers[3].id,
    following_id: createdUsers[1].id,
  });

  const mockQuestions = [
    {
      user_id: createdUsers[0].id,
      title: '猫咪最近掉毛严重怎么办？',
      content: '橘子最近掉毛特别严重，一摸一手毛，已经换毛季了吗？饮食正常，精神也很好，需要补充什么吗？',
      category: 'health',
      reward_points: 50,
      view_count: 128,
      petIds: [createdPets[0].id],
    },
    {
      user_id: createdUsers[2].id,
      title: '柯基怎么训练定点大小便？',
      content: '汉堡3个月大了，教了好久还是随地大小便，求有经验的铲屎官分享方法！',
      category: 'behavior',
      reward_points: 30,
      view_count: 256,
      petIds: [createdPets[3].id],
    },
    {
      user_id: createdUsers[3].id,
      title: '鹦鹉可以吃什么水果？',
      content: '皮皮很爱吃水果，但怕有些水果对它有害，请问哪些水果是安全的？哪些不能吃？',
      category: 'nutrition',
      reward_points: 20,
      view_count: 89,
      petIds: [createdPets[4].id],
    },
  ];

  const createdQuestions = mockQuestions.map(q => {
    const qst = db.insert('questions', {
      user_id: q.user_id,
      title: q.title,
      content: q.content,
      category: q.category,
      reward_points: q.reward_points,
      view_count: q.view_count,
      accepted_answer_id: null,
    });
    return qst;
  });

  console.log(`Created ${createdQuestions.length} questions`);

  const mockAnswers = [
    {
      question_idx: 0,
      user_idx: 1,
      content: '您好！猫咪掉毛严重可能有几个原因：\n1. 季节性换毛：春秋季是换毛期，正常现象\n2. 营养问题：可以补充卵磷脂和三文鱼油\n3. 洗澡过勤：破坏皮肤油脂层\n4. 皮肤问题：检查有没有皮屑、红疹\n\n建议每天梳毛，增加 Omega-3 摄入，如果伴随其他症状请及时就医。',
      is_accepted: true,
    },
    {
      question_idx: 0,
      user_idx: 2,
      content: '我家也是英短，换毛季真的是行走的蒲公英！每天梳毛+吃鱼油，感觉掉毛少了一些。另外扫地机器人真的是养宠必备😂',
      is_accepted: false,
    },
    {
      question_idx: 1,
      user_idx: 0,
      content: '我家猫是用诱导剂+零食奖励的方法：\n1. 铺好尿垫，喷上诱导剂\n2. 饭后15分钟抱到尿垫上\n3. 一旦在上面尿了立刻给零食+表扬\n4. 做错了不要打骂，清理干净就行\n\n耐心一点，狗狗很快就会学会的！',
      is_accepted: true,
    },
    {
      question_idx: 2,
      user_idx: 1,
      content: '鹦鹉可以吃的安全水果：苹果（去核）、香蕉、蓝莓、草莓、西瓜（无籽）、橙子少量\n\n禁止食用：牛油果（有毒）、芒果（易过敏）、樱桃（果核有毒）、果核和籽都要去掉\n\n每次不要喂太多，水果糖分较高哦～',
      is_accepted: false,
    },
  ];

  mockAnswers.forEach(answer => {
    const questionId = createdQuestions[answer.question_idx].id;
    const userId = createdUsers[answer.user_idx].id;
    
    const ans = db.insert('answers', {
      question_id: questionId,
      user_id: userId,
      content: answer.content,
      is_accepted: answer.is_accepted ? 1 : 0,
      like_count: Math.floor(Math.random() * 20) + 5,
    });

    if (answer.is_accepted) {
      db.update('questions', questionId, {
        accepted_answer_id: ans.id,
      });
    }
  });

  console.log(`Created ${mockAnswers.length} answers`);

  const weightData = [
    { pet_idx: 0, weights: [4.2, 4.5, 4.8, 5.1, 5.3, 5.5] },
    { pet_idx: 1, weights: [2.8, 3.0, 3.2, 3.5, 3.6, 3.7] },
    { pet_idx: 2, weights: [25, 27, 28, 29, 30, 31] },
  ];

  weightData.forEach(({ pet_idx, weights }) => {
    const petId = createdPets[pet_idx].id;
    weights.forEach((weight, idx) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (weights.length - 1 - idx));
      db.insert('weightRecords', {
        pet_id: petId,
        weight,
        date: date.toISOString().split('T')[0],
        note: idx === weights.length - 1 ? '最近体重' : '',
      });
    });
  });

  const vaccineData = [
    { pet_idx: 0, name: '猫三联', nextDays: 30 },
    { pet_idx: 0, name: '狂犬疫苗', nextDays: 90 },
    { pet_idx: 2, name: '犬六联', nextDays: 15 },
    { pet_idx: 2, name: '狂犬疫苗', nextDays: 60 },
  ];

  vaccineData.forEach(({ pet_idx, name, nextDays }) => {
    const petId = createdPets[pet_idx].id;
    const lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 300);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDays);
    
    db.insert('vaccineRecords', {
      pet_id: petId,
      name,
      date: lastDate.toISOString().split('T')[0],
      next_date: nextDate.toISOString().split('T')[0],
      hospital: '萌宠乐园宠物医院',
      note: '年度疫苗',
    });
  });

  const dewormingData = [
    { pet_idx: 0, type: 'internal', nextDays: 20 },
    { pet_idx: 0, type: 'external', nextDays: 10 },
    { pet_idx: 2, type: 'internal', nextDays: 25 },
    { pet_idx: 2, type: 'external', nextDays: 5 },
  ];

  dewormingData.forEach(({ pet_idx, type, nextDays }) => {
    const petId = createdPets[pet_idx].id;
    const lastDate = new Date();
    lastDate.setDate(lastDate.getDate() - 90);
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDays);
    
    db.insert('dewormingRecords', {
      pet_id: petId,
      type,
      date: lastDate.toISOString().split('T')[0],
      next_date: nextDate.toISOString().split('T')[0],
      product: type === 'internal' ? '拜耳拜宠清' : '福来恩',
      note: '常规驱虫',
    });
  });

  console.log('Created health records');

  const mockPlaces = [
    {
      name: '萌宠乐园宠物医院',
      type: 'hospital',
      address: '北京市朝阳区建国路88号SOHO现代城A座1层',
      phone: '010-12345678',
      business_hours: '周一至周日 09:00-21:00',
      description: '专业宠物医院，设备先进，医生团队经验丰富。提供24小时急诊服务，科室齐全。',
      rating: 4.8,
      review_count: 156,
      lat: 39.9042,
      lng: 116.4074,
      created_by: createdUsers[1].id,
      images: [generatePlaceImage('hospital', 'hosp1'), generatePlaceImage('hospital', 'hosp2')],
    },
    {
      name: '爱心宠物寄养中心',
      type: 'boarding',
      address: '北京市海淀区中关村大街1号',
      phone: '010-87654321',
      business_hours: '周一至周日 08:00-20:00',
      description: '家庭式寄养环境，专人24小时照顾，每天遛狗3次，提供视频监控。独立房间，避免交叉感染。',
      rating: 4.9,
      review_count: 89,
      lat: 39.9842,
      lng: 116.3074,
      created_by: createdUsers[2].id,
      images: [generatePlaceImage('boarding', 'board1'), generatePlaceImage('boarding', 'board2')],
    },
    {
      name: '毛孩咖啡',
      type: 'friendly',
      address: '北京市西城区西单北大街100号',
      phone: '010-55667788',
      business_hours: '周一至周日 10:00-22:00',
      description: '宠物友好咖啡馆，欢迎携带宠物入内。提供宠物专属菜单，有宠物玩耍区域。',
      rating: 4.7,
      review_count: 234,
      lat: 39.9142,
      lng: 116.3674,
      created_by: createdUsers[0].id,
      images: [generatePlaceImage('friendly', 'cafe1'), generatePlaceImage('friendly', 'cafe2')],
    },
    {
      name: '爱康宠物医院',
      type: 'hospital',
      address: '北京市东城区东直门外大街50号',
      phone: '010-66778899',
      business_hours: '周一至周日 24小时',
      description: '24小时宠物急诊中心，配备先进的医疗设备，专业团队，价格透明。',
      rating: 4.6,
      review_count: 312,
      lat: 39.9442,
      lng: 116.4374,
      created_by: createdUsers[1].id,
      images: [generatePlaceImage('hospital', 'hosp3')],
    },
    {
      name: '狗狗乐园寄养',
      type: 'boarding',
      address: '北京市通州区新华大街200号',
      phone: '010-33445566',
      business_hours: '周一至周日 07:00-21:00',
      description: '大型宠物寄养基地，有户外活动场地，狗狗可以自由奔跑。专业训犬师管理。',
      rating: 4.5,
      review_count: 178,
      lat: 39.9242,
      lng: 116.6574,
      created_by: createdUsers[2].id,
      images: [generatePlaceImage('boarding', 'board3')],
    },
  ];

  mockPlaces.forEach(place => {
    const createdPlace = db.insert('places', {
      name: place.name,
      type: place.type,
      address: place.address,
      phone: place.phone,
      business_hours: place.business_hours,
      description: place.description,
      rating: place.rating,
      review_count: place.review_count,
      lat: place.lat,
      lng: place.lng,
      created_by: place.created_by,
      is_approved: 1,
    });

    place.images.forEach(img => {
      db.insert('placeImages', {
        place_id: createdPlace.id,
        image: img,
      });
    });
  });

  console.log(`Created ${mockPlaces.length} places`);

  const reviewContents = [
    '医生非常专业，检查很仔细，收费也合理。我家猫在这里做的绝育，恢复得很好。',
    '环境很干净，没有异味。前台小姐姐态度很好，解答了我很多问题。',
    '24小时急诊真的太重要了！我家狗半夜突发疾病，及时得到了救治。',
    '寄养过两次，狗狗每次都很开心。每天都有视频，很放心。',
    '场地很大，狗狗可以跑跳。工作人员很负责，会按时喂饭遛狗。',
    '带猫来喝咖啡，猫主子很开心。环境布置得很可爱，适合拍照。',
    '宠物菜单很用心，我家狗吃得很欢。店员也都很喜欢小动物。',
  ];

  const places = db.getAll('places');
  places.forEach((place, placeIdx) => {
    for (let i = 0; i < 2; i++) {
      const review = db.insert('reviews', {
        place_id: place.id,
        user_id: createdUsers[(placeIdx + i) % createdUsers.length].id,
        rating: [4, 5, 5, 4, 5][(placeIdx + i) % 5],
        content: reviewContents[(placeIdx * 2 + i) % reviewContents.length],
      });
    }
  });

  console.log('Mock data initialization complete!');
  console.log('Demo accounts:');
  console.log('  User: demo@pet.com / 123456');
  console.log('  Vet:  vet@pet.com / 123456');
  console.log('  User: doglover@pet.com / 123456');
}
