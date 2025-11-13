# **Figures Expansion & Game Mode Filtering - Development Battle Plan**

**Date:** November 13, 2025  
**Objective:** Expand historical figures database to 1000+ entries with reliable image fallbacks, and add category-based game mode filtering for Free Play and Multiplayer modes.

---

## **🎯 Executive Summary**

This battle plan addresses two critical improvements to HistoGuesser:

1. **Image Reliability Crisis**: Current figures have broken image links ("servers under maintenance"). We need a robust fallback system before scaling to 1000+ figures.

2. **Game Variety Enhancement**: Users want to focus on specific historical categories (political figures, scientists, religious leaders, etc.) rather than random selection.

**Key Design Decisions:**
- **UI Placement**: Category selection via modal popup AFTER clicking "Free Play" or "Create New Game" (not in main menu to avoid confusion with Daily Challenge)
- **Multiplayer Display**: Selected category shown prominently in lobby screen
- **Daily Challenge**: Always remains random across ALL figures for fairness
- **Default Behavior**: "All Figures" selected by default

---

## **📋 Phase 1: Image Fallback System**

**Goal:** Build robust image fallback infrastructure and fix existing broken images before scaling database.

### **1.1 Enhance Database Schema**
- [ ] Modify `figures` table `images` JSONB structure to support multiple sources
- [ ] Add `priority` field (1=primary, 2=secondary, 3=tertiary)
- [ ] Add `status` field (`active`, `fallback`, `broken`) for tracking
- [ ] Create migration file: `007_enhance_image_fallback_support.sql`

### **1.2 Frontend Image Loading Logic**
- [ ] Enhance `FigureCarousel.vue` with automatic fallback logic
- [ ] Implement priority-based image loading (try priority 1, then 2, then 3)
- [ ] Add loading states and error handling for failed images
- [ ] Cache successful image URLs to prevent repeated failures
- [ ] Add smooth transitions between fallback images

### **1.3 Image Validation Pipeline**
- [ ] Create `src/lib/utils/imageValidator.ts` for batch image testing
- [ ] Build automated script to test all existing figure images
- [ ] Identify and fix broken images for current 30 figures
- [ ] Update database with validated image statuses

### **1.4 Testing & Validation**
- [ ] Test fallback system with manually broken image URLs
- [ ] Verify smooth user experience during image transitions
- [ ] Performance test with slow-loading images
- [ ] Cross-browser compatibility testing

**Success Criteria:** All 30 existing figures display working images with fallback support.  
**Estimated Time:** 2-3 days  
**Risk Level:** Low (building on existing components)  
**Dependencies:** None

---

## **📋 Phase 2: Data Collection Pipeline**

**Goal:** Create systematic process for researching, validating, and preparing 1000+ historical figures with reliable images.

### **2.1 Research Framework Setup**
- [ ] Define comprehensive category taxonomy (political, military, scientist, religious, cultural, business, social, exploration)
- [ ] Create data collection templates with required fields
- [ ] Establish quality standards (2-3 verified images per figure, accurate lat/lon, complete metadata)
- [ ] Set up Google Sheets or Airtable for collaborative data collection

### **2.2 Image Sourcing Strategy**
- [ ] Identify reliable public domain image sources (Wikimedia Commons, public archives)
- [ ] Create backup sourcing strategy for each category
- [ ] Develop automated image URL validation scripts
- [ ] Build process for finding 2-3 alternative images per figure

### **2.3 Metadata Standardization**
- [ ] Create category tag mapping system
- [ ] Standardize name formats and aliases
- [ ] Validate geographic coordinates accuracy
- [ ] Ensure consistent date formatting (BCE/CE handling)
- [ ] Develop description writing guidelines (humorous/fun facts)

### **2.4 Quality Assurance Pipeline**
- [ ] Create validation scripts for all required fields
- [ ] Build automated duplicate detection
- [ ] Establish fact-checking procedures
- [ ] Create batch testing for image reliability

**Success Criteria:** Functional pipeline that can process 50 figures/week with 95%+ data accuracy.  
**Estimated Time:** 1-2 weeks  
**Risk Level:** Medium (research-intensive)  
**Dependencies:** Phase 1 image validation system

