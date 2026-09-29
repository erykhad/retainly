import { useAppStore } from "@/services/appStore";
import {
  Host,
  HStack,
  Image,
  List,
  Section,
  Spacer,
  Text,
  TextField,
  Toggle,
  useNativeState,
} from "@expo/ui/swift-ui";
import {
  cornerRadius,
  foregroundStyle,
  frame,
  listSectionSpacing,
} from "@expo/ui/swift-ui/modifiers";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";

export default function AddTranslationScreen() {
  const { wordSlug } = useLocalSearchParams<{ wordSlug?: string }>();
  const [withContext, setWithContext] = useState(false);

  const addWord = useAppStore((state) => state.addWord);
  const assignTranslationToWord = useAppStore(
    (state) => state.assignTranslationToWord,
  );

  const wordName = useNativeState("");
  const contextText = useNativeState("");

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
                name: "checkmark",
              },
              onPress: () => {
                if (!wordSlug || !wordName.value) return;
                const translationSlug = addWord({
                  name: wordName.value,
                  language: "polish",
                  notes: "",
                });
                if (!translationSlug) return;

                assignTranslationToWord(wordSlug, translationSlug);
                router.back();
              },
            },
          ],
        }}
      />
      <Host style={styles.container} colorScheme="dark">
        <List>
          <Section modifiers={[listSectionSpacing("compact")]}>
            <TextField
              placeholder="Word in original language"
              text={wordName}
            />
          </Section>
          <Section modifiers={[listSectionSpacing("compact")]}>
            <HStack
              alignment="center"
              spacing={16}
              modifiers={[frame({ height: 22 })]}
            >
              <Image
                systemName="brain"
                size={16}
                modifiers={[frame({ width: 32, height: 32 }), cornerRadius(16)]}
              />
              <Text modifiers={[foregroundStyle("#ffffff")]}>With Context</Text>
              <Spacer />
              <Toggle onIsOnChange={setWithContext} isOn={withContext} />
            </HStack>
            {withContext && (
              <TextField
                placeholder="Context in target language"
                text={contextText}
              />
            )}
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
