/** Favoris stockés sur l'appareil (aucun compte requis). */
export interface FavItem { id: string; name: string; price: number; img: string | null; shop: string }
const KEY = 'jokoo_favorites'

export function getFavorites(): FavItem[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { return [] }
}
export function isFavorite(id: string) {
  return getFavorites().some(f => f.id === id)
}
/** Retourne true si le produit est maintenant en favori. */
export function toggleFavorite(item: FavItem): boolean {
  const list = getFavorites()
  const exists = list.some(f => f.id === item.id)
  const next = exists ? list.filter(f => f.id !== item.id) : [item, ...list].slice(0, 100)
  localStorage.setItem(KEY, JSON.stringify(next))
  return !exists
}
