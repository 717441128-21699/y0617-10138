import api from './axios';
import type { User, Pet, Post, Question, Place, HealthReminder } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    nickname: string;
    avatar: string;
    points: number;
    isVet: boolean;
  };
}

export const authApi = {
  login: (data: LoginRequest) => api.post<AuthResponse>('/auth/login', data).then(res => res.data),
  register: (data: RegisterRequest) => api.post<AuthResponse>('/auth/register', data).then(res => res.data),
  getMe: () => api.get<User>('/auth/me').then(res => res.data),
};

export const userApi = {
  getById: (userId: number) => api.get<User>(`/users/${userId}`).then(res => res.data),
  follow: (userId: number) => api.post(`/users/${userId}/follow`).then(res => res.data),
  unfollow: (userId: number) => api.delete(`/users/${userId}/follow`).then(res => res.data),
  updateProfile: (data: { nickname?: string; avatar?: string; bio?: string }) => 
    api.put<User>('/users/profile', data).then(res => res.data),
  getPosts: (userId: number) => api.get<{ total: number; posts: Post[] }>(`/users/${userId}/posts`).then(res => res.data),
  getPets: (userId: number) => api.get<{ total: number; pets: Pet[] }>(`/users/${userId}/pets`).then(res => res.data),
  getFollowers: (userId: number) => api.get<{ users: User[]; total: number }>(`/users/${userId}/followers`).then(res => res.data),
  getFollowing: (userId: number) => api.get<{ users: User[]; total: number }>(`/users/${userId}/following`).then(res => res.data),
};

export const petApi = {
  getAll: () => api.get<{ total: number; pets: Pet[] }>('/pets').then(res => res.data),
  getById: (petId: number) => api.get<Pet>(`/pets/${petId}`).then(res => res.data),
  create: (data: any) => api.post<Pet>('/pets', data).then(res => res.data),
  update: (petId: number, data: any) => api.put<Pet>(`/pets/${petId}`, data).then(res => res.data),
  delete: (petId: number) => api.delete(`/pets/${petId}`).then(res => res.data),
  addPhoto: (petId: number, data: { image: string; caption: string; date: string }) => 
    api.post(`/pets/${petId}/photos`, data).then(res => res.data),
  deletePhoto: (petId: number, photoId: number) => 
    api.delete(`/pets/${petId}/photos/${photoId}`).then(res => res.data),
};

export const postApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    sort?: 'latest' | 'hot';
    species?: string;
    tag?: string;
    following?: boolean;
  }) => api.get<{
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    posts: Post[];
  }>('/posts', { params }).then(res => res.data),
  getById: (postId: number) => api.get<Post>(`/posts/${postId}`).then(res => res.data),
  create: (data: { content: string; images?: string[]; tags?: string[]; petIds?: number[] }) => 
    api.post<Post>('/posts', data).then(res => res.data),
  like: (postId: number) => api.post(`/posts/${postId}/like`).then(res => res.data),
  unlike: (postId: number) => api.delete(`/posts/${postId}/like`).then(res => res.data),
  share: (postId: number) => api.post(`/posts/${postId}/share`).then(res => res.data),
  getComments: (postId: number) => api.get(`/posts/${postId}/comments`).then(res => res.data),
  addComment: (postId: number, data: { content: string; replyToId?: number }) => 
    api.post(`/posts/${postId}/comments`, data).then(res => res.data),
  getHotTags: () => api.get<{ tags: { tag: string; count: number }[] }>('/posts/tags/hot').then(res => res.data),
};

export const qaApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    sort?: 'latest' | 'hot' | 'unanswered';
    answered?: boolean;
  }) => api.get<{
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    questions: Question[];
  }>('/questions', { params }).then(res => res.data),
  getById: (questionId: number) => api.get<Question>(`/questions/${questionId}`).then(res => res.data),
  create: (data: {
    title: string;
    content: string;
    category: string;
    rewardPoints: number;
    petIds?: number[];
  }) => api.post<Question>('/questions', data).then(res => res.data),
  addAnswer: (questionId: number, data: { content: string }) => 
    api.post(`/questions/${questionId}/answers`, data).then(res => res.data),
  acceptAnswer: (questionId: number, answerId: number) => 
    api.post(`/questions/${questionId}/answers/${answerId}/accept`).then(res => res.data),
  likeAnswer: (questionId: number, answerId: number) => 
    api.post(`/questions/${questionId}/answers/${answerId}/like`).then(res => res.data),
};

export const healthApi = {
  getReminders: () => api.get<{ reminders: HealthReminder[] }>('/health/reminders').then(res => res.data),
  getWeightRecords: (petId?: number) => 
    api.get<{ records: any[] }>('/health/weight', { params: petId ? { petId } : undefined }).then(res => res.data),
  addWeightRecord: (data: { petId: number; weight: number; date: string; note?: string }) => 
    api.post('/health/weight', data).then(res => res.data),
  getVaccineRecords: (petId?: number) => 
    api.get<{ records: any[] }>('/health/vaccines', { params: petId ? { petId } : undefined }).then(res => res.data),
  addVaccineRecord: (data: {
    petId: number;
    name: string;
    date: string;
    nextDate?: string;
    hospital?: string;
    note?: string;
  }) => api.post('/health/vaccines', data).then(res => res.data),
  getDewormingRecords: (petId?: number) => 
    api.get<{ records: any[] }>('/health/deworming', { params: petId ? { petId } : undefined }).then(res => res.data),
  addDewormingRecord: (data: {
    petId: number;
    type: 'internal' | 'external';
    date: string;
    nextDate?: string;
    product?: string;
    note?: string;
  }) => api.post('/health/deworming', data).then(res => res.data),
  deleteRecord: (type: 'weight' | 'vaccines' | 'deworming', recordId: number) => 
    api.delete(`/health/${type}/${recordId}`).then(res => res.data),
};

export const placeApi = {
  getAll: (params?: { type?: string; lat?: number; lng?: number }) => 
    api.get<{ total: number; places: Place[] }>('/places', { params }).then(res => res.data),
  getById: (placeId: number) => api.get<Place>(`/places/${placeId}`).then(res => res.data),
  create: (data: any) => api.post<Place>('/places', data).then(res => res.data),
  addReview: (placeId: number, data: { rating: number; content?: string; images?: string[] }) => 
    api.post(`/places/${placeId}/reviews`, data).then(res => res.data),
};

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post<{ url: string }>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.url;
};
