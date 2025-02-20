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