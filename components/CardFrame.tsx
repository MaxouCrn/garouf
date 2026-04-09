import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";

interface CardFrameProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

function Corner({ position }: { position: "topLeft" | "topRight" | "bottomLeft" | "bottomRight" }) {
  const positionStyles = {
    topLeft: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 6 },
    topRight: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 6 },
    bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 6 },
    bottomRight: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 6 },
  } as const;

  return (
    <View
      style={[
        styles.corner,
        positionStyles[position],
      ]}
    />
  );
}

export default function CardFrame({ children, title, subtitle }: CardFrameProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Corner position="topLeft" />
        <Corner position="topRight" />
        <Corner position="bottomLeft" />
        <Corner position="bottomRight" />

        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            <View style={styles.separator} />
          </View>
        )}

        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 12,
  },
  card: {
    flex: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 20,
    backgroundColor: colors.background,
  },
  corner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: colors.primary,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.cinzelBold,
    fontSize: 24,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: fonts.cinzelRegular,
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
    alignSelf: "stretch",
    marginTop: 12,
  },
  content: {
    flex: 1,
  },
});