---

## **📋 Phase 3: Batch Figure Addition**

**Goal:** Systematically add validated figures to database in manageable batches with full image fallback support.

### **3.1 Batch Processing Framework**
- [ ] Create `src/lib/utils/figureImporter.ts` for bulk imports
- [ ] Build database insertion scripts with error handling
- [ ] Implement rollback capabilities for failed batches
- [ ] Add progress tracking and logging

### **3.2 Initial Batch (50 figures)**
- [ ] Select diverse figures across all categories
- [ ] Manually verify all image sources work
- [ ] Test database insertion and frontend display
- [ ] Validate scoring calculations work correctly

### **3.3 Scaled Batch Processing (950 figures)**
- [ ] Process figures in batches of 50-100
- [ ] Automated validation of image fallbacks
- [ ] Database performance monitoring during bulk inserts
- [ ] Regular frontend testing of new figures

### **3.4 Database Optimization**
- [ ] Monitor query performance with increased data volume
- [ ] Optimize indexes for category filtering
- [ ] Update seeding scripts for production deployment
- [ ] Performance testing with 1000+ figures

**Success Criteria:** 1000+ figures in database with working images and complete metadata.  
**Estimated Time:** 3-4 weeks  
**Risk Level:** Medium (scaling challenges)  
**Dependencies:** Phase 1 fallback system, Phase 2 pipeline

---

## **📋 Phase 4: Category Filtering UI & Backend**

**Goal:** Implement category selection UI and backend filtering logic with intuitive user experience.

### **4.1 Backend Category Logic**
- [ ] Define category tag mappings in constants
- [ ] Update `startGame()` function in `gameStore.ts` to accept category parameter
- [ ] Modify figure selection queries to filter by category tags
- [ ] Add category validation and error handling

### **4.2 Frontend Modal Components**
- [ ] Create `CategorySelectModal.vue` component
- [ ] Design category selection UI with icons and descriptions
- [ ] Implement "All Figures" as default selection
- [ ] Add modal state management to gameStore

### **4.3 Free Play Integration**
- [ ] Modify `FreePlayView.vue` to show category modal on game start
- [ ] Connect modal selection to game initialization
- [ ] Add loading states during figure fetching
- [ ] Test category filtering with existing figures

### **4.4 Multiplayer Integration**
- [ ] Update `MultiplayerView.vue` to show category modal on "Create New Game"
- [ ] Display selected category prominently in `LobbyWaitingRoom.vue`
- [ ] Communicate category selection to all lobby players
- [ ] Update lobby creation flow to include category data

### **4.5 State Management Updates**
- [ ] Add category selection to gameStore state
- [ ] Update multiplayer lobby state to track game category
- [ ] Implement category persistence in local storage
- [ ] Add category validation in form submissions

**Success Criteria:** Users can select categories in Free Play and Multiplayer, with clear UI feedback. Daily Challenge remains unaffected.  
**Estimated Time:** 1-2 weeks  
**Risk Level:** Low (building on existing patterns)  
**Dependencies:** Phase 1-3 completion

---

## **📋 Phase 5: Testing, Optimization & Deployment**

**Goal:** Comprehensive testing of expanded figure database and category features across all game modes.

### **5.1 Functional Testing**
- [ ] Test all category filters with 1000+ figures
- [ ] Verify image fallback system works across all figures
- [ ] Test multiplayer category synchronization
- [ ] Validate Daily Challenge remains unaffected by categories

### **5.2 Performance Testing**
- [ ] Database query performance with category filtering
- [ ] Image loading performance with fallbacks
- [ ] Multiplayer lobby performance with category display
- [ ] Mobile responsiveness across all new features

### **5.3 User Experience Testing**
- [ ] Usability testing of category selection modals
- [ ] A/B testing of category distribution balance
- [ ] User feedback on figure variety and image reliability
- [ ] Accessibility testing for new UI components

### **5.4 Production Deployment**
- [ ] Update production database with new figures
- [ ] Deploy enhanced image fallback system
- [ ] Monitor performance and error rates post-deployment
- [ ] Create rollback plan for any issues

