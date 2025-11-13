/**
 * Geographic coordinates
 */
export interface Coordinates {
  lat: number
  lon: number
}

/**
 * Figure image metadata with fallback support
 */
export interface FigureImage {
  url: string
  license: string
  credit: string
  source_url: string
  priority: number // 1=primary, 2=secondary, 3=tertiary
  status: 'active' | 'fallback' | 'broken'
}

/**
 * Historical figure data structure
 */
export interface Figure {
  id: string
  name: string
  aliases: string[]
  images: FigureImage[]
  birth_year: number
  death_year: number | null
  active_year: number | null
  hometown: string
  lat: number
  lon: number
  description: string
  tags: string[]
  created_at?: string
  updated_at?: string
}

/**
 * Simplified figure for gameplay (without metadata)
 */
export interface GameFigure {
  id: string
  name: string
  aliases: string[]
  images: FigureImage[]
  birth_year: number
  lat: number
  lon: number
  description: string
}

