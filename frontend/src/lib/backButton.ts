import { App as CapApp } from '@capacitor/app';
import { isNative } from './platform';

type BackHandler = () => boolean; // return true if handled, false to delegate
const handlers: BackHandler[] = [];

/**
 * Registers a modal or view to intercept the hardware back button.
 * Handlers are evaluated in LIFO (last in, first out) order.
 */
export function registerBackHandler(handler: BackHandler): () => void {
  handlers.push(handler);
  return () => {
    const idx = handlers.indexOf(handler);
    if (idx !== -1) handlers.splice(idx, 1);
  };
}

let backButtonInitialized = false;

export function initBackButton(navigateBack: () => void, exitCondition: () => boolean): void {
  if (!isNative() || backButtonInitialized) return;
  backButtonInitialized = true;

  CapApp.addListener('backButton', ({ canGoBack }) => {
    // 1. Check if any active modal wants to handle it
    for (let i = handlers.length - 1; i >= 0; i--) {
      const handled = handlers[i]();
      if (handled) return;
    }

    // 2. Check if at root screen -> minimize/exit app
    if (exitCondition()) {
      CapApp.exitApp();
      return;
    }

    // 3. Otherwise navigate back in router history
    if (canGoBack) {
      navigateBack();
    } else {
      CapApp.exitApp();
    }
  });
}