### **5.5 Documentation Updates**
- [ ] Update README.md with new features
- [ ] Update comprehensive development progress report
- [ ] Create user-facing documentation for category selection
- [ ] Update technical documentation for new database schema

**Success Criteria:** All features working reliably with 1000+ figures, positive user feedback, no performance regressions.  
**Estimated Time:** 1 week  
**Risk Level:** Low (testing phase)  
**Dependencies:** Phase 1-4 completion

---

## **📊 Project Metrics & Success Criteria**

### **Overall Success Metrics**
- **Image Reliability**: 99%+ of figures display working images
- **Database Scale**: 1000+ figures with complete metadata
- **Category Coverage**: Balanced representation across 8+ categories
- **Performance**: No degradation with increased database size
- **User Experience**: Intuitive category selection without confusion

### **Phase Completion Checklist**
- [ ] **Phase 1**: Image fallback system working on all 30 existing figures
- [ ] **Phase 2**: Data collection pipeline processing 50+ figures/week
- [ ] **Phase 3**: Database contains 1000+ validated figures
- [ ] **Phase 4**: Category selection working in Free Play and Multiplayer
- [ ] **Phase 5**: All features tested and deployed to production

### **Risk Mitigation Strategies**
- **Gradual Rollout**: Add figures in batches to catch issues early
- **Fallback Safety**: Category filtering failures default to "All Figures"
- **Image Reliability**: Never deploy figures without verified fallback images
- **Performance Monitoring**: Automated alerts for performance regressions

---

## **🔄 Phase-by-Phase Dependencies**

```
Phase 1 (Image Fallback) → Phase 2 (Data Pipeline)
                              ↓
Phase 3 (Batch Addition) → Phase 4 (Category UI)
                              ↓
                    Phase 5 (Testing & Deployment)
```

**Parallel Work Opportunities:**
- Phase 2 data collection can begin while Phase 1 image system is being built
- Phase 4 UI work can start while Phase 3 batch processing is ongoing
- Phase 5 testing can include both image and category features

---

## **🛠️ Technical Implementation Notes**

### **Database Considerations**
- Current `figures` table schema supports all planned enhancements
- `tags: TEXT[]` field enables flexible category filtering
- JSONB `images` field supports enhanced fallback structure
- Existing RLS policies work with new features

### **Frontend Architecture**
- Modal pattern already established in project (Modal.vue component)
- State management patterns (Zustand) support category selection
- Component reusability (FigureCarousel) enables image fallback enhancement
- Existing multiplayer real-time system supports category communication

### **Development Best Practices**
- Comprehensive TypeScript typing for all new features
- ESLint compliance and code formatting
- Component testing and validation
- Database migration versioning
- Git branch strategy for feature development

---

## **⏰ Timeline & Resource Estimation**

**Total Project Duration:** 6-8 weeks  
**Total Effort:** ~200-300 developer hours

**Phase Breakdown:**
- **Phase 1**: 2-3 days (40-60 hours)
- **Phase 2**: 1-2 weeks (80-120 hours - research intensive)
- **Phase 3**: 3-4 weeks (120-160 hours - data processing)
- **Phase 4**: 1-2 weeks (40-80 hours - UI development)
- **Phase 5**: 1 week (40-60 hours - testing & deployment)

**Resource Requirements:**
- Primary developer for technical implementation
- Research assistant for historical figure data collection
- Quality assurance for figure validation and image testing
- Design feedback for UI/UX decisions

---

## **🎯 Next Steps**

**Immediate Action Items:**
1. Begin Phase 1: Enhance `FigureCarousel.vue` with fallback logic
2. Start Phase 2: Define category taxonomy and research framework
3. Create initial batch of 50 figures with verified fallback images

**Decision Points:**
- Confirm category taxonomy with sample figures
- Validate image sourcing strategy reliability
- Test UI placement in Free Play vs Multiplayer flows

**This battle plan provides a systematic approach to expanding HistoGuesser's historical figure database while solving the image reliability crisis and adding meaningful game variety through category filtering.**
