import { createAppStore } from "@retainly/core";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useAppStore = createAppStore(AsyncStorage);
