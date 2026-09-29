import { SingleWord } from "@/components";
import { useAppStore } from "@/services/appStore";
import { usePreferencesStore } from "@/services/preferencesStore";
import {
  Button,
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  cornerRadius,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";

const RedirectBack = () => {
  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/");
    }
  }, []);

  return null;
};

export default function SingleListScreen() {
  const { listSlug } = useLocalSearchParams<{ listSlug: string }>();
  const list = useAppStore((state) => state.lists.get(listSlug));
  const vocabulary = useAppStore((state) => state.vocabulary);
  const deleteList = useAppStore((state) => state.deleteList);
  const deleteWord = useAppStore((state) => state.deleteWord);
  const reorderWordsInList = useAppStore((state) => state.reorderWordsInList);
  const shuffleWordsInList = usePreferencesStore(
    (state) => state.shuffleWordsInList,
  );
  const setShuffleWordsInList = usePreferencesStore(
    (state) => state.setShuffleWordsInList,
  );

  if (!list) return <RedirectBack />;

  const listWords = list.words
    .map((word) => vocabulary.get(word))
    .filter((w) => w !== undefined);

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              label: "",
              type: "button",
              icon: {
                type: "sfSymbol",
                name: "plus",
              },
              sharesBackground: false,
              onPress: () =>
                router.navigate({
                  pathname: "/manage/list-or-word",
                  params: { listSlug },
                }),
            },
            {
              label: "",
              type: "menu",
              icon: {
                type: "sfSymbol",
                name: "ellipsis",
              },
              menu: {
                items: [
                  {
                    state: shuffleWordsInList ? "on" : "off",
                    type: "action",
                    label: "Shuffle words",
                    onPress: () => {
                      setShuffleWordsInList(!shuffleWordsInList);
                    },
                  },
                ],
              },
            },
          ],
        }}
      />
      <Host style={styles.container} colorScheme="dark">
        <List>
          <Section
            header={
              <HStack>
                <Spacer />
                <VStack alignment="center" spacing={8}>
                  <Image
                    systemName={list.icon}
                    size={32}
                    modifiers={[
                      frame({ width: 64, height: 64 }),
                      background(list.color),
                      cornerRadius(32),
                    ]}
                  />
                  <VStack spacing={4}>
                    <Text
                      modifiers={[
                        font({ textStyle: "title", weight: "bold" }),
                        foregroundStyle("#ffffff"),
                        lineLimit(1),
                      ]}
                    >
                      {list.name}
                    </Text>
                    <Text modifiers={[font({ textStyle: "subheadline" })]}>
                      {list.words.length} words saved
                    </Text>
                  </VStack>
                  <Button
                    modifiers={[buttonStyle("glass"), padding({ top: 16 })]}
                    onPress={() =>
                      router.navigate({
                        pathname: "/manage/practice",
                        params: { listSlug },
                      })
                    }
                  >
                    <Image systemName="play.fill" size={12} />
                    <Text
                      modifiers={[
                        font({ textStyle: "body", weight: "medium" }),
                      ]}
                    >
                      Practice
                    </Text>
                  </Button>
                </VStack>
                <Spacer />
              </HStack>
            }
          />
          <Section>
            <List.ForEach
              onMove={(indices, destinationIndex) => {
                reorderWordsInList(list.slug, indices, destinationIndex);
              }}
              onDelete={(indices) => {
                indices.forEach((i) => deleteWord(listWords[i].slug));
              }}
            >
              {listWords.map((word) => (
                <SingleWord key={word.slug} word={word} list={list} />
              ))}
            </List.ForEach>
          </Section>
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
