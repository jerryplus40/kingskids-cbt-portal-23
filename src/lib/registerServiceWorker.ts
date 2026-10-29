import { registerSW } from 'virtual:pwa-register';

const CHECK_EVERY_MS = 30 * 60 * 1000;

/** True while a candidate is mid-exam on this page; a reload then would interrupt them. */
const sittingExam = () => window.location.pathname.startsWith('/exam/');

/**
 * Keeps the cached app current. The service worker only looks for a new version when the
 * page is opened, so a phone tab left open for days kept an old copy. Check every 30
 * minutes and whenever the tab comes back into view, and apply the update at once,
 * except during an exam, where it waits until the candidate leaves the exam screen.
 */
export function registerServiceWorker() {
  let pending = false;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pending = true;
      if (!sittingExam()) void updateSW(true);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update();
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        if (pending && !sittingExam()) void updateSW(true);
        else check();
      });
    },
  });
}
