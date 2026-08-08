import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (url.startsWith('/uploads/')) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const baseUrl = apiUrl.replace('/api', '')
    return `${baseUrl}${url}`
  }
  return url
}
