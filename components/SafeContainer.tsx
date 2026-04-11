import { Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import type { Edge } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  padHorizontal?: boolean;
  edges?: Edge[];
}

export default function SafeContainer({
  children,
  padHorizontal = true,
  edges = ["top", "bottom", "left", "right"],
}: Props) {
  return (
    <SafeAreaView
      edges={edges}
      mode="padding"
      style={[
        styles.container,
        padHorizontal && styles.padH,
        Platform.OS === "android" && styles.androidExtraBottom,
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padH: {
    paddingHorizontal: 20,
  },
  androidExtraBottom: {
    paddingBottom: 24,
  },
});
