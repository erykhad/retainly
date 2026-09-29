import { useAppStore } from "@/services/appStore";
import { Button, Host, HStack, Image, List, Text } from "@expo/ui/swift-ui";
import {
  background,
  cornerRadius,
  foregroundStyle,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack } from "expo-router";
import { StyleSheet } from "react-native";

export default function PickListScreen() {
  const lists = useAppStore((state) => state.lists);

  return (
    <>
      <Stack.Screen
        options={{
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
      <Host style={styles.container} colorScheme="dark">
        <List>
          {Array.from(lists.values()).map((list) => (
            <Button
              key={list.slug}
              onPress={() => {
                router.dismissTo({
                  pathname: "/manage/list-or-word",
                  params: { listSlug: list.slug },
                });
              }}
            >
              <HStack
                alignment="center"
                spacing={16}
                modifiers={[frame({ height: 22 })]}
              >
                <Image
                  systemName={list.icon}
                  size={16}
                  modifiers={[
                    frame({ width: 32, height: 32 }),
                    background(list.color),
                    tint("#ffffff"),
                    cornerRadius(16),
                  ]}
                />
                <Text modifiers={[foregroundStyle("#ffffff")]}>
                  {list.name}
                </Text>
              </HStack>
            </Button>
          ))}
        </List>
      </Host>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
