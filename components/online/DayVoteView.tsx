import { useState, useMemo, useRef, useEffect } from "react";
import { View, Text, FlatList, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing, radii } from "../../theme/spacing";
import ActionTimer from "./ActionTimer";
import GButton from "../GButton";
import GlassRow from "../GlassRow";
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
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>{"\u2714"}</Text>
        </View>
        <Text style={styles.doneTitle}>Vote enregistre</Text>
        {statusText && <Text style={styles.statusText}>{statusText}</Text>}
        <VoteLogs logs={displayLogs} scrollRef={logsRef} />
        <View style={styles.waitingRow}>
          <Text style={styles.waitingText}>En attente des autres joueurs...</Text>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: spacing.md }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.phase}>Jour</Text>
      <Text style={styles.title}>Vote du village</Text>
      <Text style={styles.instruction}>Qui le village elimine-t-il ?</Text>
      <View style={styles.timerRow}>
        <ActionTimer seconds={15} onExpire={handleTimeout} />
        {statusText && <Text style={styles.statusText}>{statusText}</Text>}
      </View>
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        style={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected === item.id;
          return (
            <GlassRow
              selected={isSelected}
              selectedColor={colors.danger}
              onPress={() => setSelected(item.id)}
            >
              <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
                <Text style={[styles.avatarText, isSelected && styles.avatarTextSelected]}>
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.optionName, isSelected && styles.optionNameSelected]}>
                {item.name}
              </Text>
            </GlassRow>
          );
        }}
      />
      <VoteLogs logs={voteLogs} scrollRef={logsRef} />
      <View style={styles.actions}>
        <GButton variant="danger" onPress={handleVote} disabled={!selected}>
          Voter
        </GButton>
        <Pressable style={styles.abstainBtn} onPress={() => { addOwnLog(null); setVoted(true); onVote(null); }}>
          <Text style={styles.abstainText}>S'abstenir</Text>
        </Pressable>
      </View>
    </View>
  );
}

function VoteLogs({ logs, scrollRef }: { logs: VoteLogPayload[]; scrollRef: React.RefObject<ScrollView | null> }) {
  if (logs.length === 0) return null;

  return (
    <View style={styles.logsContainer}>
      <Text style={styles.logsHeader}>Votes en cours</Text>
      <ScrollView ref={scrollRef} style={styles.logsScroll} nestedScrollEnabled>
        {logs.map((log, i) => (
          <View key={i} style={styles.logRow}>
            <Text style={styles.logEntry}>
              <Text style={styles.logVoter}>{log.voter}</Text>
              {log.target
                ? <Text> a vote contre <Text style={styles.logTarget}>{log.target}</Text></Text>
                : <Text style={styles.logAbstain}> s'est abstenu</Text>}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
  },
  phase: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.warm,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  instruction: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.md,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 4,
  },
  statusText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 1,
  },
  list: { flex: 1, marginTop: spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: "rgba(232,93,93,0.06)",
    borderWidth: 1,
    borderColor: "rgba(232,93,93,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSelected: {
    backgroundColor: "rgba(232,93,93,0.15)",
    borderColor: colors.danger,
  },
  avatarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.danger,
  },
  avatarTextSelected: {
    color: colors.white,
  },
  optionName: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.text,
  },
  optionNameSelected: {
    color: colors.white,
  },
  actions: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  abstainBtn: {
    borderWidth: 1,
    borderColor: "rgba(126,184,218,0.15)",
    borderRadius: radii.base,
    paddingVertical: 10,
    alignItems: "center",
  },
  abstainText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  // Done state
  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(93,217,166,0.1)",
    borderWidth: 2,
    borderColor: "rgba(93,217,166,0.3)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  checkMark: {
    fontSize: 24,
    color: colors.success,
  },
  doneTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  waitingRow: {
    alignItems: "center",
    marginTop: "auto",
    paddingTop: spacing.base,
  },
  waitingText: {
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 1,
  },
  // Vote logs
  logsContainer: {
    maxHeight: 140,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radii.base,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  logsHeader: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  logsScroll: { flex: 1 },
  logRow: {
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(126,184,218,0.1)",
  },
  logEntry: {
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontStyle: "italic",
  },
  logVoter: {
    color: colors.text,
    fontStyle: "normal",
    fontFamily: fonts.bodyMedium,
  },
  logTarget: {
    color: colors.danger,
    fontStyle: "normal",
    fontFamily: fonts.bodySemiBold,
  },
  logAbstain: {
    color: colors.textMuted,
    fontStyle: "normal",
  },
});
