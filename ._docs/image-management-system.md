# **Image Management System - HistoGuesser**

**Date:** November 14, 2025
**Version:** 1.0
**Status:** Planned Implementation

---

## **🎯 Executive Summary**

This document outlines the comprehensive image management system for HistoGuesser, enabling automated discovery, validation, and maintenance of historical figure images at scale (1000+ figures). The system combines programmatic automation with human quality assurance to ensure reliable, high-quality images while maintaining efficient workflows.

**Key Achievements:**
- Automated image discovery via Wikimedia Commons API
- Multi-tier quality validation (400px+ resolution minimum)
- Fallback system for broken images
- Batch processing capabilities
- Public domain licensing compliance

---

## **🏗️ System Architecture**

### **Core Components**

```
📁 Image Management System
├── 🔍 Discovery Engine (Wikimedia API)
├── ✅ Validation Pipeline
├── 🎯 Quality Ranking Algorithm
├── 💾 Database Integration
├── 🔄 Maintenance & Fallbacks
└── 👥 Quality Assurance Workflow
```

### **Data Flow**

```
Figure Research → Image Discovery → Quality Filtering → Validation → Database → QA Review → Production
     ↓              ↓              ↓              ↓              ↓              ↓              ↓
  [Manual]     [Automated]     [Automated]     [Automated]     [Automated]     [Manual]     [Automated]
```

---

## **📋 Quality Standards & Criteria**

### **Resolution Requirements**
- **Minimum**: 400px on longest side
- **Preferred**: 600px on longest side
- **Maximum**: 800px on longest side (performance considerations)

**Rationale:**
- 400px ensures clarity on mobile devices
- Balances quality vs. loading speed
- Prevents excessive bandwidth usage

### **Content Requirements**
- **Portrait-style** images preferred
- **Public domain** licensing only
- **Historical accuracy** (depicts the correct person)
- **Technical quality** (not corrupted, clear)

### **Acceptable Sources**
- Wikimedia Commons (primary)
- Wikipedia images (secondary)
- Museum collections (tertiary)
- Academic archives (fallback)

---

## **🎯 Two Operational Scenarios**

### **Scenario A: Adding NEW Figures (Primary Use Case)**

#### **Process Overview**
1. **Research Phase**: Historical figure metadata collected
2. **Automated Discovery**: Script finds suitable images
3. **Quality Filtering**: Automatic validation and ranking
4. **Database Integration**: Images added with proper metadata
5. **QA Spot Check**: Sample review for quality assurance

#### **Input Requirements**
```json
{
  "name": "Albert Einstein",
  "aliases": ["Einstein"],
  "birth_year": 1879,
  "death_year": 1955,
  "hometown": "Ulm, Germany",
  "description": "Theoretical physicist...",
  "tags": ["scientist", "physicist", "modern"]
}
```

#### **Expected Output**
```json
{
  "figure_id": "uuid",
  "images": [
    {
      "url": "https://commons.wikimedia.org/...",
      "priority": 1,
      "status": "active",
      "license": "Public Domain",
      "credit": "Source Name",
      "source_url": "https://commons.wikimedia.org/...",
      "resolution": "600x800",
      "quality_score": 85
    }
  ]
}
```

### **Scenario B: Fixing BROKEN Images (Maintenance)**

#### **Process Overview**
1. **Detection**: Validation script identifies broken images
2. **Automated Search**: Find alternatives for same figure
3. **Quality Match**: Ensure replacement is appropriate
4. **Fallback Addition**: Add as priority 2, mark original broken
5. **Gradual Migration**: System uses working fallbacks

#### **Broken Image Handling**
```sql
-- Original broken image
{
  "url": "broken-url.jpg",
  "priority": 1,
  "status": "broken"
}

-- Added fallback
{
  "url": "replacement-url.jpg",
  "priority": 2,
  "status": "active"
}
```

---

## **🔍 Automated Image Discovery**

### **Wikimedia Commons API Integration**

#### **API Endpoints Used**
```typescript
const WIKIMEDIA_ENDPOINTS = {
  search: 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={query}&format=json',
  imageInfo: 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&format=json&titles=File:{filename}',
  categoryMembers: 'https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:{category}&format=json'
};
```

#### **Search Strategy**
1. **Primary Search**: Direct name + "portrait"
   - `"Albert Einstein portrait"`
   - `"Albert Einstein photograph"`

2. **Category Search**: Figure-specific categories
   - `"Category:Albert Einstein"`
   - `"Category:Portraits of physicists"`

