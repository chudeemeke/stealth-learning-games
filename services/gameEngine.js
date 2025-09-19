/*
 * GameEngine coordinates page navigation and shared state across the
 * application. It implements a simple event bus to decouple modules
 * and provides methods to register and navigate between views.
 */

export class GameEngine {
  constructor() {
    this.currentView = null;
    this.views = {};
    this.events = {};
    // Retrieve or generate a pseudo-anonymous user id
    this.userId = this._initUserId();

    // Preload sound effects and ambient background music.  By preloading
    // here we avoid repeated network requests and ensure that sound can
    // be triggered quickly from within game components.  Sounds are
    // stored under the ``sounds`` directory in the project root.  Use
    // obscure emojis elsewhere in the UI instead of icons.
    this.sounds = {};
    try {
      this.sounds.correct = new Audio('sounds/correct.wav');
      this.sounds.wrong = new Audio('sounds/wrong.wav');
      this.sounds.success = new Audio('sounds/success.wav');
      this.sounds.ambient = new Audio('sounds/ambient.wav');
      this.sounds.ambient.loop = true;
      // Lower the ambient volume so it sits subtly under the effects
      this.sounds.ambient.volume = 0.2;
      // Attempt to play ambient once the user interacts with the page.
      const startAmbient = () => {
        this.sounds.ambient.play().catch(() => {});
        window.removeEventListener('click', startAmbient);
        window.removeEventListener('keydown', startAmbient);
      };
      window.addEventListener('click', startAmbient);
      window.addEventListener('keydown', startAmbient);
    } catch (e) {
      console.warn('Failed to preload audio', e);
    }
  }

  _initUserId() {
    let uid = localStorage.getItem('stealth-user-id');
    if (!uid) {
      uid = 'u-' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('stealth-user-id', uid);
    }
    return uid;
  }

  /**
   * Register a view component with a key. A view component is a function
   * that receives the GameEngine instance and returns a DOM element.
   */
  registerView(key, component) {
    this.views[key] = component;
  }

  /**
   * Navigate to a registered view. Removes existing content from the #app
   * container and renders the new view.
   */
  navigate(key, params = {}) {
    const root = document.getElementById('app');
    root.innerHTML = '';
    if (!this.views[key]) {
      const error = document.createElement('div');
      error.textContent = `View not found: ${key}`;
      root.appendChild(error);
      return;
    }
    this.currentView = key;
    const view = this.views[key](this, params);
    root.appendChild(view);
  }

  /**
   * Subscribe to a named event.
   */
  on(event, handler) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(handler);
  }

  /**
   * Emit a named event with data.
   */
  emit(event, data) {
    (this.events[event] || []).forEach(handler => handler(data));
  }

  /**
   * Play a preloaded sound by name. If the sound exists it will be
   * restarted from the beginning to ensure immediate feedback.
   * Unknown names are ignored silently.
   *
   * @param {string} name Name of the sound: 'correct', 'wrong', 'success'.
   */
  playSound(name) {
    const snd = this.sounds && this.sounds[name];
    if (snd) {
      try {
        snd.currentTime = 0;
        snd.play();
      } catch (err) {
        // ignore errors (user has not interacted yet or browser restrictions)
      }
    }
  }
}
