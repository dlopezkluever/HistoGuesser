#!/usr/bin/env tsx

/**
 * Image Discovery Script for HistoGuesser Figures
 *
 * This script automatically discovers suitable images for historical figures
 * using the Wikimedia Commons API. It finds public domain portraits meeting
 * quality standards and returns ranked candidates.
 *
 * Usage:
 *   npm run find-images "Albert Einstein" "Marie Curie"
 *   npm run find-images --batch figures.json
 *   npm run find-images --interactive
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env' });
config({ path: '.env.local' });

// =====================================================
// CONFIGURATION & TYPES
// =====================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Wikimedia API configuration
const WIKIMEDIA_BASE = 'https://commons.wikimedia.org/w/api.php';
const SEARCH_PARAMS = {
  action: 'query',
  format: 'json',
  origin: '*' // CORS handling
};

// Quality thresholds
const QUALITY_THRESHOLDS = {
  minResolution: 400,    // pixels on longest side
  maxResolution: 1200,   // prevent extremely large images
  maxFileSize: 5000000,  // 5MB max
  requiredLicense: 'public domain'
};

// Search strategies
const SEARCH_STRATEGIES = [
  (name: string) => `${name} portrait`,
  (name: string) => `${name} photograph`,
  (name: string) => `${name} photo`,
  (name: string, aliases: string[]) => aliases.length > 0 ? `${aliases[0]} portrait` : null
].filter(Boolean);

// Types
interface WikimediaSearchResult {
  ns: number;
  title: string;
  pageid: number;
  size: number;
  wordcount: number;
  snippet: string;
  timestamp: string;
}

interface WikimediaImageInfo {
  title: string;
  imageinfo: Array<{
    url: string;
    descriptionurl: string;
    extmetadata: {
      LicenseShortName?: { value: string };
      Artist?: { value: string };
      ImageDescription?: { value: string };
      DateTimeOriginal?: { value: string };
    };
    size: number;
    width: number;
    height: number;
  }>;
}

interface ImageCandidate {
  filename: string;
  url: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  license: string;
  artist: string;
  description: string;
  source: string;
  qualityScore: number;
  relevanceScore: number;
  totalScore: number;
}

interface DiscoveryResult {
  figureName: string;
  aliases: string[];
  candidates: ImageCandidate[];
  topCandidates: ImageCandidate[];
  searchTime: number;
  totalFound: number;
  validCandidates: number;
}

// =====================================================
// WIKIMEDIA API FUNCTIONS
// =====================================================

/**
 * Search Wikimedia Commons for images
 */
async function searchWikimedia(query: string, limit: number = 20): Promise<WikimediaSearchResult[]> {
  const params = new URLSearchParams({
    ...SEARCH_PARAMS,
    list: 'search',
    srsearch: query,
    srlimit: limit.toString(),
    srnamespace: '6', // File namespace only
    srprop: 'title|snippet|size|wordcount|timestamp'
  });

  const response = await fetch(`${WIKIMEDIA_BASE}?${params}`);
  if (!response.ok) {
    throw new Error(`Wikimedia search failed: ${response.status}`);
  }

  const data = await response.json();
  return data.query?.search || [];
}

/**
 * Get detailed information about specific images
 */
