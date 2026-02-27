import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiStats, ApiSettings, ApiNote } from '../lib/api';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#2a2a2e',
  success: '#10b981',
  error: '#ef4444',
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [statsData, settingsData, notesData] = await Promise.all([
        api.getStats(),
        api.getSettings(),
        api.getNotes(),
      ]);
      setStats(statsData);
      setSettings(settingsData);
      setNotes(notesData);

      const qCount = notesData.reduce((sum: number, note: ApiNote) => sum + (note.question_count || 0), 0);
      setTotalQuestions(qCount);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user, loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const hasNotes = notes.length > 0;
  const hasQuestions = totalQuestions > 0;
  const notificationsActive = settings?.notifications_enabled ?? false;
  const intervalMinutes = settings?.quiz_interval_minutes ?? settings?.quiz_frequency ?? 5;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      <Text style={styles.greeting}>Hey, {user?.displayName || 'there'}!</Text>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Setup Status</Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: notificationsActive ? COLORS.success : COLORS.error }]} />
          <Text style={styles.statusLabel}>Notifications</Text>
          <Text style={[styles.statusValue, { color: notificationsActive ? COLORS.success : COLORS.error }]}>
            {notificationsActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: hasNotes ? COLORS.success : COLORS.error }]} />
          <Text style={styles.statusLabel}>Notes</Text>
          <Text style={styles.statusValue}>{notes.length} note{notes.length !== 1 ? 's' : ''} active</Text>
        </View>

        <View style={styles.statusDivider} />

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: hasQuestions ? COLORS.success : COLORS.error }]} />
          <Text style={styles.statusLabel}>Questions</Text>
          <Text style={styles.statusValue}>{totalQuestions} question{totalQuestions !== 1 ? 's' : ''} ready</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.streak || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.accuracy || 0}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalAttempts || 0}</Text>
          <Text style={styles.statLabel}>Answered</Text>
        </View>
      </View>

      {!hasNotes && (
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.navigate('AddNote')}>
          <Text style={styles.ctaEmoji}>📝</Text>
          <Text style={styles.ctaTitle}>Add Your First Note</Text>
          <Text style={styles.ctaSubtitle}>Add study material to start receiving quiz notifications</Text>
        </TouchableOpacity>
      )}

      {hasNotes && !hasQuestions && (
        <View style={styles.statusMessage}>
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.statusMessageIcon} />
          <Text style={styles.statusMessageTitle}>Generating questions...</Text>
          <Text style={styles.statusMessageSubtitle}>Your notes are being processed. Questions will be ready shortly.</Text>
        </View>
      )}

      {hasNotes && hasQuestions && (
        <View style={styles.successMessage}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={styles.successTitle}>You're all set!</Text>
          <Text style={styles.successSubtitle}>
            Quiz notifications will arrive every {intervalMinutes} minutes. No need to keep the app open.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddNote')}>
        <Text style={styles.addButtonText}>+ Add Notes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' },
  greeting: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 24 },

  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  statusLabel: { fontSize: 15, color: COLORS.textMuted, flex: 1 },
  statusValue: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  statusDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  ctaButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ctaEmoji: { fontSize: 40, marginBottom: 12 },
  ctaTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  ctaSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  statusMessage: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusMessageIcon: { marginBottom: 12 },
  statusMessageTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  statusMessageSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  successMessage: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successEmoji: { fontSize: 40, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.success, marginBottom: 8 },
  successSubtitle: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },

  addButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButtonText: { color: COLORS.text, fontSize: 18, fontWeight: '600' },
});
