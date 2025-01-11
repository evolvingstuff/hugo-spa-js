# Hugo SPA JS

A zero-dependency JavaScript solution that adds SPA-like navigation to Hugo sites while preserving search functionality and scroll positions.

## Features

- 🚀 Client-side navigation without page reloads
- 💾 Content caching to avoid refetches
- 📜 Scroll position preservation
- 🔍 Search functionality preservation
- 📱 Browser history management
- 0️⃣ Zero dependencies

## Installation

### Direct Include
```html
<script src="path/to/hugo-spa.js"></script>
```

## Usage

1. Add `role="main"` to your main content area:
```html
<main role="main">{{ .Content }}</main>
```

2. Add `data-spa-nav` to navigation regions (optional):
```html
<nav data-spa-nav>...</nav>
```

3. Initialize LightSPA:
```javascript
const spa = new LightSPA({
  mainContentSelector: 'main[role="main"]',  // Content area selector
  navigationSelector: '[data-spa-nav]'       // Navigation area selector
});
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| mainContentSelector | 'main[role="main"]' | Selector for the main content area |
| navigationSelector | '[data-spa-nav]' | Selector for navigation elements |

## Events

The library dispatches the following custom events:

- `spaContentUpdated`: Fired after content updates, with detail: `{ url, pushState }`

## Browser Support

Supports all modern browsers (Chrome, Firefox, Safari, Edge).

## License

MIT License - see LICENSE file for details
