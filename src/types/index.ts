export interface User {
  id: number;
  email: string;
  phone: string;
  nickname: string;
  avatar: string;
  bio: string;
  points: number;
  isVet: boolean;
  createdAt: string;
  followingCount?: number;
  followerCount?: number;
  postCount?: number;
  isFollowing?: boolean;
}

export interface Pet {
  id: number;
  userId: number;
  name: string;
  species: 'cat' | 'dog' | 'bird' | 'reptile' | 'other';
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  avatar: string;
  bio: string;
  createdAt: string;
  age: number;
  photos: PetPhoto[];
}

export interface PetPhoto {
  id: number;
  petId: number;
  image: string;
  caption: string;
  date: string;
  createdAt: string;
}

export interface Post {
  id: number;
  userId: number;
  user: User;
  content: string;
  images: string[];
  tags: string[];
  pets: Pet[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  user: User;
  replyToId: number | null;
  replyTo?: User;
  content: string;
  likeCount: number;
  createdAt: string;
}

export interface Question {
  id: number;
  userId: number;
  user: User;
  title: string;
  content: string;
  category: string;
  rewardPoints: number;
  viewCount: number;
  answerCount: number;
  isAnswered: boolean;
  acceptedAnswerId: number | null;
  createdAt: string;
  answers: Answer[];
  petIds: number[];
  pets?: Pet[];
}

export interface Answer {
  id: number;
  questionId: number;
  userId: number;
  user: User;
  content: string;
  isAccepted: boolean;
  likeCount: number;
  createdAt: string;
}

export interface WeightRecord {
  id: number;
  petId: number;
  pet?: Pet;
  weight: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface VaccineRecord {
  id: number;
  petId: number;
  pet?: Pet;
  name: string;
  date: string;
  nextDate: string;
  hospital: string;
  note: string;
  createdAt: string;
}

export interface DewormingRecord {
  id: number;
  petId: number;
  pet?: Pet;
  type: 'internal' | 'external';
  date: string;
  nextDate: string;
  product: string;
  note: string;
  createdAt: string;
}

export interface HealthReminder {
  id: number;
  petId: number;
  pet: Pet;
  type: 'vaccine' | 'deworming';
  title: string;
  date: string;
  daysLeft: number;
}

export interface Place {
  id: number;
  name: string;
  type: 'boarding' | 'hospital' | 'friendly';
  address: string;
  phone: string;
  businessHours: string;
  images: string[];
  description: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  createdBy: number;
  isApproved: boolean;
  createdAt: string;
  reviews?: Review[];
}

export interface Review {
  id: number;
  placeId: number;
  userId: number;
  user: User;
  rating: number;
  content: string;
  images: string[];
  createdAt: string;
}

export interface Follow {
  id: number;
  followerId: number;
  followingId: number;
  createdAt: string;
}

export interface SpeciesCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const SPECIES_CATEGORIES: SpeciesCategory[] = [
  { id: 'cat', name: '猫咪', icon: 'Cat', color: 'bg-accent-pink' },
  { id: 'dog', name: '狗狗', icon: 'Dog', color: 'bg-accent-yellow' },
  { id: 'bird', name: '鸟类', icon: 'Bird', color: 'bg-accent-blue' },
  { id: 'reptile', name: '爬宠', icon: 'Bug', color: 'bg-secondary-300' },
  { id: 'other', name: '其他', icon: 'PawPrint', color: 'bg-accent-purple' },
];

export const PLACE_TYPES = [
  { id: 'hospital', name: '宠物医院', icon: 'Hospital', color: 'bg-red-100 text-red-600' },
  { id: 'boarding', name: '宠物寄养', icon: 'Home', color: 'bg-blue-100 text-blue-600' },
  { id: 'friendly', name: '宠物友好', icon: 'Coffee', color: 'bg-green-100 text-green-600' },
];

export const QA_CATEGORIES = [
  { id: 'health', name: '健康医疗' },
  { id: 'behavior', name: '行为训练' },
  { id: 'nutrition', name: '喂养饮食' },
  { id: 'grooming', name: '美容护理' },
  { id: 'breeding', name: '繁殖生育' },
  { id: 'other', name: '其他问题' },
];
