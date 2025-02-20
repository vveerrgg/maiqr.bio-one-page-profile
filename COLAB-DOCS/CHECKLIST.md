# maiqr.bio Template Development Checklist

## Critical Requirements

### Dependencies and Libraries
- [ ] ALWAYS use `nostr-crypto-utils` instead of `nostr-tools`
- [ ] Ensure all dependencies are properly versioned in package.json
- [ ] Keep dependencies minimal and modern

### Security
- [ ] No hardcoded API keys or sensitive information
- [ ] Implement proper error handling for crypto operations
- [ ] Use secure methods for handling user data

### Core Functionality
- [ ] Profile page generation from npub
- [ ] QR code generation for nostr keys
- [ ] Social links integration
- [ ] Mobile-responsive design

## Development Guidelines

### Code Style
- [ ] Use modern JavaScript/TypeScript features
- [ ] Follow consistent naming conventions
- [ ] Implement proper error handling
- [ ] Add comprehensive comments for complex operations

### Testing
- [ ] Test across different browsers
- [ ] Verify mobile responsiveness
- [ ] Test QR code functionality
- [ ] Validate nostr key handling

### Documentation
- [ ] Clear installation instructions
- [ ] Usage examples
- [ ] API documentation
- [ ] Deployment guide

## Features Checklist

### Profile Display
- [ ] Profile picture
- [ ] Name
- [ ] npub display
- [ ] About/Bio section
- [ ] Social links

### Nostr Integration
- [ ] npub validation using nostr-crypto-utils
- [ ] QR code generation
- [ ] Key conversion utilities
- [ ] Profile data fetching

### Customization
- [ ] Theme customization
- [ ] Layout options
- [ ] Font choices
- [ ] Color schemes

### Deployment
- [ ] GitHub Pages compatibility
- [ ] Custom domain support
- [ ] Build optimization
- [ ] Cache management

## Theme Management

### CSS Variables and Theme Structure
- Root-level CSS variables for consistent theming:
  ```css
  :root {  /* Light theme */
      --primary-color: #2d3436;
      --secondary-color: #0984e3;
      --background-color: #f5f6fa;
      --card-background: #ffffff;
      --text-color: #2d3436;
      --header-bg: #ffffff;
      --header-text: #2d3436;
      --border-color: rgba(0, 0, 0, 0.1);
  }

  [data-theme="dark"] {  /* Dark theme */
      --primary-color: #f5f6fa;
      --secondary-color: #74b9ff;
      --background-color: #1a1a1a;
      --card-background: #2d2d2d;
      --text-color: #ffffff;
      --header-bg: #2d2d2d;
      --header-text: #ffffff;
      --border-color: rgba(255, 255, 255, 0.1);
  }
  ```

### State Management
- Centralized theme management through AppState:
  ```javascript
  const AppState = {
      isInitialized: false,
      currentTheme: null,
      // ... other state
  }
  ```
- Single initialization point to prevent race conditions
- Proper async initialization flow
- System theme preference detection and sync

### Loading State
- Use HTML class to manage loading state:
  ```html
  <html lang="en" data-theme="light" class="loading">
  ```
- Hide content during initialization:
  ```css
  html.loading {
      visibility: hidden;
  }
  ```
- Remove loading state after initialization:
  ```javascript
  document.documentElement.classList.remove('loading');
  ```

### Theme Transitions
- Smooth transitions for theme changes:
  ```css
  body {
      transition: background-color 0.3s ease, color 0.3s ease;
  }
  ```
- Apply transitions to all themed elements
- Use proper CSS variable inheritance

### Best Practices
1. **Theme Application**
   - Apply theme variables at root level
   - Use CSS variables for all themed properties
   - Ensure consistent color usage across components

2. **State Management**
   - Single source of truth for theme state
   - Proper event handling for theme changes
   - System theme preference synchronization

3. **Performance**
   - Use CSS transitions for smooth theme changes
   - Prevent flash of unstyled content
   - Efficient theme switching without re-renders

4. **Accessibility**
   - Maintain proper contrast ratios in both themes
   - Use semantic color variables
   - Support system theme preferences

### Common Pitfalls and Solutions

1. **Theme Initialization**
   - ❌ Don't initialize theme in multiple places (e.g., both router and DOMContentLoaded)
   - ✅ Use a single source of truth (AppState) for theme initialization
   - ✅ Initialize theme before other components load

2. **CSS vs JavaScript Theme Control**
   - ❌ Don't override CSS variables with JavaScript unless absolutely necessary
   - ✅ Let CSS handle theme colors through CSS variables
   - ✅ Use JavaScript only for toggling the theme attribute

3. **Background Color Application**
   - ❌ Don't rely only on body background-color
   - ✅ Apply background-color to both html and body elements
   - ✅ Ensure proper color inheritance through the DOM tree

4. **Loading State Management**
   - ❌ Don't show unstyled content during initialization
   - ✅ Use a loading class on the html element
   - ✅ Remove loading class only after theme is fully initialized

### Debugging Theme Issues
1. Check for CSS variable overrides in JavaScript
2. Verify theme attribute is being set correctly
3. Ensure proper CSS variable inheritance
4. Test theme transitions with dev tools
5. Verify system theme preference detection

