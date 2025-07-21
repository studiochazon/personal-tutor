# Personal Tutor AI - Style Guide

## Design Philosophy

Our design system emphasizes **clarity, accessibility, and modern minimalism**. We prioritize clean typography, ample white space, and intuitive user interactions over flashy visual effects.

## Color Palette

### Primary Colors
- **Primary Blue**: `#2563eb` (Blue 600)
- **Primary Blue Dark**: `#1d4ed8` (Blue 700)
- **Primary Blue Light**: `#3b82f6` (Blue 500)

### Secondary Colors
- **Secondary Teal**: `#0d9488` (Teal 600)
- **Secondary Teal Dark**: `#0f766e` (Teal 700)
- **Secondary Teal Light**: `#14b8a6` (Teal 500)

### Neutral Colors
- **White**: `#ffffff`
- **Gray 50**: `#f8fafc`
- **Gray 100**: `#f1f5f9`
- **Gray 200**: `#e2e8f0`
- **Gray 300**: `#cbd5e1`
- **Gray 400**: `#94a3b8`
- **Gray 500**: `#64748b`
- **Gray 600**: `#475569`
- **Gray 700**: `#334155`
- **Gray 800**: `#1e293b`
- **Gray 900**: `#0f172a`

### Semantic Colors
- **Success**: `#059669` (Emerald 600)
- **Warning**: `#d97706` (Amber 600)
- **Error**: `#dc2626` (Red 600)
- **Info**: `#2563eb` (Blue 600)

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

#### Primary Button
```css
.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: none;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
  background-color: white;
  color: #2563eb;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  border: 2px solid #2563eb;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #2563eb;
  color: white;
}
```

#### Ghost Button
```css
.btn-ghost {
  background-color: transparent;
  color: #64748b;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 500;
  border: none;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background-color: #f1f5f9;
  color: #334155;
}
```

### Cards

#### Default Card
```css
.card {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}
```

#### Elevated Card
```css
.card-elevated {
  background-color: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: none;
}
```

### Form Elements

#### Input Fields
```css
.input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s ease;
  background-color: white;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}
```

#### Textarea
```css
.textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  transition: all 0.2s ease;
}

.textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

### Navigation

#### Header
```css
.header {
  background-color: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 50;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
}
```

#### Navigation Links
```css
.nav-link {
  color: #64748b;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.nav-link:hover {
  color: #2563eb;
  background-color: #f8fafc;
}

.nav-link.active {
  color: #2563eb;
  background-color: #eff6ff;
}
```

## Layout Guidelines

### Container
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-sm {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-lg {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
}

.container-xl {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}
```

### Grid System
```css
.grid {
  display: grid;
  gap: 1.5rem;
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

@media (min-width: 768px) {
  .md\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .md\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
```

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
  --color-primary: #2563eb;
  --color-primary-dark: #1d4ed8;
  --color-primary-light: #3b82f6;
  --color-secondary: #0d9488;
  --color-secondary-dark: #0f766e;
  --color-secondary-light: #14b8a6;
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-200: #e2e8f0;
  --color-gray-300: #cbd5e1;
  --color-gray-400: #94a3b8;
  --color-gray-500: #64748b;
  --color-gray-600: #475569;
  --color-gray-700: #334155;
  --color-gray-800: #1e293b;
  --color-gray-900: #0f172a;
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