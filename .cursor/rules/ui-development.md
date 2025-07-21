# UI/UX Development Rules

## Style Guide Compliance

**CRITICAL**: Always reference `style.md` for all UI design decisions. This is the single source of truth for:
- Color palette and semantic colors
- Typography scale and font families  
- Spacing system (4px base unit)
- Component patterns (buttons, cards, forms, navigation)
- Shadow and border radius scales
- Accessibility guidelines
- Responsive design breakpoints

## SvelteKit-Specific Guidelines

### Component Structure
- Use TypeScript for all Svelte components
- Follow SvelteKit file-based routing conventions
- Place reusable components in `src/lib/components/`
- Use `$lib` alias for imports from the lib directory
- Implement proper TypeScript interfaces for props

### Styling Approach
- Use the utility classes defined in `src/app.css`
- Follow the CSS custom properties from `style.md`
- Implement responsive design using the defined breakpoints
- Use CSS Grid and Flexbox for layouts
- Maintain consistent spacing using the 4px base unit

### State Management
- Use Svelte's reactive statements appropriately
- Implement proper loading states for async operations
- Handle form validation with clear error states
- Use semantic colors for status indicators

## Development Workflow

1. **Before starting**: Read relevant sections in `style.md`
2. **During development**: Constantly reference `style.md` for consistency
3. **Before committing**: Verify compliance with design system
4. **Documentation**: Update `style.md` if new patterns are established

## Key Principles

- **Single source of truth**: `style.md` contains all design decisions
- **No duplication**: Don't repeat design system content in code comments
- **Consistency**: All components must follow established patterns
- **Accessibility first**: All UI must meet WCAG guidelines
- **Mobile-first**: Design for mobile, enhance for desktop

## When Working On

- CSS files and styling (`src/app.css`)
- Svelte components (`src/routes/`, `src/lib/`)
- Layout and navigation
- Form elements and validation
- Interactive components
- Responsive design
- Accessibility features

## Important Notes

- Any deviations from `style.md` must be documented and justified
- New components should extend the design system, not replace it
- Accessibility is not optional - it's a core requirement
- Test across different screen sizes and devices
- Use TypeScript for type safety in all components 