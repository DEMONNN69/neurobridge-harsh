# Theory of Mind Assessment Integration Guide

## Overview
The Theory of Mind (ToM) assessment has been implemented as a comprehensive, accessible comic-style assessment that evaluates perspective-taking abilities using the classic Sally-Anne false belief task.

## Files Created

### Core Components
- `src/components/ToM/TheoryOfMindAssessment.tsx` - Main assessment component
- `src/components/ToM/TheoryOfMindAssessment.css` - Animation keyframes and styles
- `src/components/ToM/TheoryOfMindIntegration.tsx` - Integration wrapper for existing assessment flow
- `src/pages/TheoryOfMindPage.tsx` - Standalone page for direct access

### Assets
- `public/elements/` - Directory for character and prop images
- `public/elements/README.md` - Image specifications and guidelines

## Key Features

### ✅ Accessibility-First Design
- **Text-to-Speech**: Automatic narration with speed/pitch adjustments based on pre-assessment data
- **Visual Fallbacks**: Colored placeholder elements if images don't load
- **Reduced Motion**: Respects `prefers-reduced-motion` settings
- **Large Interactive Elements**: Easy-to-click buttons for all ages

### ✅ Assessment Integration
- **API Compatibility**: Uses existing `submitAssessment` endpoint
- **Pre-Assessment Personalization**: Adjusts experience based on age, reading difficulty, etc.
- **Consistent Scoring**: Follows same accuracy/timing patterns as other assessments

### ✅ Animation System
- **Pure CSS Keyframes**: No external animation libraries
- **Smooth Transitions**: Character movement, ball hiding/moving, entrances/exits
- **Timed Sequences**: Auto-advancing scenes with manual control options

## Usage Examples

### Standalone Access
```typescript
// Direct route access
<Route path="/theory-of-mind-assessment" element={<TheoryOfMindPage />} />
```

### Embedded in Assessment Flow
```typescript
import TheoryOfMindIntegration from '../components/ToM/TheoryOfMindIntegration';

// In autism or combined assessment
<TheoryOfMindIntegration 
  assessmentType="autism"
  preAssessmentData={userPreAssessmentData}
  onComplete={handleToMResults}
/>
```

### Custom Implementation
```typescript
import TheoryOfMindAssessment from '../components/ToM/TheoryOfMindAssessment';

<TheoryOfMindAssessment 
  onComplete={(results) => {
    // Handle results
    console.log('ToM Assessment completed:', results);
  }}
  preAssessmentData={personalData}
  standalone={false}
/>
```

## Results Structure

The assessment returns comprehensive results:

```typescript
interface ToMResults {
  scenarioId: string;           // "sally-anne-false-belief"
  responses: Array<{
    questionId: string;         // "false-belief-location"  
    selectedAnswer: string;     // "blue-box" or "red-box"
    isCorrect: boolean;         // true for correct theory of mind response
    responseTime: number;       // milliseconds
  }>;
  totalTime: number;           // Total assessment duration
  accuracy: number;            // Percentage accuracy (0-100)
}
```

## Assessment Theory

### False Belief Understanding
The Sally-Anne task tests whether a child can understand that someone else can have a false belief about the world. Key indicators:

- **Correct Response**: Sally will look in the blue box (where she originally put the ball)
- **Theory of Mind Development**: Understanding that Sally doesn't know Anne moved the ball
- **Social Cognition**: Recognizing different knowledge states between people

### Age Appropriateness
- **Target Age**: 6-12 years old
- **Developmental Context**: Theory of Mind typically develops around age 4-5
- **Assessment Value**: Useful for autism evaluation and social cognition assessment

## Backend Integration

The assessment automatically integrates with your existing backend:

```python
# Existing endpoint handles ToM data
POST /api/quiz/submit/
{
  "assessment_type": "theory_of_mind",
  "answers": [...],
  "tom_data": {
    "scenario_id": "sally-anne-false-belief",
    "accuracy": 100,
    "response_times": [2500]
  }
}
```

## Customization Options

### Scene Timing
```typescript
// Modify scene durations in SALLY_ANNE_SCENES
{
  id: 'sally-hides-ball',
  duration: 4000,  // Adjust timing
  autoAdvance: true // Or false for manual control
}
```

### Audio Personalization
```typescript
// Speech rate adjusts based on user data
utterance.rate = preAssessmentData?.has_reading_difficulty ? 0.7 : 0.8;
utterance.pitch = preAssessmentData?.age && preAssessmentData.age < 10 ? 1.2 : 1.1;
```

### Visual Elements
```typescript
// Easy to modify character positions and animations
elements: {
  sally: { x: 100, y: 200, visible: true, animation: 'moveToBox' },
  // Coordinates are responsive to container size
}
```

## Future Enhancements

### Multiple Scenarios
The code is structured to support additional Theory of Mind scenarios:

```typescript
// Add new scenarios to the scenes array
const SECOND_ORDER_BELIEF_SCENES: SceneConfig[] = [
  // More complex false belief tasks
];
```

### Progressive Difficulty
```typescript
// Implement age-based scenario selection
const getAppropriatScenario = (age: number) => {
  if (age < 8) return SALLY_ANNE_SCENES;
  return ADVANCED_TOM_SCENES;
};
```

### Detailed Analytics
```typescript
// Enhanced tracking capabilities
{
  gazeDwellTime: number;      // Where users look most
  replayCount: number;        // How often they replay scenes
  confidenceRating: number;   // User's confidence in answer
}
```

## Testing Recommendations

1. **Age Range Testing**: Test with actual 6-12 year olds for timing validation
2. **Accessibility Testing**: Verify with screen readers and motor accessibility tools
3. **Cross-Browser**: Ensure Web Speech API works across browsers
4. **Mobile Testing**: Validate touch interactions and responsive design
5. **Internet Connectivity**: Test offline behavior and image loading failures

## Support & Maintenance

- **Image Assets**: Replace placeholder fallbacks with actual character illustrations
- **Localization**: Add support for multiple languages in narration
- **Performance**: Monitor animation performance on lower-end devices
- **Analytics**: Track completion rates and response patterns for optimization
