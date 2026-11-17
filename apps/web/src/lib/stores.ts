import {
  buildSeedState,
  createAppStore,
  createGeminiStore,
  createPreferencesStore,
  isAppStorageEmpty,
} from "@retainly/core";

const storage = localStorage;

/**
 * Seed vocabulary into localStorage on first visit only, before the Zustand
 * persist middleware hydrates, so a reload restores the same data.
 */
function ensureSeedInLocalStorage(): void {
  if (!isAppStorageEmpty(storage.getItem("app-storage"))) return;

  const { lists, vocabulary } = buildSeedState();
  const payload = {
    state: {
      lists: Array.from(lists.entries()),
      vocabulary: Array.from(vocabulary.entries()),
    },
    version: 0,
  };
  storage.setItem("app-storage", JSON.stringify(payload));
}

ensureSeedInLocalStorage();

export const useAppStore = createAppStore(storage);
export const usePreferencesStore = createPreferencesStore(storage);
export const useGeminiStore = createGeminiStore(storage);

/** Kept for App.tsx call sites; seeding already ran at module load. */
export function ensureSeeded(): void {
  ensureSeedInLocalStorage();
}
