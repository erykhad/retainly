import { ListRow, SingleWord } from "@/components";
import { useAppStore } from "@/services/appStore";
import { Host, List, Section, Text } from "@expo/ui/swift-ui";
import { font, foregroundStyle } from "@expo/ui/swift-ui/modifiers";
import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

export default function HomeScreen() {
  const lists = useAppStore((state) => state.lists);
  const vocabulary = useAppStore((state) => state.vocabulary);

  const [search, setSearch] = useState("");

  const listsAsArray = Array.from(lists.values());

  const wordsWithList = listsAsArray.flatMap((list) =>
    list.words
      .map((word) => vocabulary.get(word))
      .filter((w) => w !== undefined)
      .map((word) => [word, list] as const),
  );

  const sortedVocabulary = wordsWithList.sort(
    (a, b) => b[0].createdAt.getTime() - a[0].createdAt.getTime(),
  );

  const filteredVocabulary = sortedVocabulary
    .filter(([word]) => {
      if (word.name.toLowerCase().includes(search.toLowerCase())) return true;
      if (
        word.translations.some((t) => {
          const tWord = vocabulary.get(t);
          if (tWord) {
            return tWord.name.toLowerCase().includes(search.toLowerCase());
          }
          return false;
        })
      )
        return true;

      return false;
    })
    .slice(0, 20);

  const filteredList = listsAsArray.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Stack.SearchBar
        placeholder="Search"
        barTintColor="#1e1e1fff"
        textColor="#ffffff"
        onChangeText={({ nativeEvent }) => {
          setSearch(nativeEvent.text);
        }}
      />
      <Host style={styles.container} colorScheme="dark">
        <List>
          {search.length > 0 ? (
            <>
              {filteredVocabulary.length > 0 && (
                <Section
                  header={
                    <Text
                      modifiers={[
                        font({ textStyle: "title3", weight: "bold" }),
                        foregroundStyle("#ffffff"),
                      ]}
                    >
                      Vocabulary
                    </Text>
                  }
                >
                  {filteredVocabulary.slice(0, 20).map(([word, list]) => (
                    <SingleWord key={word.slug} word={word} list={list} />
                  ))}
                </Section>
              )}
              {filteredList.length > 0 && (
                <Section
                  header={
                    <Text
                      modifiers={[
                        font({ textStyle: "title3", weight: "bold" }),
                        foregroundStyle("#ffffff"),
                      ]}
                    >
                      Lists
                    </Text>
                  }
                >
                  {filteredList.slice(0, 20).map((list) => (
                    <ListRow key={list.slug} list={list} />
                  ))}
                </Section>
              )}
            </>
          ) : (
            <>
              <Section
                header={
                  <Text
                    modifiers={[
                      font({ textStyle: "title3", weight: "bold" }),
                      foregroundStyle("#ffffff"),
                    ]}
                  >
                    Recently
                  </Text>
                }
              >
                {sortedVocabulary.slice(0, 20).map(([word, list]) => (
                  <SingleWord key={word.slug} word={word} list={list} />
                ))}
              </Section>

              <Section
                header={
                  <Text
                    modifiers={[
                      font({ textStyle: "title3", weight: "bold" }),
                      foregroundStyle("#ffffff"),
                    ]}
                  >
                    Lists
                  </Text>
                }
              >
                {listsAsArray.map((list) => (
                  <ListRow key={list.slug} list={list} />
                ))}
              </Section>
            </>
          )}
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
