import { useAppStore } from "@/services/appStore";
import type { List as TList } from "@/types";
import {
  Button,
  Circle,
  Host,
  HStack,
  Image,
  List,
  Picker,
  Section,
  Spacer,
  Text,
  TextField,
  Toggle,
  useNativeState,
  VStack,
  ZStack,
} from "@expo/ui/swift-ui";
import {
  background,
  buttonStyle,
  cornerRadius,
  foregroundStyle,
  frame,
  listRowInsets,
  listSectionSpacing,
  pickerStyle,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Link, router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { StyleSheet } from "react-native";

const PALETTE_ROWS = [
  ["#FF453A", "#FF9F0A", "#FFD60A", "#30D158", "#0A84FF", "#BF5AF2"],
  ["#FF2D55", "#64D2FF", "#5E5CE6", "#A2845E", "#8E8E93", "#FFFFFF"],
];

const ICONS_ROWS = [
  [
    "character.bubble.fill.or",
    "character.bubble.fill.pa",
    "character.bubble.fill.sat",
    "character.bubble.fill.si",
    "character.bubble.fill.ta",
    "character.bubble.fill.te",
  ],
  [
    "checkmark.app.fill",
    "checkmark.circle.badge.airplane.fill",
    "checkmark.circle.badge.plus.fill",
    "checkmark.circle.trianglebadge.exclamationmark.fill",
    "circle.grid.2x2.topleft.checkmark.filled",
    "clock.badge.airplane.fill",
  ],
  [
    "coat.circle.fill",
    "creditcard.rewards.fill",
    "cube.circle.fill",
    "document.on.trash.fill",
    "ellipsis.circle.badge.fill",
    "envelope.and.hand.raised.fill",
  ],
  [
    "envelope.badge.minus.fill",
    "envelope.badge.plus.fill",
    "envelope.open.badge.clock.fill",
    "environments.circle.fill",
    "environments.fill",
    "environments.slash.circle.fill",
  ],
  [
    "environments.slash.fill",
    "eraser.badge.xmark.fill",
    "eraser.slash.fill",
    "eraser.trianglebadge.exclamationmark.fill",
    "eye.half.closed.fill",
    "fan.badge.arrow.up.and.down.and.arrow.left.and.right.fill",
  ],
  [
    "fan.circle.fill",
    "figure.walk.suitcase.rolling.circle.fill",
    "fuelpump.thermometer.fill",
    "globe.badge.clock.fill",
    "globe.fill",
    "hand.thumbsdown.filled.hand.thumbsup",
  ],
  [
    "hand.thumbsdown.hand.thumbsup.fill",
    "hand.thumbsdown.hand.thumbsup.filled",
    "handbag.sensor.tag.radiowaves.left.and.right.fill",
    "headphones.sensor.tag.radiowaves.left.and.right.fill",
    "heart.badge.bolt.fill",
    "heart.badge.bolt.slash.fill",
  ],
  [
    "heat.waves.circle.fill",
    "homepod.badge.checkmark.fill",
    "homepod.badge.checkmark.fill.rtl",
    "homepod.mini.and.appletv.fill",
    "homepod.mini.and.appletv.fill.rtl",
    "homepod.mini.badge.checkmark.fill",
  ],
  [
    "homepod.mini.badge.checkmark.fill.rtl",
    "humidifier.and.ellipsis.fill",
    "inset.filled.bottomleading.bottomtrailing.rectangle",
    "inset.filled.bottomleft.bottomright.rectangle",
    "inset.filled.circle.slash",
    "inset.filled.leftthird.middlethird.rightthird.rectangle",
  ],
  [
    "inset.filled.pano",
    "inset.filled.rectangle.and.pointer.arrow",
    "inset.filled.topthird.middlethird.bottomthird.rectangle",
    "jacket.circle.fill",
    "jacket.sensor.tag.radiowaves.left.and.right.fill",
    "key.circle.fill",
  ],
  [
    "key.sensor.tag.radiowaves.left.and.right.fill",
    "key.shield.fill",
    "list.dash.header.rectangle.fill",
    "lock.badge.checkmark.fill",
    "lock.badge.xmark.fill",
    "lock.heart.fill",
  ],
  [
    "macmini.badge.checkmark.fill",
    "macpro.gen3.badge.ckeckmark.fill",
    "macstudio.badge.checkmark.fill",
    "music.note.square.stack.fill",
    "music.pages.fill",
    "person.2.badge.fill",
  ],
] as const;

export default function ManageListOrWordScreen() {
  const { listSlug } = useLocalSearchParams<{ listSlug?: string }>();
  const { addWord, addList, assignWordToList, lists } = useAppStore();
  const hasLists = useAppStore((state) => state.lists.size > 0);

  const selectedList = listSlug ? lists.get(listSlug) : undefined;
  const [selectedSegment, setSelectedSegment] = useState<"vocabulary" | "list">(
    hasLists ? "vocabulary" : "list",
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    PALETTE_ROWS[0][0],
  );
  const [selectedIcon, setSelectedIcon] = useState<string>(ICONS_ROWS[0][0]);
  const nameState = useNativeState("");
  const notesState = useNativeState("");

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
                if (selectedSegment === "vocabulary") {
                  const slug = addWord({
                    name: nameState.value,
                    notes: notesState.value,
                    language: "english",
                  });
                  if (selectedList && slug) {
                    assignWordToList(selectedList.slug, slug);
                  }
                } else {
                  addList({
                    name: nameState.value,
                    notes: notesState.value,
                    icon: selectedIcon,
                    color: selectedColor,
                  });
                }
                router.back();
              },
            },
          ],
        }}
      />
      <Host style={styles.container} colorScheme="dark">
        <List>
          <Section
            header={
              <Picker
                selection={selectedSegment}
                onSelectionChange={setSelectedSegment}
                modifiers={[
                  pickerStyle("segmented"),
                  listRowInsets({
                    bottom: 16,
                  }),
                ]}
              >
                <Text modifiers={[tag("vocabulary")]}>Vocabulary</Text>
                <Text modifiers={[tag("list")]}>List</Text>
              </Picker>
            }
          >
            <TextField placeholder="Name" text={nameState} />
            <TextField placeholder="Notes" text={notesState} />
          </Section>

          {selectedSegment === "vocabulary" && (
            <VocabularySegment selectedList={selectedList} />
          )}
          {selectedSegment === "list" && (
            <ListSegment
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedIcon={selectedIcon}
              setSelectedIcon={setSelectedIcon}
            />
          )}
        </List>
      </Host>
    </>
  );
}

