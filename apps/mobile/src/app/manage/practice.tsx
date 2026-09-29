import { useAppStore } from "@/services/appStore";
import { useGeminiStore } from "@/services/geminiStore";
import { usePreferencesStore } from "@/services/preferencesStore";
import type { Word } from "@/types";
import PagerView from "@expo/ui/community/pager-view";
import { Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const shuffle = <T,>(array: T[]): T[] => {
  //   set the index to the arrays length
  let i = array.length,
    j,
    temp;
  //   create a loop that subtracts everytime it iterates through
  while (--i > 0) {
    //  create a random number and store it in a variable
    j = Math.floor(Math.random() * (i + 1));
    // create a temporary position from the item of the random number
    temp = array[j];
    // swap the temp with the position of the last item in the array
    array[j] = array[i];
    // swap the last item with the position of the random number
    array[i] = temp;
  }

  return array;
};

export default function PracticeScreen() {
  const { listSlug } = useLocalSearchParams<{ listSlug?: string }>();
  const lists = useAppStore((state) => state.lists);
  const vocabulary = useAppStore((state) => state.vocabulary);
  const shouldShuffle = usePreferencesStore(
    (state) => state.shuffleWordsInList,
  );
  const practiceMode = usePreferencesStore((state) => state.practiceMode);
  const setPracticeMode = usePreferencesStore((state) => state.setPracticeMode);

  const list = listSlug ? lists.get(listSlug) : undefined;
  const listWords = list?.words ?? [];

  const shuffledList = shouldShuffle ? shuffle([...listWords]) : listWords;

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
                name:
                  practiceMode === "translations"
                    ? "polishzlotysign"
                    : "eurosign",
              },
              onPress: () => {
                setPracticeMode(
                  practiceMode === "translations"
                    ? "no-translations"
                    : "translations",
                );
              },
            },
          ],
        }}
      />
      <PagerView style={{ flex: 1 }}>
        {shuffledList.map((wordSlug) => {
          const word = vocabulary.get(wordSlug);

          if (!word) return null;

          return (
            <WordPracticeCard
              key={word.slug}
              word={word}
              vocabulary={vocabulary}
            />
          );
        })}
      </PagerView>
    </>
  );
}

function WordPracticeCard({
  word,
  vocabulary,
}: {
  word: Word;
  vocabulary: Map<string, Word>;
}) {
  const [isBlurred, setIsBlurred] = useState(true);
  const sentences = useGeminiStore((state) => state.getSentences(word.name));
  const practiceMode = usePreferencesStore((state) => state.practiceMode);

  const translations = word.translations
    .map((slug) => vocabulary.get(slug))
    .filter((w): w is Word => !!w);

  return (
    <ScrollView
      style={{ overflow: "visible" }}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <Pressable
        style={{ flexGrow: 1 }}
        onPress={() => setIsBlurred((w) => !w)}
      >
        {isBlurred ? (
          <View style={{ flex: 1, justifyContent: "center", gap: 16 }}>
            {practiceMode === "translations" && translations.length > 0 ? (
              translations.map((t) => (
                <Text key={t.slug} style={styles.text}>
                  {t.name}
                </Text>
              ))
            ) : (
              <Text style={styles.text}>{word.name}</Text>
            )}
          </View>
        ) : (
          <View style={styles.wrapper}>
            {translations.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, isBlurred && styles.blurredText]}
                >
                  Translations
                </Text>
                {practiceMode === "translations" ? (
                  <Text
                    style={[
                      styles.translationText,
                      isBlurred && styles.blurredText,
                    ]}
                  >
                    • {word.name}
                  </Text>
                ) : (
                  translations.map((t) => (
                    <Text
                      key={t.slug}
                      style={[
                        styles.translationText,
                        isBlurred && styles.blurredText,
                      ]}
                    >
                      • {t.name}
                    </Text>
                  ))
                )}
              </View>
            )}

            {sentences.length > 0 && (
              <View style={styles.section}>
                <Text
                  style={[styles.sectionTitle, isBlurred && styles.blurredText]}
                >
                  Sentences
                </Text>
                {sentences.map((s) => (
                  <View key={s.id} style={{ marginBottom: 12 }}>
                    <Text
                      style={[
                        styles.sentenceText,
                        isBlurred && styles.blurredText,
                      ]}
                    >
                      {s.text}
                    </Text>
                    {s.translations.map((t) => (
                      <Text
                        key={t.id}
                        style={[
                          styles.sentenceTranslation,
                          isBlurred && styles.blurredText,
                        ]}
                      >
                        {t.text}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {translations.length === 0 && sentences.length === 0 && (
              <View style={styles.section}>
                <Text
                  style={[
                    styles.translationText,
                    isBlurred && styles.blurredText,
                  ]}
                >
                  No translations or sentences available.
                </Text>
              </View>
            )}
          </View>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  text: {
    fontSize: 32,
    color: "#ffffff",
    fontWeight: "bold",
    textAlign: "center",
  },
  wrapper: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 12,
  },
  translationText: {
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 8,
  },
  sentenceText: {
    fontSize: 18,
    color: "#ffffff",
    marginBottom: 4,
  },
  sentenceTranslation: {
    fontSize: 16,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  blurredTextContainer: {
    flex: 1,
    opacity: 0.8,
  },
  blurredText: {
    color: "transparent",
    textShadowColor: "rgba(255, 255, 255, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  blurOverlay: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  tapToReveal: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    overflow: "hidden",
  },
  hideAgainButton: {
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },
  hideAgainText: {
    color: "#9ca3af",
    fontSize: 16,
  },
});
