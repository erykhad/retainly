import { useAppStore } from "@/services/appStore";
import type { List, Word } from "@/types";
import { Button, HStack, Image, Spacer, Text } from "@expo/ui/swift-ui";
import { font, foregroundStyle, tint } from "@expo/ui/swift-ui/modifiers";
import { Link } from "expo-router";
import Tts from "react-native-tts";

const SingleWord = ({ word, list }: { word: Word; list: List }) => {
  const firstTranslationWordSlug = word.translations[0];
  const firstTranslation = useAppStore((state) =>
    firstTranslationWordSlug
      ? state.vocabulary.get(firstTranslationWordSlug)
      : undefined,
  );

  return (
    <Link href={`/lists/${list.slug}/${word.slug}`} asChild>
      <Button>
        <HStack spacing={8} alignment="center">
          <Button onPress={() => Tts.speak(word.name)}>
            <Image
              systemName="play.circle"
              size={20}
              modifiers={[tint(list.color)]}
            />
          </Button>
          <Text modifiers={[foregroundStyle("#ffffff")]}>{word.name}</Text>
          {firstTranslation && (
            <Text
              modifiers={[
                font({ textStyle: "subheadline" }),
                foregroundStyle("#8e8e93"),
              ]}
            >
              {firstTranslation.name}
            </Text>
          )}
          <Spacer />
          <Image
            systemName="chevron.right"
            size={14}
            modifiers={[tint("#717176ff")]}
          />
        </HStack>
      </Button>
    </Link>
  );
};

export default SingleWord;
