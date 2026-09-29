import { router, Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTintColor: "#ffffff",
          headerTitle: "Browse",
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          // unstable_headerLeftItems: () => [
          //   {
          //     type: "custom",
          //     hidesSharedBackground: true,
          //     element: (
          //       <Host matchContents>
          //         <Text
          //           modifiers={[font({ textStyle: "title", weight: "bold" })]}
          //         >
          //           Activity
          //         </Text>
          //       </Host>
          //     ),
          //   },
          // ],
          unstable_headerRightItems: () => [
            {
              label: "",
              icon: {
                type: "sfSymbol",
                name: "plus",
              },
              type: "button",
              sharesBackground: false,
              onPress: () => router.navigate("/manage/list-or-word"),
            },
            // {
            //   label: "",
            //   icon: {
            //     type: "sfSymbol",
            //     name: "slider.horizontal.3",
            //   },
            //   type: "button",
            //   onPress: () => {},
            // },
          ],
        }}
      />
    </Stack>
  );
}
