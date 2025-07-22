# Personal Tutor AI - Style Guide

## Design Philosophy

Our design system emphasizes **clarity, accessibility, and modern minimalism**. We prioritize clean typography, ample white space, and intuitive user interactions over flashy visual effects. Our color palette is inspired by the clean, professional aesthetics of Stripe, Notion, Apple, and Airbnb.

## Color Palette

### Primary Colors
- **Primary Blue**: `#0066FF` (Stripe-inspired vibrant blue)
- **Primary Blue Dark**: `#0052CC` (Darker variant for hover states)
- **Primary Blue Light**: `#4D94FF` (Lighter variant for backgrounds)

### Secondary Colors
- **Secondary Gray**: `#6B7280` (Notion-inspired neutral gray)
- **Secondary Gray Dark**: `#4B5563` (Darker variant)
- **Secondary Gray Light**: `#9CA3AF` (Lighter variant)

### Neutral Colors
- **White**: `#FFFFFF`
- **Gray 50**: `#F9FAFB` (Very light background)
- **Gray 100**: `#F3F4F6` (Light background)
- **Gray 200**: `#E5E7EB` (Border color)
- **Gray 300**: `#D1D5DB` (Light border)
- **Gray 400**: `#9CA3AF` (Medium gray)
- **Gray 500**: `#6B7280` (Text gray)
- **Gray 600**: `#4B5563` (Dark text)
- **Gray 700**: `#374151` (Very dark text)
- **Gray 800**: `#1F2937` (Heading color)
- **Gray 900**: `#111827` (Darkest text)

### Semantic Colors
- **Success**: `#10B981` (Emerald green - Apple-inspired)
- **Warning**: `#F59E0B` (Amber - Airbnb-inspired)
- **Error**: `#EF4444` (Red - Stripe-inspired)
- **Info**: `#0066FF` (Primary blue)

## Typography

### Font Family
- **Primary**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Monospace**: `'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace`

### Font Sizes
- **xs**: `0.75rem` (12px)
- **sm**: `0.875rem` (14px)
- **base**: `1rem` (16px)
- **lg**: `1.125rem` (18px)
- **xl**: `1.25rem` (20px)
- **2xl**: `1.5rem` (24px)
- **3xl**: `1.875rem` (30px)
- **4xl**: `2.25rem` (36px)
- **5xl**: `3rem` (48px)
- **6xl**: `3.75rem` (60px)

### Font Weights
- **Light**: `300`
- **Normal**: `400`
- **Medium**: `500`
- **Semibold**: `600`
- **Bold**: `700`
- **Extrabold**: `800`

### Line Heights
- **Tight**: `1.25`
- **Normal**: `1.5`
- **Relaxed**: `1.625`
- **Loose**: `2`

## Spacing System

### Base Unit: 4px (0.25rem)

### Spacing Scale
- **0**: `0`
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **5**: `1.25rem` (20px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)
- **24**: `6rem` (96px)

## Border Radius

- **sm**: `0.125rem` (2px)
- **base**: `0.25rem` (4px)
- **md**: `0.375rem` (6px)
- **lg**: `0.5rem` (8px)
- **xl**: `0.75rem` (12px)
- **2xl**: `1rem` (16px)
- **3xl**: `1.5rem` (24px)
- **full**: `9999px`

## Shadows

### Elevation Levels
- **sm**: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- **base**: `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)`
- **md**: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`
- **lg**: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)`
- **xl**: `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)`
- **2xl**: `0 25px 50px -12px rgba(0, 0, 0, 0.25)`

## Component Guidelines

### Buttons


## Accessibility Guidelines

### Color Contrast
- Ensure all text has a minimum contrast ratio of 4.5:1
- Use semantic colors for status indicators
- Provide alternative text for icons and images

### Focus States
- All interactive elements must have visible focus states
- Use consistent focus indicators across the application
- Ensure keyboard navigation works for all interactive elements

### Typography
- Use relative units (rem) for font sizes
- Maintain a minimum font size of 16px for body text
- Use sufficient line height for readability

## Animation Guidelines

### Transitions
- Use `transition: all 0.2s ease` for most interactive elements
- Keep animations subtle and purposeful
- Respect user's motion preferences with `prefers-reduced-motion`

### Hover Effects
- Use subtle transforms (translateY, scale) for hover effects
- Enhance shadows on hover for depth
- Change colors smoothly with transitions

## Responsive Design

### Breakpoints
- **sm**: `640px`
- **md**: `768px`
- **lg**: `1024px`
- **xl**: `1280px`
- **2xl**: `1536px`

### Mobile-First Approach
- Design for mobile devices first
- Use progressive enhancement for larger screens
- Ensure touch targets are at least 44px × 44px

## Icon Guidelines

### Icon Sizes
- **sm**: `16px`
- **md**: `20px`
- **lg**: `24px`
- **xl**: `32px`
- **2xl**: `48px`

### Icon Colors
- Use semantic colors when possible
- Maintain consistent color usage across the application
- Ensure icons have sufficient contrast with backgrounds

## Implementation Notes

### CSS Custom Properties
Use CSS custom properties for consistent theming:

```css
:root {
  --color-primary: #0066FF;
  --color-primary-dark: #0052CC;
  --color-primary-light: #4D94FF;
  --color-secondary: #6B7280;
  --color-secondary-dark: #4B5563;
  --color-secondary-light: #9CA3AF;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-200: #E5E7EB;
  --color-gray-300: #D1D5DB;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-600: #4B5563;
  --color-gray-700: #374151;
  --color-gray-800: #1F2937;
  --color-gray-900: #111827;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #0066FF;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

### Utility Classes
Maintain a comprehensive set of utility classes for common styling needs, following the spacing and color systems defined above.

### Component Consistency
Ensure all components follow the same design patterns and use consistent spacing, typography, and color usage throughout the application. 