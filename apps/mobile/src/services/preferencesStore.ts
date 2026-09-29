import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface PreferencesState {
  practiceMode: "translations" | "no-translations";
  setPracticeMode: (mode: "translations" | "no-translations") => void;

  shuffleWordsInList: boolean;
  setShuffleWordsInList: (shuffleWordsInList: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
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
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        practiceMode: state.practiceMode,
        shuffleWordsInList: state.shuffleWordsInList,
      }),
    },
  ),
);
