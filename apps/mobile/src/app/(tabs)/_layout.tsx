import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  return (
    <NativeTabs>
      {/* <NativeTabs.BottomAccessory></NativeTabs.BottomAccessory> */}
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon
          sf={{ default: "house", selected: "house" }}
          md="house"
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scanner" disabled>
        <NativeTabs.Trigger.Icon
          sf={{ default: "scanner", selected: "scanner" }}
          md="scanner"
        />
        <NativeTabs.Trigger.Label>Scanner</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bookmarks" disabled>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bookmark", selected: "bookmark" }}
          md="bookmark"
        />
        <NativeTabs.Trigger.Label>Bookmarks</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
