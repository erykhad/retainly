import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

export const unstable_settings = {
  lists: {
    "[listSlug]": {
      initialRouteName: "index",
    },
  },
};

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="manage/list-or-word"
        options={{
          presentation: "pageSheet",
          headerTintColor: "#ffffff",
          headerTitle: "New",
          headerTransparent: true,
          unstable_headerLeftItems: () => [
            {
              label: "",
              type: "button",
              icon: {
                type: "sfSymbol",
                name: "xmark",
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <Stack.Screen
        name="manage/pick-list"
        options={{
          presentation: "pageSheet",
          headerTintColor: "#ffffff",
          headerTitle: "Pick a list",
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="manage/add-translation"
        options={{
          presentation: "pageSheet",
          headerTitle: "Add Word",
          headerTransparent: true,
          headerTintColor: "#ffffff",
          unstable_headerLeftItems: () => [
            {
              label: "",
              type: "button",
              icon: {
                type: "sfSymbol",
                name: "xmark",
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <Stack.Screen
        name="manage/practice"
        options={{
          presentation: "pageSheet",
          headerTitle: "Practice",
          headerTransparent: true,
          headerTintColor: "#ffffff",
          contentStyle: { backgroundColor: "#1C1C1E" },
          unstable_headerLeftItems: () => [
            {
              label: "",
              type: "button",
              icon: {
                type: "sfSymbol",
                name: "xmark",
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <Stack.Screen
        name="lists/[listSlug]"
        options={{
          headerTitle: "",
          headerTransparent: true,
          unstable_headerLeftItems: () => [
            {
              label: "",
              type: "button",
              icon: {
                type: "sfSymbol",
                name: "chevron.backward",
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <Stack.Screen
        name="lists/[listSlug]/[wordSlug]"
        options={{
          headerLargeTitleEnabled: true,
          headerTintColor: "#ffffff",
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
