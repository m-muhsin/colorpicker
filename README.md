# Color Picker

A WordPress plugin that adds a **"Pick from screen"** eyedropper button to the block editor's color controls, letting you sample any color from anywhere on your screen — other browser tabs, other apps, images, or your desktop.

![WordPress](https://img.shields.io/badge/WordPress-6.6%2B-blue.svg)
![License](https://img.shields.io/badge/license-GPL--2.0--or--later-green.svg)

## What it does

The eyedropper button appears in every core color UI in the block editor:

- **Color palette popovers** — the Text, Background, and Link color dropdowns in block settings, as well as color controls in Global Styles.
- **The custom color picker** — opened from "Custom color picker", including the pickers attached to **gradient control points**, so you can sample colors for individual gradient stops.

Click the button, your cursor becomes a magnifying loupe, and clicking any pixel on screen applies that color to whatever setting the picker is editing. Press <kbd>Escape</kbd> to cancel.

## How it works

WordPress core doesn't expose extension points for the internals of its `ColorPalette` and `ColorPicker` components, so the plugin:

1. Watches the editor with a `MutationObserver` and injects the button whenever a color palette or custom color picker mounts.
2. Uses the browser's native [EyeDropper API](https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper_API) to sample the screen.
3. Applies the sampled color through the component's own code paths:
   - palette popovers: via the `ColorPalette` component's `onChange` prop (the same path a swatch click takes),
   - custom color picker: by committing to the picker's hex input, so it works for solid colors and gradient stops alike.

No block attributes are modified directly — the editor's normal state flow handles everything, including undo history.

## Browser support

The EyeDropper API is available in Chromium-based browsers (Chrome, Edge, Opera, Arc, Brave). In browsers without support (Firefox, Safari), the button simply doesn't render — nothing breaks.

## Installation

1. Download or clone this repository into `wp-content/plugins/colorpicker`:

   ```bash
   cd wp-content/plugins
   git clone https://github.com/m-muhsin/colorpicker.git
   ```

2. Activate **Color Picker** from the Plugins screen (or with WP-CLI: `wp plugin activate colorpicker`).

The `build/` directory is committed, so no build step is needed for regular use.

## Development

Built with [`@wordpress/scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/).

```bash
npm install
npm run build   # production build
npm run start   # development watch mode
```

Source lives in `src/`:

| File | Purpose |
|------|---------|
| `src/index.js` | Entry point |
| `src/core-eyedropper.js` | Observer + button injection into core color UIs |
| `src/style.scss` | Button styles |

## Requirements

- WordPress 6.6+
- PHP 7.2+

## License

[GPL-2.0-or-later](https://www.gnu.org/licenses/gpl-2.0.html)
