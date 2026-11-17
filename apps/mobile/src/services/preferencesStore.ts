import { createPreferencesStore } from "@retainly/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const usePreferencesStore = createPreferencesStore(AsyncStorage);
