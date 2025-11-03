/**
 * Figure image metadata
 */
export interface FigureImage {
  url: string
  license: string
  credit: string
  source_url: string
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

