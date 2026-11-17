import { createGeminiStore } from "@retainly/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useGeminiStore = createGeminiStore(AsyncStorage);
