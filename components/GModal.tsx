import { ReactNode } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { colors } from "../theme/colors";
import { fonts } from "../theme/typography";
import { spacing } from "../theme/spacing";

interface GModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function GModal({ visible, onClose, title, children }: GModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />

        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 2,
    borderColor: colors.accent,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: "60%",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: colors.accent,
  },
  cornerTopLeft: {
    top: -1,
    left: -1,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 16,
  },
  cornerTopRight: {
    top: -1,
    right: -1,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 16,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.base,
  },
});
