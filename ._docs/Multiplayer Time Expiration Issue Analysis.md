🎯 ISSUE ANALYSIS: Timer Expiration & Game Progression Problem
You're absolutely right - this is a critical UX flow issue. Let me break down what's happening and propose the best solution:
🐛 Current Problem Analysis
From the logs:
Timer expires → canSubmit: false (timeRemaining <= 0)
Player tries to submit → ❌ Validation failed - cannot submit
Player can still interact with map/timeline but can't submit
Game stuck because allPlayersSubmitted never becomes true
Result: Deadlock - no progression to reveal phase
Root Cause:
const canSubmit = computed(() => {  return !hasSubmitted.value &&         !isSubmitting.value &&         // ... other conditions ...         !timeExpired.value  // ❌ This blocks auto-submit on timeout!})
🎯 Required Behavior
Auto-Submit on Timeout: When timer hits 0, auto-submit with current guesses (even if incomplete)
Waiting State UI: Clear feedback about submission status
Round Progression: Proceed to reveal when ALL players are done (submitted OR timed out)
💡 Proposed Solution Architecture
Option 1: Enhanced Auto-Submit (Recommended)
// In timer onExpire callback:onExpire: () => {  if (!hasSubmitted.value) {    console.log('⏰ Timer expired - auto-submitting current guesses')    autoSubmitOnTimeout() // Special submission that bypasses normal validation  }}
Option 2: Submission Status UI (Clean UX)
<!-- Status indicator --><div v-if="hasSubmitted" class="submission-status">  <span v-if="submittedOnTime" class="text-green-500">✓ Submitted!</span>  <span v-else class="text-orange-500">⏰ Auto-submitted (time expired)</span></div><div v-else-if="timeRemaining <= 0" class="submission-status text-red-500">  ⌛ Time expired - Auto-submitting...</div><div v-else class="submission-status text-blue-500">  Waiting for other players...</div>
Option 3: Round Progression Logic
const allPlayersDone = computed(() => {  return roundSubmissions.value.length >= props.players.length  // OR all players have either submitted OR timed out})
🔧 Technical Implementation Plan
Create autoSubmitOnTimeout() function that bypasses normal canSubmit validation
Add submission status tracking (submittedOnTime, timedOut)
Enhance UI feedback with status indicators
Modify round progression to trigger on "all players done" not just "all submitted"
💭 UI/UX Considerations
Your popup idea is excellent! Here's how I'd implement it:
<!-- Status Modal/Popup --><Transition name="fade">  <div v-if="showSubmissionStatus" class="status-modal">    <div class="modal-content">      <div v-if="hasSubmitted && submittedOnTime" class="success">        ✅ **Guess Submitted!** Waiting for other players...      </div>      <div v-else-if="hasSubmitted && !submittedOnTime" class="warning">        ⏰ **Time Expired** - Auto-submitted with current guesses. Waiting for others...      </div>      <div v-else-if="timeRemaining <= 0" class="error">        ⌛ **Time's Up!** Submitting automatically...      </div>      <div v-else class="info">        🎯 **Ready to submit?** You have {{ timeRemaining }}s remaining      </div>    </div>  </div></Transition>
🎯 Best Approach Recommendation
Go with Option 1 + Status UI because:
Solves the core problem: Auto-submit prevents deadlocks
Great UX: Clear feedback prevents confusion
Scalable: Works for 2-8 players seamlessly
Robust: Handles network delays and edge cases
Alternative: Countdown Timer UI (simpler)
Instead of modal, show a persistent status bar:
[Player 1: ✅ Submitted] [Player 2: ⏰ 5s] [Player 3: ⌛ Timed Out]
Which approach would you prefer? The modal gives more prominence, the status bar is more subtle but always visible.
Your analysis is spot-on - the timer expiration deadlock is a critical UX blocker that needs fixing! 🚀
Ready to implement when you give the go-ahead.
------
6:58:57 PM [vite] (client) Pre-transform error: v-else/v-else-if has no adjacent v-if or v-else-if.
  Plugin: vite:vue
  File: C:/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser/src/components/lobby/LobbyGameplay.vue:442:7
  440 |  
  441 |        <!-- Reveal Phase -->
  442 |        <RevealPhase
      |         ^
  443 |          v-else-if="showReveal && revealedFigure"
  444 |          :figure="revealedFigure"
6:58:57 PM [vite] Internal server error: v-else/v-else-if has no adjacent v-if or v-else-if.
  Plugin: vite:vue
  File: C:/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser/src/components/lobby/LobbyGameplay.vue:442:7
  440 |  
  441 |        <!-- Reveal Phase -->
  442 |        <RevealPhase
      |         ^
  443 |          v-else-if="showReveal && revealedFigure"
  444 |          :figure="revealedFigure"
      at createCompilerError (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1364:17)      at processIf (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:4760:11)
      at C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:4660:12
      at Array.<anonymous> (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3641:26)  
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3583:38)       
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5)    
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3618:7)        
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5)    
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3618:7)        
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5)    
6:58:57 PM [vite] Internal server error: v-else/v-else-if has no adjacent v-if or v-else-if.
  Plugin: vite:vue
  File: C:/Users/Daniel Lopez/Desktop/Neet-a-thon/Histo-Guesser/src/components/lobby/LobbyGameplay.vue:442:7
  440 |  
  441 |        <!-- Reveal Phase -->
  442 |        <RevealPhase
      |         ^
  443 |          v-else-if="showReveal && revealedFigure"
  444 |          :figure="revealedFigure"
      at createCompilerError (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:1364:17)      at processIf (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:4760:11)
      at C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:4660:12
      at Array.<anonymous> (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3641:26)  
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3583:38)       
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5)    
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3618:7)        
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5)    
      at traverseNode (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3618:7)        
      at traverseChildren (C:\Users\Daniel Lopez\Desktop\Neet-a-thon\Histo-Guesser\node_modules\@vue\compiler-core\dist\compiler-core.cjs.js:3575:5) (x2)