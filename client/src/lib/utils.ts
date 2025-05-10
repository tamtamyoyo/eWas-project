import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatPercentage(value: number): string {
  return value.toFixed(1) + '%';
}

export function getRelativeTimeString(date: Date | string): string {
  const now = new Date();
  const pastDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }
  
  return formatDate(date);
}

export function getPlatformColor(platform: string): string {
  const colors: {[key: string]: string} = {
    facebook: '#4267B2',
    instagram: '#E1306C', 
    twitter: '#1DA1F2',
    linkedin: '#0077B5',
    snapchat: '#FFFC00'
  };
  
  return colors[platform.toLowerCase()] || '#6B7280';
}

export function getPlatformIcon(platform: string): string {
  const icons: {[key: string]: string} = {
    facebook: 'fa-facebook-f',
    instagram: 'fa-instagram',
    twitter: 'fa-twitter',
    linkedin: 'fa-linkedin-in',
    snapchat: 'fa-snapchat'
  };
  
  return icons[platform.toLowerCase()] || 'fa-globe';
}