3. **Alternative Names**: Use aliases
   - `"Einstein portrait"` (if "Albert Einstein" fails)

#### **Filtering Criteria**
```typescript
const IMAGE_FILTERS = {
  license: (metadata) => metadata.license === 'public domain',
  resolution: (width, height) => Math.max(width, height) >= 400,
  content: (filename, description) =>
    !filename.includes('bust') &&
    !filename.includes('coin') &&
    !description.includes('statue'),
  quality: (filesize) => filesize < 5000000 // 5MB max
};
```

### **Quality Ranking Algorithm**

#### **Ranking Factors (0-100 scale)**
1. **Name Match (30 points)**
   - Exact name in filename: 30
   - Partial match: 20
   - Category match: 10

2. **Resolution Quality (25 points)**
   - 600px+: 25
   - 400-600px: 15
   - 200-400px: 5

3. **Source Credibility (20 points)**
   - Museum/Nobel: 20
   - Academic: 15
   - General public domain: 10

4. **Image Age (15 points)**
   - Contemporary to subject: 15
   - Historical reproduction: 10
   - Modern recreation: 5

5. **Technical Quality (10 points)**
   - Clear, well-lit: 10
   - Acceptable: 5

#### **Final Selection**
- Return top 3 candidates sorted by total score
- Require minimum 50/100 points for acceptance
- Flag low-scoring results for manual review

---

## **✅ Validation Pipeline**

### **Multi-Stage Validation**

#### **Stage 1: URL Accessibility**
```typescript
// Check if image loads (browser-compatible)
const accessibilityCheck = await validateImageUrl(imageUrl, 10000); // 10s timeout
if (!accessibilityCheck.isValid) {
  markAsBroken(imageUrl);
  continue;
}
```

#### **Stage 2: Content Validation**
```typescript
// Verify it's actually an image and meets size requirements
const contentCheck = await fetch(imageUrl, { method: 'HEAD' });
const contentType = contentCheck.headers.get('content-type');
const contentLength = contentCheck.headers.get('content-length');

if (!contentType?.startsWith('image/')) reject();
if (parseInt(contentLength) > MAX_FILE_SIZE) reject();
```

#### **Stage 3: Metadata Validation**
```typescript
// Ensure public domain and proper attribution
const metadataCheck = parseImageMetadata(imageInfo);
if (metadataCheck.license !== 'public domain') reject();
if (!metadataCheck.author) reject();
```

### **Batch Processing**
- Process 5 images concurrently to avoid rate limits
- 10-second timeout per image
- Retry failed requests once
- Log all validation results

---

## **💾 Database Integration**

### **Enhanced Figures Table Schema**
```sql
-- Current images field (JSONB)
[{
  "url": "string",
  "license": "string",
  "credit": "string",
  "source_url": "string",
  "priority": number,     -- 1=primary, 2=fallback, 3=tertiary
  "status": "active"|"fallback"|"broken",
  "resolution": "600x800",
  "quality_score": 85,
  "added_at": "2025-11-14T...",
  "validated_at": "2025-11-14T..."
}]
```

### **Database Operations**

#### **Adding New Figure Images**
```sql
INSERT INTO figures (name, aliases, images, ...) VALUES (
  $name,
  $aliases,
  jsonb_build_array(
    jsonb_build_object(
      'url', $discovered_url,
      'priority', 1,
      'status', 'active',
      'license', $license,
      'credit', $credit,
      'resolution', $resolution,
      'quality_score', $score,
      'added_at', NOW(),
      'validated_at', NOW()
    )
  ),
  ...
);
```

#### **Adding Fallback Images**
```sql
UPDATE figures
SET images = images || jsonb_build_array($new_fallback_image)
WHERE id = $figure_id;
```

#### **Marking Broken Images**
```sql
UPDATE figures
SET images = jsonb_set(
  images,
  '{status}',
  '"broken"'
)
WHERE jsonb_array_elements(images)->>'url' = $broken_url;
```

---

## **🔄 Maintenance & Fallbacks**

### **Automatic Fallback System**
- Game automatically uses highest priority active image
- If primary fails, falls back to priority 2, then 3
- No user-visible interruption

### **Regular Validation Schedule**
- **Daily**: Check 10% of active images
- **Weekly**: Full validation of all images
- **Monthly**: Quality reassessment of low-scoring images

### **Broken Image Recovery**
1. Detect broken image during validation
2. Search for alternatives automatically
3. Add as fallback if good match found
4. Flag for manual review if no good alternatives
5. Accept lower quality temporarily if needed