### Theme Testing Checklist
- [ ] Initial load matches system preference
- [ ] Theme toggle works in both directions
- [ ] No flash of unstyled content
- [ ] Smooth transitions on theme change
- [ ] Background color applies to full viewport
- [ ] No color inconsistencies between components
- [ ] System theme changes are detected
- [ ] Theme persists across page reloads

### Theme Components
- Header and navigation
- Forms and inputs
- Cards and containers
- Typography and links
- Borders and shadows
- Icons and buttons

### Future Improvements
- [ ] Add theme preview functionality
- [ ] Support custom theme creation
- [ ] Add theme transition animations
- [ ] Implement theme presets
- [ ] Add theme export/import

## Profile Page Features and Layout Best Practices

### Profile Page Features
- [ ] Default avatar placeholder
  - SVG format for scalability
  - Neutral colors compatible with themes
  - Gender-neutral design
- [ ] Profile information placeholders
  - Name
  - Website
  - Bio
  - Additional metadata (to be implemented)
- [ ] User Actions
  - Copy profile URL with visual feedback
  - Easy navigation back to home
  - Share functionality (to be implemented)

### Layout Best Practices
1. **Flexbox Layouts**
   - Use `space-between` for full-width distributed layouts
   - Apply `flex: 0 1 auto` for proper item sizing
   - Center align items vertically with `align-items: center`

2. **User Feedback**
   - Provide visual feedback for copy operations
   - Use animations sparingly and purposefully
   - Include hover states for interactive elements
   - Maintain consistent theme colors

3. **Mobile Considerations**
   - Ensure buttons are touch-friendly
   - Maintain readable text sizes
   - Use appropriate spacing for mobile screens

4. **Accessibility**
   - Include proper alt text for images
   - Ensure sufficient color contrast
   - Make interactive elements keyboard accessible
   - Add ARIA labels where needed

### Responsive Design Guidelines
1. **Breakpoints**
   - Mobile (base): < 640px
   - Tablet: >= 640px
   - Laptop: >= 1024px
   - Desktop: >= 1280px

2. **Mobile-First Approach**
   - Start with mobile styles as the base
   - Use min-width media queries to enhance for larger screens
   - Keep core functionality accessible on all devices

3. **Layout Adjustments**
   - Profile header: vertical on mobile, horizontal on tablet+
   - Profile actions: stacked on mobile, horizontal on tablet+
   - Container padding and margins adjust per breakpoint
   - Avatar size changes based on screen size

4. **Interactive Elements**
   - Larger touch targets on mobile
   - Full-width buttons on small screens
   - Hover effects only on devices that support hover
   - Maintain minimum tap target size (44px)

5. **Performance Considerations**
   - Optimize images for different screen sizes
   - Minimize layout shifts during loading
   - Use appropriate image formats (SVG for icons)
   - Consider reduced motion preferences

### Component Organization
- [ ] Profile card component
  - Header section with avatar and basic info
  - Bio section
  - Action buttons section
- [ ] Reusable components
  - Copy URL button
  - Theme-aware links
  - Profile image component

## Reference Implementation Notes

### From vveerrgg.online
- [ ] Study landing page structure
- [ ] Analyze webpack configuration
- [ ] Review styling approach

### From nigilcaenaan.online
- [ ] Review profile layout
- [ ] Study social integration
- [ ] Analyze build process

### From linktr-nostr
- [ ] Study SvelteKit implementation
- [ ] Review TypeScript usage
- [ ] Analyze Tailwind integration

## Quality Assurance

### Performance
- [ ] Optimize bundle size
- [ ] Implement lazy loading
- [ ] Optimize images
- [ ] Minimize API calls

### Accessibility
- [ ] WCAG compliance
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast

### Browser Support
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

## Future Considerations

### Scalability
- [ ] Template variations
- [ ] Plugin system
- [ ] Custom components
- [ ] API extensions

## Form Validation and Error Handling
- [x] Implement npub format validation
  - Verify starts with 'npub1'
  - Check exact length (63 characters)
  - Validate character set (letters and numbers)
- [x] User-friendly error messages
  - Clear error descriptions
  - Proper positioning below form
  - Visual feedback (red border, shake animation)
- [x] URL validation and routing
  - Validate npub in URL before rendering profile
  - Redirect invalid npubs to 404 page
  - Handle malformed URLs gracefully

### 404 Page Implementation
- [x] Custom 404 view for invalid routes
  - Clear error messaging
  - Helpful npub format requirements
  - Easy navigation back to home
  - Consistent theme support
- [x] Styling and UX
  - Centered layout
  - Responsive design
  - Theme-aware colors
  - Clear call-to-action

### Best Practices Implemented
- [x] Progressive Enhancement
  - Graceful fallbacks
  - Accessible error messages
  - Clear user guidance
- [x] Defensive Programming
  - Input validation
  - URL sanitization
  - Error state handling
- [x] User Experience
  - Immediate feedback
  - Clear error messages
  - Easy error recovery
  - Consistent styling