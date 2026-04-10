import { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import ActionTimer from "./ActionTimer";
import type { VoteLogPayload, VoteStatusPayload } from "../../types/online";

interface Props {
  alivePlayers: { id: string; name: string }[];
  myPlayerId: string;
  onVote: (targetId: string | null) => void;
  voteLogs: VoteLogPayload[];
  voteStatus: VoteStatusPayload | null;
}

export default function DayVoteView({ alivePlayers, myPlayerId, onVote, voteLogs, voteStatus }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const logsRef = useRef<ScrollView>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsRef.current?.scrollToEnd({ animated: true });
  }, [voteLogs.length]);

  // Track own vote locally so it shows immediately without waiting for broadcast
  const ownLogRef = useRef<VoteLogPayload | null>(null);

  const addOwnLog = (targetId: string | null) => {
    const myName = alivePlayers.find((p) => p.id === myPlayerId)?.name || "?";
    const targetName = targetId
      ? alivePlayers.find((p) => p.id === targetId)?.name || "?"
      : null;
    ownLogRef.current = { voter: myName, target: targetName };
  };

  const handleVote = () => {
    addOwnLog(selected);
    setVoted(true);
    onVote(selected);
  };

  const handleTimeout = () => {
    if (!voted) {
      addOwnLog(null);
      setVoted(true);
      onVote(null);
    }
  };

  const others = useMemo(
    () => alivePlayers.filter((p) => p.id !== myPlayerId),
    [alivePlayers, myPlayerId]
  );

  const statusText = voteStatus
    ? `${voteStatus.votedCount}/${voteStatus.totalVoters} votes`
    : null;

  // Merge own log at the front if not yet in server logs
  const displayLogs = useMemo(() => {
    if (!ownLogRef.current) return voteLogs;
    const alreadyInLogs = voteLogs.some((l) => l.voter === ownLogRef.current!.voter);
    if (alreadyInLogs) return voteLogs;
    return [ownLogRef.current, ...voteLogs];
  }, [voteLogs]);

  if (voted) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingTitle}>Vote enregistre</Text>
        {statusText && <Text style={styles.statusText}>{statusText}</Text>}
        <VoteLogs logs={displayLogs} scrollRef={logsRef} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vote</Text>
      <View style={styles.timerRow}>
        <ActionTimer seconds={15} onExpire={handleTimeout} />
        {statusText && <Text style={styles.statusText}>{statusText}</Text>}
      </View>
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.playerRow, selected === item.id && styles.selected]}
            onPress={() => setSelected(item.id)}
          >
            <Text style={[styles.playerName, selected === item.id && styles.selectedText]}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
      <VoteLogs logs={voteLogs} scrollRef={logsRef} />
      <View style={styles.actions}>
        <Pressable style={styles.voteButton} onPress={handleVote}>
          <Text style={styles.buttonText}>{selected ? "Voter" : "S'abstenir"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VoteLogs({ logs, scrollRef }: { logs: VoteLogPayload[]; scrollRef: React.RefObject<ScrollView | null> }) {
  if (logs.length === 0) return null;

  return (
    <View style={styles.logsContainer}>
      <ScrollView ref={scrollRef} style={styles.logsScroll} nestedScrollEnabled>
        {logs.map((log, i) => (
          <Text key={i} style={styles.logEntry}>
            {log.target
              ? `${log.voter} a vote contre ${log.target}`
              : `${log.voter} s'est abstenu`}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 8 },
  waitingTitle: { fontSize: 20, fontWeight: "bold", color: colors.primary, textAlign: "center", marginBottom: 8 },
  timerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 4 },
  statusText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 4 },
  list: { flex: 1, marginTop: 12 },
  playerRow: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, marginBottom: 8 },
  selected: { backgroundColor: colors.danger },
  playerName: { fontSize: 16, color: colors.text },
  selectedText: { color: colors.white },
  actions: { paddingTop: 12 },
  voteButton: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  buttonText: { color: colors.black, fontSize: 18, fontWeight: "bold" },
  logsContainer: {
    maxHeight: 120,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
  },
  logsScroll: { flex: 1 },
  logEntry: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
    fontStyle: "italic",
  },
});
