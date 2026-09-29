import { List } from "@/types";
import { Button, HStack, Image, Spacer, Text } from "@expo/ui/swift-ui";
import {
  background,
  cornerRadius,
  foregroundStyle,
  frame,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { Link } from "expo-router";

const ListRow = ({ list }: { list: List }) => {
  return (
    <Link
      href={{
        pathname: "/lists/[listSlug]",
        params: { listSlug: list.slug },
      }}
      asChild
    >
      <Button>
        <HStack
          alignment="center"
          spacing={16}
          modifiers={[frame({ height: 22 })]}
        >
          <Image
            systemName={list.icon as any}
            size={16}
            modifiers={[
              frame({ width: 32, height: 32 }),
              background(list.color),
              tint("#ffffff"),
              cornerRadius(16),
            ]}
          />
          <Text modifiers={[foregroundStyle("#ffffff")]}>{list.name}</Text>
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

export default ListRow;
