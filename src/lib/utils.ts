import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Fusionne les classes Tailwind sans conflits
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formate un prix en FCFA ou autre devise
export function formatPrice(
  amount: number,
  currency: string = 'XOF',
  locale: string = 'fr-SN'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Génère un slug depuis un texte
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// Formate une date en français
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// Tronque un texte
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// Génère un numéro de commande unique
export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `CMD-${timestamp}-${random}`
}

// Calcule le pourcentage de réduction
export function discountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100)
}

// Valide un numéro de téléphone africain
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '')
  return /^(\+?[0-9]{8,15})$/.test(cleaned)
}

// Formate un numéro de téléphone
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

// Taille de fichier lisible
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}
