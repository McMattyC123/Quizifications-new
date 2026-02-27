import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Switch } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAuth } from '../contexts/AuthContext';
import { api, ApiSettings } from '../lib/api';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#2a2a2e',
  error: '#ef4444',
};

export default function SettingsScreen() {
  const { user, signOut, deleteAccount } = useAuth();
  const [settings, setSettings] = useState<ApiSettings | null>(null);
  const [intervalValue, setIntervalValue] = useState(5);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      setIntervalValue(data.quiz_interval_minutes ?? data.quiz_frequency ?? 5);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      const updated = await api.updateSettings({ notifications_enabled: enabled });
      setSettings(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const updateQuizInterval = async (value: number) => {
    try {
      const updated = await api.updateSettings({ quiz_interval_minutes: value });
      setSettings(updated);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quiz interval');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteAccount();
            if (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openURL = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{user?.displayName || '—'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.cardRow}>
          <Text style={styles.cardText}>Quiz Notifications</Text>
          <Switch
            value={settings?.notifications_enabled ?? true}
            onValueChange={toggleNotifications}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.text}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quiz Interval</Text>
        <View style={styles.card}>
          <Text style={styles.intervalLabel}>Quiz every {intervalValue} minute{intervalValue !== 1 ? 's' : ''}</Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={10}
            step={1}
            value={intervalValue}
            onValueChange={setIntervalValue}
            onSlidingComplete={updateQuizInterval}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.border}
            thumbTintColor={COLORS.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>5 min</Text>
            <Text style={styles.sliderLabelText}>10 min</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <TouchableOpacity style={styles.card}>
          <Text style={styles.cardText}>Restore Purchases</Text>
        </TouchableOpacity>
        <Text style={styles.helpText}>
          To cancel: Settings → [Your Name] → Subscriptions → Quizifications
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.card} onPress={() => openURL('https://quizifications.com/privacy.html')}>
          <Text style={styles.cardText}>Privacy Policy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => openURL('https://quizifications.com/terms.html')}>
          <Text style={styles.cardText}>Terms of Service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.card} onPress={() => openURL('mailto:matt@quizifications.com')}>
          <Text style={styles.cardText}>Contact Support</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete Account</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted, marginBottom: 8, marginLeft: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardRow: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
  value: { fontSize: 16, color: COLORS.text },
  cardText: { fontSize: 16, color: COLORS.text },
  helpText: { fontSize: 12, color: COLORS.textMuted, marginTop: 4, marginLeft: 4 },
  intervalLabel: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginBottom: 12 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabelText: { fontSize: 12, color: COLORS.textMuted },
  signOutBtn: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  deleteText: { fontSize: 16, color: COLORS.error, fontWeight: '600' },
  version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 24 },
});
