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

export function generatePlaceImage(type: string, seed?: string): string {
  const s = seed || Math.random().toString(36).substring(7);
  const typeNames: Record<string, string> = {
    hospital: 'veterinary clinic interior, clean and professional',
    boarding: 'pet boarding facility, cozy and clean',
    friendly: 'pet friendly cafe, warm atmosphere',
  };
  const prompt = encodeURIComponent(typeNames[type] || 'pet related place');
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${prompt}&image_size=landscape_4_3`;
}
