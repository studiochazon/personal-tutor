# NewCourseCard Component

A reusable Svelte component for creating new courses with a clean, modern interface that follows the design system.

## Features

- **Clean Design**: Follows the established design system with consistent spacing, colors, and typography
- **Responsive**: Mobile-first responsive design with proper breakpoints
- **Accessible**: Proper focus states, keyboard navigation, and semantic HTML
- **Customizable**: Configurable title, subtitle, placeholder text, and button labels
- **Form Validation**: Built-in validation and error handling
- **Loading States**: Visual feedback during course creation
- **Dropdown Options**: Optional audience and depth selection dropdowns

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | `"Start a New Course"` | The main heading for the card |
| `subtitle` | `string` | `"Describe what you want to teach..."` | Subtitle text below the title |
| `placeholder` | `string` | `"Teach X to Y in Z hours…"` | Placeholder text for the textarea |
| `buttonText` | `string` | `"Create Course"` | Text for the submit button |
| `loadingText` | `string` | `"Creating..."` | Text shown during loading state |
| `showAudienceDropdown` | `boolean` | `true` | Whether to show the audience dropdown |
| `showDepthDropdown` | `boolean` | `true` | Whether to show the depth dropdown |
| `audienceOptions` | `Array<{value: string, label: string}>` | `[...]` | Options for the audience dropdown |
| `depthOptions` | `Array<{value: string, label: string}>` | `[...]` | Options for the depth dropdown |
| `selectedAudience` | `string` | `"beginners"` | Currently selected audience |
| `selectedDepth` | `string` | `"comprehensive"` | Currently selected depth |
| `isLoading` | `boolean` | `false` | Whether the form is in loading state |
| `errorMessage` | `string` | `""` | Error message to display |
| `promptText` | `string` | `""` | The current prompt text |

## Events

| Event | Type | Description |
|-------|------|-------------|
| `onSubmit` | `(data: {prompt: string, audience?: string, depth?: string}) => void` | Called when the form is submitted |

## Usage Examples

### Basic Usage

```svelte
<script>
  import { NewCourseCard } from '$lib/components/ui';
  
  let promptText = '';
  let selectedAudience = 'beginners';
  let selectedDepth = 'comprehensive';
  let isLoading = false;
  
  function handleSubmit(data) {
    console.log('Form submitted:', data);
    // Handle course creation
  }
</script>

<NewCourseCard
  bind:promptText
  bind:selectedAudience
  bind:selectedDepth
  bind:isLoading
  onSubmit={handleSubmit}
/>
```

### Custom Configuration

```svelte
<NewCourseCard
  title="Create Your Learning Path"
  subtitle="Tell us what you want to learn and we'll create a personalized course"
  placeholder="I want to learn..."
  buttonText="Generate Course"
  loadingText="Generating..."
  showAudienceDropdown={false}
  showDepthDropdown={true}
  bind:promptText
  bind:selectedDepth
  bind:isLoading
  onSubmit={handleSubmit}
/>
```

### With Error Handling

```svelte
<NewCourseCard
  bind:promptText
  bind:selectedAudience
  bind:selectedDepth
  bind:isLoading
  errorMessage="Please provide a more detailed description"
  onSubmit={handleSubmit}
/>
```

## Design System Compliance

The component follows the established design system:

- **Colors**: Uses CSS custom properties for consistent theming
- **Spacing**: Follows the 4px base unit spacing scale
- **Typography**: Uses the defined font sizes and weights
- **Shadows**: Implements the shadow system for elevation
- **Border Radius**: Uses the established radius scale
- **Transitions**: Smooth animations with consistent timing

## Accessibility Features

- Proper focus states for all interactive elements
- Keyboard navigation support (Enter key to submit)
- Semantic HTML structure
- ARIA labels and descriptions
- High contrast ratios for text readability
- Screen reader friendly

## Responsive Behavior

- **Desktop**: Full-width layout with side-by-side dropdowns
- **Tablet**: Stacked dropdowns, maintained padding
- **Mobile**: Full-width button, reduced padding, optimized touch targets

## Integration with Existing Code

The component is designed to work seamlessly with the existing course creation flow:

1. **Home Page**: Replaces the inline course creation form
2. **Start Page**: Can be used as an alternative to the current form
3. **Landing Page**: Complements the existing PromptSection component

## Migration from Inline Forms

To migrate from inline forms to this component:

1. Import the component: `import { NewCourseCard } from '$lib/components/ui'`
2. Replace the form HTML with the component
3. Update the event handlers to use the `onSubmit` callback
4. Bind the form state variables to the component props

This provides a consistent, maintainable, and reusable solution for course creation across the application. 