---

## **👥 Quality Assurance Workflow**

### **Automated QA**
- **Resolution checks**: Minimum 400px enforced
- **License verification**: Public domain only
- **Content filtering**: Avoid non-portrait images
- **Technical validation**: Image loads and displays

### **Manual QA**
- **Sample review**: 5-10% of new figures
- **Issue flagging**: Low-quality images marked for replacement
- **Standard updates**: Adjust quality thresholds based on feedback

### **QA Metrics**
- **Success rate**: % of images meeting standards
- **Manual intervention rate**: % requiring human review
- **User satisfaction**: Game performance and image quality

---

## **📊 Scaling Considerations**

### **Performance Optimization**
- **Caching**: Store validation results to avoid re-checking
- **Batch processing**: Process images in groups of 5-10
- **Rate limiting**: Respect Wikimedia API limits
- **CDN**: Use image optimization services

### **Error Handling**
- **Network failures**: Retry with exponential backoff
- **API limits**: Implement request throttling
- **Invalid data**: Graceful degradation and logging

### **Monitoring & Analytics**
- **Success metrics**: Images found vs. attempted
- **Quality metrics**: Average resolution, license compliance
- **Performance metrics**: Search time, validation time
- **Error tracking**: Failed searches, broken images

---

## **🛠️ Implementation Scripts**

### **Available Scripts**
```bash
# Validate existing images
npm run validate-images

# Find images for new figures
npm run find-images "Figure Name" "Another Figure"

# Batch process from file
npm run find-images --batch figures.json

# Apply database updates (dry run first)
npm run validate-images:apply
```

### **Script Architecture**
```
scripts/
├── validate-figures-images.ts    # Existing validation
├── find-figure-images.ts         # NEW: Image discovery
├── batch-image-processor.ts      # NEW: Bulk processing
└── image-quality-assurance.ts    # NEW: QA utilities
```

---

## **📈 Success Metrics & KPIs**

### **Quality Metrics**
- **Image success rate**: 95%+ of figures have working images
- **Resolution compliance**: 90%+ meet 400px minimum
- **License compliance**: 100% public domain
- **Manual review rate**: <20% require human intervention

### **Performance Metrics**
- **Search speed**: <30 seconds per figure
- **Validation speed**: <10 seconds per image
- **Batch processing**: 50 figures/hour
- **Uptime**: 99% of images load successfully

### **Scalability Targets**
- **1000 figures**: 2-3 weeks total
- **100 figures/day**: Automated processing
- **Zero manual image research**: For new figure addition

---

## **🚨 Risk Mitigation**

### **Technical Risks**
- **API dependency**: Wikimedia downtime → fallback sources
- **Rate limits**: Implement queuing and retry logic
- **Data quality**: Multi-stage validation + manual oversight

### **Quality Risks**
- **Inaccurate images**: Content validation + human review
- **Poor quality images**: Resolution filtering + scoring
- **License issues**: Automated license checking

### **Operational Risks**
- **Large batches failing**: Incremental processing + rollback
- **Database corruption**: Transaction safety + backups
- **Performance impact**: Staged rollouts + monitoring

---

## **🔮 Future Enhancements**

### **Phase 2: Multi-Source Integration**
- Add Europeana, Smithsonian, museum APIs
- Implement federated search across sources
- Quality comparison between sources

### **Phase 3: AI-Assisted Curation**
- ML-based image quality assessment
- Facial recognition for person verification
- Automated content analysis

### **Phase 4: Advanced Fallbacks**
- Dynamic image optimization
- Multiple resolution variants
- Progressive loading strategies

---

## **👨‍💻 Developer Quick Start**

### **For New Team Members**
1. **Read this document** completely
2. **Run existing validation**: `npm run validate-images`
3. **Test image discovery**: `npm run find-images "Test Figure"`
4. **Review quality standards** before making changes

### **Code Organization**
- **Validation logic**: `src/lib/utils/imageValidator.ts`
- **Discovery logic**: `scripts/find-figure-images.ts`
- **Database operations**: `src/lib/supabase/queries.ts`
- **Quality standards**: This document (source of truth)

### **Testing Protocol**
- Always test with small batches first
- Validate images load in actual game
- Check mobile responsiveness
- Monitor loading performance

---

**This system enables HistoGuesser to scale from 31 to 1000+ figures while maintaining image quality and reliability through automated discovery, rigorous validation, and human oversight.**

**Last Updated:** November 14, 2025
**Next Review:** December 2025
