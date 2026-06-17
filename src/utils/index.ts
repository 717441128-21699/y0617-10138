export { SPECIES_CATEGORIES, PLACE_TYPES, QA_CATEGORIES } from '../types';

export function calculateAge(birthday: string): number {
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function timeAgo(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  
  return formatDate(d);
}

export function calculateDaysUntil(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getSpeciesIcon(species: string): string {
  const icons: Record<string, string> = {
    cat: 'Cat',
    dog: 'Dog',
    bird: 'Bird',
    reptile: 'Bug',
    other: 'PawPrint',
  };
  return icons[species] || 'PawPrint';
}

export function getSpeciesName(species: string): string {
  const names: Record<string, string> = {
    cat: '猫咪',
    dog: '狗狗',
    bird: '鸟类',
    reptile: '爬宠',
    other: '其他',
  };
  return names[species] || '其他';
}

export function getSpeciesColor(species: string): string {
  const colors: Record<string, string> = {
    cat: 'bg-accent-pink text-pink-700',
    dog: 'bg-accent-yellow text-yellow-700',
    bird: 'bg-accent-blue text-blue-700',
    reptile: 'bg-secondary-200 text-secondary-700',
    other: 'bg-accent-purple text-purple-700',
  };
  return colors[species] || 'bg-gray-200 text-gray-700';
}

export function getPlaceTypeName(type: string): string {
  const names: Record<string, string> = {
    hospital: '宠物医院',
    boarding: '宠物寄养',
    friendly: '宠物友好',
  };
  return names[type] || '其他';
}

export function getPlaceTypeColor(type: string): string {
  const colors: Record<string, string> = {
    hospital: 'bg-red-100 text-red-600',
    boarding: 'bg-blue-100 text-blue-600',
    friendly: 'bg-green-100 text-green-600',
  };
  return colors[type] || 'bg-gray-100 text-gray-600';
}

export function getQaCategoryName(category: string): string {
  const names: Record<string, string> = {
    health: '健康医疗',
    behavior: '行为训练',
    nutrition: '喂养饮食',
    grooming: '美容护理',
    breeding: '繁殖生育',
    other: '其他问题',
  };
  return names[category] || '其他';
}

export function generatePetImage(species: string, seed?: string): string {
  const s = seed || Math.random().toString(36).substring(7);
  const prompt = encodeURIComponent(`cute ${species} pet, high quality, warm lighting, professional photography`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square_hd`;
}

export function generateAvatar(seed?: string): string {
  const s = seed || Math.random().toString(36).substring(7);
  const prompt = encodeURIComponent(`cute avatar portrait, cartoon style, warm colors, pet lover`);
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=square`;
}
