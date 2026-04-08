import { Pressable, Text, StyleSheet } from "react-native";
import { useMusicContext } from "../context/MusicContext";

export default function MuteButton() {
  const { isMuted, toggleMute } = useMusicContext();

  return (
    <Pressable style={styles.button} onPress={toggleMute}>
      <Text style={styles.icon}>{isMuted ? "🔇" : "🔊"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 54,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  icon: {
    fontSize: 22,
  },
});
