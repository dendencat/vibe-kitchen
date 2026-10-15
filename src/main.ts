import '@fontsource/m-plus-rounded-1c/400.css';
import '@fontsource/m-plus-rounded-1c/800.css';
import '../styles/main.css';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/responsive.css';
import { App } from './App';
import { AudioManager } from './audio/AudioManager';
import { SceneRenderer } from './three/SceneRenderer';

/**
 * Browser entry point: wires real dependencies into the app.
 */
function boot(): void {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const app = new App({
    audio: new AudioManager(),
    createScene: (container, options) => SceneRenderer.create(container, options),
    reducedMotion,
  });
  // Exposed for debugging and end-to-end tests.
  (window as unknown as { __app?: App }).__app = app;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