const VocabularySegment = ({ selectedList }: { selectedList?: TList }) => {
  return (
    <>
      <Section title="More Options" modifiers={[listSectionSpacing("compact")]}>
        <Link href={`/manage/pick-list`} asChild>
          <Button>
            <HStack
              alignment="center"
              spacing={16}
              modifiers={[frame({ height: 22 })]}
            >
              <Image
                systemName={selectedList ? selectedList.icon : "questionmark"}
                size={16}
                modifiers={[
                  frame({ width: 32, height: 32 }),
                  background(selectedList ? selectedList.color : "transparent"),
                  tint("#ffffff"),
                  cornerRadius(16),
                ]}
              />
              <Text modifiers={[foregroundStyle("#ffffff")]}>
                {selectedList ? selectedList.name : "Choose a list"}
              </Text>
              <Spacer />
              <Image
                systemName="chevron.right"
                size={14}
                modifiers={[tint("#717176ff")]}
              />
            </HStack>
          </Button>
        </Link>
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
            modifiers={[
              frame({ width: 32, height: 32 }),
              tint("#abababff"),
              cornerRadius(16),
            ]}
          />
          <Text modifiers={[foregroundStyle("#ffffff")]}>With Context</Text>
          <Spacer />
          <Toggle />
        </HStack>
      </Section>
    </>
  );
};

const ListSegment = ({
  selectedColor,
  setSelectedColor,
  selectedIcon,
  setSelectedIcon,
}: {
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedIcon: string;
  setSelectedIcon: (icon: string) => void;
}) => {
  return (
    <>
      <Section
        header={<Text>More Options</Text>}
        modifiers={[listSectionSpacing("compact")]}
      >
        <VStack spacing={16}>
          {PALETTE_ROWS.map((row, rowIndex) => (
            <HStack key={rowIndex} alignment="center">
              {row.slice(0, 6).map((color, index) => (
                <React.Fragment key={index}>
                  {index !== 0 && <Spacer />}
                  <ZStack modifiers={[frame({ height: 40, width: 40 })]}>
                    {selectedColor === color && (
                      <Circle
                        modifiers={[
                          foregroundStyle("#808087ff"),
                          frame({ height: 50, width: 50 }),
                        ]}
                      />
                    )}
                    {selectedColor === color && (
                      <Circle
                        modifiers={[
                          foregroundStyle("#303032ff"),
                          frame({ height: 46, width: 46 }),
                        ]}
                      />
                    )}
                    <Button
                      modifiers={[
                        buttonStyle("borderless"),
                        frame({ height: 40, width: 40 }),
                        background(color),
                        cornerRadius(20),
                        tint(color),
                      ]}
                      onPress={() => setSelectedColor(color)}
                    >
                      <Image systemName="0.circle" size={20} />
                    </Button>
                  </ZStack>
                </React.Fragment>
              ))}
            </HStack>
          ))}
        </VStack>
      </Section>

      <Section modifiers={[listSectionSpacing("compact")]}>
        <VStack spacing={16}>
          {ICONS_ROWS.map((row, rowIndex) => (
            <HStack key={rowIndex}>
              {row.map((icon, index) => (
                <React.Fragment key={index}>
                  {index !== 0 && <Spacer />}
                  <ZStack modifiers={[frame({ height: 40, width: 40 })]}>
                    {selectedIcon === icon && (
                      <Circle
                        modifiers={[
                          foregroundStyle("#808087ff"),
                          frame({ height: 50, width: 50 }),
                        ]}
                      />
                    )}
                    {selectedIcon === icon && (
                      <Circle
                        modifiers={[
                          foregroundStyle("#303032ff"),
                          frame({ height: 46, width: 46 }),
                        ]}
                      />
                    )}
                    <Button
                      modifiers={[
                        buttonStyle("borderless"),
                        frame({ height: 40, width: 40 }),
                        background("#3d3d3fff"),
                        cornerRadius(20),
                      ]}
                      onPress={() => setSelectedIcon(icon)}
                    >
                      <Image
                        systemName={icon}
                        size={20}
                        modifiers={[tint("#ffffff")]}
                      />
                    </Button>
                  </ZStack>
                </React.Fragment>
              ))}
            </HStack>
          ))}
        </VStack>
      </Section>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
