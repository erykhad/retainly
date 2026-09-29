import { useGeminiAiSearch, useTatoebaSearch } from "@/hooks";
import { useAppStore } from "@/services/appStore";
import { Word } from "@/types";
import {
  BottomSheet,
  Button,
  Divider,
  Group,
  Host,
  HStack,
  Image,
  List,
  Picker,
  ScrollView,
  Section,
  Text,
  VStack,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  cornerRadius,
  font,
  foregroundStyle,
  interactiveDismissDisabled,
  lineLimit,
  listRowInsets,
  padding,
  pickerStyle,
  presentationBackground,
  presentationBackgroundInteraction,
  PresentationDetent,
  presentationDetents,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Redirect, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, StyleSheet } from "react-native";

export default function ListWordScreen() {
  const { listSlug, wordSlug } = useLocalSearchParams<{
    listSlug: string;
    wordSlug: string;
  }>();

  const word = useAppStore((state) => state.vocabulary.get(wordSlug));
  const vocabulary = useAppStore((state) => state.vocabulary);

  const [collapsedWords, setCollapsedWords] = useState<string[]>([]);

  if (!word) {
    return (
      <Redirect
        href={{ pathname: "/lists/[listSlug]", params: { listSlug } }}
      />
    );
  }

  const translationWords = word.translations
    .map((translationSlug) => vocabulary.get(translationSlug))
    .filter((word) => word !== undefined);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: word.name,
          unstable_headerRightItems: () => [
            {
              label: "",
              icon: {
                type: "sfSymbol",
                name: "plus",
              },
              type: "button",
              sharesBackground: false,
              onPress: () =>
                router.navigate({
                  pathname: "/manage/add-translation",
                  params: { wordSlug },
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
                    type: "action",
                    label: "Edit",
                    icon: {
                      type: "sfSymbol",
                      name: "pencil",
                    },
                    onPress: () => {},
                  },
                  {
                    type: "action",
                    label: "Delete",
                    icon: {
                      type: "sfSymbol",
                      name: "trash",
                    },
                    destructive: true,
                    onPress: () => {},
                  },
                ],
              },
              onPress: () => {},
            },
          ],
        }}
      />
      <Host style={styles.container} colorScheme="dark">
        <List>
          <Section
            header={
              <VStack alignment="leading" spacing={16}>
                {translationWords.map((word) => (
                  <VStack key={word.slug} alignment="leading" spacing={4}>
                    <Button
                      onPress={() =>
                        setCollapsedWords((prev) => {
                          if (prev.includes(word.slug)) {
                            return prev.filter((w) => w !== word.slug);
                          }
                          return [...prev, word.slug];
                        })
                      }
                    >
                      <HStack spacing={12}>
                        <Image
                          systemName="chevron.right"
                          size={16}
                          modifiers={[tint("#8c8c92ff")]}
                        />
                        <HStack spacing={8}>
                          <Text
                            modifiers={[
                              font({ textStyle: "title", weight: "bold" }),
                              foregroundStyle("#8c8c92ff"),
                              lineLimit(1),
                            ]}
                          >
                            {word.name}
                          </Text>
                          <Text
                            modifiers={[
                              font({ textStyle: "caption" }),
                              padding({ vertical: 5, horizontal: 10 }),
                              background("#19191aff"),
                              foregroundStyle("#8c8c92ff"),
                              cornerRadius(16),
                            ]}
                          >
                            B2
                          </Text>
                        </HStack>
                      </HStack>
                    </Button>
                    {collapsedWords.includes(word.slug) && (
                      <Text modifiers={[padding({ leading: 28 })]}>-</Text>
                    )}
                  </VStack>
                ))}
              </VStack>
            }
            modifiers={[
              listRowInsets({
                top: 8,
                bottom: 16,
              }),
            ]}
          >
            <></>
          </Section>
        </List>
        <ContextBottomSheet word={word} />
      </Host>
    </>
  );
}

const detents: PresentationDetent[] = [{ height: 72 }, "medium", "large"];

const ContextBottomSheet = ({ word }: { word: Word }) => {
  const [selectedSegment, setSelectedSegment] = useState<
    "tatoeba" | "gemini-ai"
  >("tatoeba");

  const {
    sentences: tatoebaSentences,
    isLoading,
    error,
    hasMore,
    fetchMore,
  } = useTatoebaSearch({
    query: word.name,
  });
  const {
    sentences: geminiSentences,
    isLoading: isGeminiLoading,
    error: geminiError,
    fetchMore: fetchMoreGemini,
  } = useGeminiAiSearch({
    query: word.name,
    enabled: selectedSegment === "gemini-ai",
  });

  const [selectedDetent, setSelectedDetent] = useState<PresentationDetent>(
    detents[0],
  );

  const showDialog = () => {
    Alert.prompt(
      "Gemini AI",
      "Add context to generated sentences",
      (context) => {
        fetchMoreGemini(context);
      },
    );
  };

  return (
    <BottomSheet isPresented onIsPresentedChange={() => {}}>
      <Group
        modifiers={[
          presentationDetents(detents, {
            selection: detents[0],
            onSelectionChange: setSelectedDetent,
          }),
          presentationBackgroundInteraction("enabled"),
          interactiveDismissDisabled(),
          presentationBackground("rgba(15, 15, 15, 0.945)"),
        ]}
      >
        <ScrollView>
          <VStack
            spacing={2}
            modifiers={[
              padding({
                all: 16,
                top: typeof selectedDetent === "string" ? 48 : 16,
              }),
            ]}
          >
            <Text
              modifiers={[
                font({ textStyle: "title3", weight: "semibold" }),
                foregroundStyle("#ffffff"),
              ]}
            >
              Examples of Usage
            </Text>
            <Text
              modifiers={[
                font({ weight: "medium", size: 14 }),
                foregroundStyle("#a7a7adff"),
              ]}
            >
              {selectedSegment === "tatoeba"
                ? error
                  ? "Failed to retrieve sentences"
                  : isLoading
                    ? "Retrieving sentences..."
                    : `Found ${tatoebaSentences.length} sentences`
                : geminiError
                  ? "Failed to generate sentences"
                  : isGeminiLoading
                    ? "Generating sentences..."
                    : `Generated ${geminiSentences.length} sentences`}
            </Text>
          </VStack>
          <Picker
            selection={selectedSegment}
            onSelectionChange={setSelectedSegment}
            modifiers={[pickerStyle("segmented"), padding({ horizontal: 16 })]}
          >
            <Text modifiers={[tag("tatoeba")]}>Tatoeba</Text>
            <Text modifiers={[tag("gemini-ai")]}>Gemini AI</Text>
          </Picker>
          <VStack
            alignment="leading"
            spacing={16}
            modifiers={[padding({ all: 16 })]}
          >
            {(selectedSegment === "tatoeba"
              ? tatoebaSentences
              : geminiSentences
            ).map((sentence, index) => (
              <React.Fragment key={sentence.id}>
                {index !== 0 && <Divider />}
                <Text
                  modifiers={[
                    font({ weight: "medium", size: 14 }),
                    foregroundStyle("#ffffff"),
                  ]}
                >
                  {sentence.text}
                </Text>
              </React.Fragment>
            ))}
          </VStack>
          {selectedSegment === "tatoeba" && hasMore && (
            <Button
              label="Show more"
              modifiers={[buttonStyle("glass")]}
              onPress={fetchMore}
            />
          )}
          {selectedSegment === "gemini-ai" && !isGeminiLoading && (
            <Button
              label="Generate more"
              modifiers={[buttonStyle("glass")]}
              onPress={showDialog}
            />
          )}
        </ScrollView>
      </Group>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
