import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export interface PreferencesState {
  practiceMode: "translations" | "no-translations";
  setPracticeMode: (mode: "translations" | "no-translations") => void;

  shuffleWordsInList: boolean;
  setShuffleWordsInList: (shuffleWordsInList: boolean) => void;
}

export function createPreferencesStore(storage: StateStorage) {
  return create<PreferencesState>()(
    persist(
      (set) => ({
        practiceMode: "translations",
        setPracticeMode: (mode) => set({ practiceMode: mode }),

        shuffleWordsInList: true,
        setShuffleWordsInList: (shuffleWordsInList: boolean) =>
          set({ shuffleWordsInList }),
      }),
      {
        name: "preferences",
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          practiceMode: state.practiceMode,
          shuffleWordsInList: state.shuffleWordsInList,
        }),
      },
    ),
  );
}

export type PreferencesStore = ReturnType<typeof createPreferencesStore>;