async function getImageInfo(filenames: string[]): Promise<WikimediaImageInfo[]> {
  if (filenames.length === 0) return [];

  // Process in batches of 10 to avoid URL length limits
  const batches: WikimediaImageInfo[] = [];

  for (let i = 0; i < filenames.length; i += 10) {
    const batch = filenames.slice(i, i + 10);
    const titles = batch.map(f => `File:${f}`).join('|');

    const params = new URLSearchParams({
      ...SEARCH_PARAMS,
      prop: 'imageinfo',
      titles,
      iiprop: 'url|extmetadata|size'
    });

    const response = await fetch(`${WIKIMEDIA_BASE}?${params}`);
    if (!response.ok) {
      console.warn(`Image info batch failed: ${response.status}`);
      continue;
    }

    const data = await response.json();
    const pages = data.query?.pages || {};

    for (const page of Object.values(pages) as any[]) {
      if (page.imageinfo?.[0]) {
        batches.push(page);
      }
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return batches;
}

/**
 * Extract filename from Wikimedia title
 */
function extractFilename(title: string): string {
  return title.replace(/^File:/, '');
}

// =====================================================
// QUALITY ASSESSMENT
// =====================================================

/**
 * Calculate quality score for an image candidate
 */
function calculateQualityScore(candidate: ImageCandidate, figureName: string, aliases: string[]): number {
  let score = 0;

  // Resolution quality (25 points)
  const longestSide = Math.max(candidate.width, candidate.height);
  if (longestSide >= 600) score += 25;
  else if (longestSide >= 400) score += 15;
  else if (longestSide >= 200) score += 5;

  // File size appropriateness (10 points)
  if (candidate.fileSize < 1000000) score += 10; // < 1MB
  else if (candidate.fileSize < 3000000) score += 7;  // < 3MB
  else if (candidate.fileSize < 5000000) score += 3;  // < 5MB

  // License compliance (guaranteed by filtering, but 10 points)
  if (candidate.license.toLowerCase().includes('public domain')) score += 10;

  // Technical quality indicators (10 points)
  if (!candidate.filename.includes('bust') &&
      !candidate.filename.includes('coin') &&
      !candidate.filename.includes('statue') &&
      !candidate.description.toLowerCase().includes('statue')) {
    score += 10;
  }

  return Math.min(55, score); // Max 55 points for quality
}

/**
 * Calculate relevance score for an image candidate
 */
function calculateRelevanceScore(candidate: ImageCandidate, figureName: string, aliases: string[]): number {
  let score = 0;
  const searchTerms = [figureName.toLowerCase(), ...aliases.map(a => a.toLowerCase())];
  const filename = candidate.filename.toLowerCase();
  const description = candidate.description.toLowerCase();

  // Exact name matches (30 points)
  for (const term of searchTerms) {
    if (filename.includes(term)) {
      score += term === figureName.toLowerCase() ? 30 : 20;
      break;
    }
  }

  // Description matches (10 points)
  for (const term of searchTerms) {
    if (description.includes(term)) {
      score += 10;
      break;
    }
  }

  // Artist credibility (15 points)
  const credibleArtists = ['museum', 'nobel', 'academy', 'university', 'library'];
  const artist = candidate.artist.toLowerCase();
  if (credibleArtists.some(cred => artist.includes(cred))) {
    score += 15;
  }

  return Math.min(55, score); // Max 55 points for relevance
}

/**
 * Validate if candidate meets minimum requirements
 */
function validateCandidate(candidate: ImageCandidate): boolean {
  const longestSide = Math.max(candidate.width, candidate.height);

  return (
    longestSide >= QUALITY_THRESHOLDS.minResolution &&
    longestSide <= QUALITY_THRESHOLDS.maxResolution &&
    candidate.fileSize <= QUALITY_THRESHOLDS.maxFileSize &&
    candidate.license.toLowerCase().includes(QUALITY_THRESHOLDS.requiredLicense) &&
    candidate.url && candidate.url.length > 0
  );
}

// =====================================================
// MAIN DISCOVERY LOGIC
// =====================================================

/**
 * Discover images for a single figure
 */
async function discoverImagesForFigure(
  figureName: string,
  aliases: string[] = [],
  maxCandidates: number = 3
): Promise<DiscoveryResult> {
  const startTime = Date.now();
  console.log(`🔍 Discovering images for: ${figureName}`);

  const allCandidates: ImageCandidate[] = [];

  // Try different search strategies
  for (const strategy of SEARCH_STRATEGIES) {
    const query = strategy(figureName, aliases);
    if (!query) continue;

    try {
      console.log(`   Searching: "${query}"`);
      const searchResults = await searchWikimedia(query, 10);

      if (searchResults.length === 0) {
        console.log(`   No results for "${query}"`);
        continue;
      }

      // Extract filenames and get detailed info
      const filenames = searchResults.map(r => extractFilename(r.title));
      const imageInfos = await getImageInfo(filenames);

      // Convert to candidates
      for (const info of imageInfos) {
        if (!info.imageinfo?.[0]) continue;

        const img = info.imageinfo[0];
        const filename = extractFilename(info.title);

        const candidate: ImageCandidate = {
          filename,
          url: img.url,
          width: img.width,
          height: img.height,
          fileSize: img.size,
          license: img.extmetadata?.LicenseShortName?.value || 'Unknown',
          artist: img.extmetadata?.Artist?.value || 'Unknown',
          description: img.extmetadata?.ImageDescription?.value || '',
          source: 'Wikimedia Commons',
          qualityScore: 0,
          relevanceScore: 0,
          totalScore: 0
        };

        // Calculate scores
        candidate.qualityScore = calculateQualityScore(candidate, figureName, aliases);
        candidate.relevanceScore = calculateRelevanceScore(candidate, figureName, aliases);
        candidate.totalScore = candidate.qualityScore + candidate.relevanceScore;

        allCandidates.push(candidate);
      }

      console.log(`   Found ${imageInfos.length} images for "${query}"`);

    } catch (error) {
      console.warn(`   Search failed for "${query}":`, error);
    }

    // Rate limiting between searches
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Filter and rank candidates
  const validCandidates = allCandidates.filter(validateCandidate);
  const rankedCandidates = validCandidates
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, maxCandidates);

  const result: DiscoveryResult = {
    figureName,
    aliases,
    candidates: allCandidates,
    topCandidates: rankedCandidates,
    searchTime: Date.now() - startTime,
    totalFound: allCandidates.length,
    validCandidates: validCandidates.length
  };

  console.log(`✅ Found ${rankedCandidates.length} valid candidates in ${result.searchTime}ms`);
  return result;
}

/**
 * Display discovery results in a readable format
 */
function displayResults(result: DiscoveryResult): void {
  console.log(`\n📊 RESULTS FOR: ${result.figureName}`);
  console.log(`='.repeat(50));
  console.log(`Search time: ${result.searchTime}ms`);
  console.log(`Total found: ${result.totalFound}`);
  console.log(`Valid candidates: ${result.validCandidates}`);
  console.log(`Top candidates: ${result.topCandidates.length}`);

  if (result.topCandidates.length > 0) {
    console.log(`\n🏆 TOP CANDIDATES:`);
    result.topCandidates.forEach((candidate, index) => {
      console.log(`\n${index + 1}. ${candidate.filename}`);
      console.log(`   URL: ${candidate.url}`);
      console.log(`   Resolution: ${candidate.width}x${candidate.height}`);
      console.log(`   Size: ${Math.round(candidate.fileSize / 1024)}KB`);
      console.log(`   License: ${candidate.license}`);
      console.log(`   Artist: ${candidate.artist}`);
      console.log(`   Quality Score: ${candidate.qualityScore}/55`);
      console.log(`   Relevance Score: ${candidate.relevanceScore}/55`);
      console.log(`   Total Score: ${candidate.totalScore}/110`);
    });
  } else {
    console.log(`\n❌ No suitable candidates found`);
    console.log(`💡 Try: Different search terms, check spelling, or manual research`);
  }
}

// =====================================================
// CLI INTERFACE
// =====================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🤖 HistoGuesser Image Discovery Script');
    console.log('=====================================');
    console.log('');
    console.log('Usage:');
    console.log('  npm run find-images "Figure Name" ["Another Figure"]');
    console.log('  npm run find-images --batch figures.json');
    console.log('  npm run find-images --interactive');
    console.log('');
    console.log('Examples:');
    console.log('  npm run find-images "Albert Einstein"');
    console.log('  npm run find-images "Marie Curie" "Leonardo da Vinci"');
    process.exit(0);
  }

  const results: DiscoveryResult[] = [];

  if (args.includes('--batch')) {
    // Batch processing from file
    const fileIndex = args.indexOf('--batch') + 1;
    const filename = args[fileIndex];

    if (!filename) {
      console.error('❌ Please specify a batch file: --batch figures.json');
      process.exit(1);
    }

    console.log(`📂 Processing batch file: ${filename}`);
    // TODO: Implement batch file processing

  } else if (args.includes('--interactive')) {
    // Interactive mode
    console.log('🎮 Interactive mode - enter figure names (Ctrl+C to exit):');
    const readline = await import('readline');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askFigure = () => {
      rl.question('Enter figure name (or "quit"): ', async (name) => {
        if (name.toLowerCase() === 'quit') {
          rl.close();
          return;
        }

        try {
          const result = await discoverImagesForFigure(name);
          displayResults(result);
          results.push(result);
        } catch (error) {
          console.error(`❌ Error processing ${name}:`, error);
        }

        askFigure(); // Continue asking
      });
    };

    askFigure();

  } else {
    // Direct figure names
    for (const figureName of args) {
      if (figureName.startsWith('--')) continue; // Skip flags

      try {
        const result = await discoverImagesForFigure(figureName);
        displayResults(result);
        results.push(result);

        // Brief pause between figures
        if (args.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing "${figureName}":`, error);
      }
    }
  }

  // Summary
  if (results.length > 0) {
    console.log(`\n📈 SUMMARY:`);
    console.log(`='.repeat(30));
    console.log(`Figures processed: ${results.length}`);
    console.log(`Total candidates found: ${results.reduce((sum, r) => sum + r.totalFound, 0)}`);
    console.log(`Valid candidates: ${results.reduce((sum, r) => sum + r.validCandidates, 0)}`);
    console.log(`Figures with good images: ${results.filter(r => r.topCandidates.length > 0).length}`);
    console.log(`Success rate: ${Math.round((results.filter(r => r.topCandidates.length > 0).length / results.length) * 100)}%`);
  }
}

// =====================================================
// SCRIPT EXECUTION
// =====================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { discoverImagesForFigure, validateCandidate };
