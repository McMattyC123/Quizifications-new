import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const COLORS = {
  bg: '#0a0a0b',
  card: '#141416',
  primary: '#c8ff00',
  text: '#ffffff',
  textMuted: '#888888',
  border: '#2a2a2e',
};

export default function AddNoteScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets[0].base64) {
        setScanLoading(true);
        const text = await api.extractTextFromImage(result.assets[0].base64);
        setScanLoading(false);

        if (text) {
          setContent((prev) => (prev ? prev + '\n\n' + text : text));
          if (!title) setTitle('Scanned Notes');
        } else {
          Alert.alert('Error', 'Could not extract text from image');
        }
      }
    } catch (error) {
      setScanLoading(false);
      Alert.alert('Error', 'Failed to process image');
    }
  };

  const saveNote = async () => {
    if (!user || !title.trim() || !content.trim()) {
      Alert.alert('Error', 'Please add a title and content');
      return;
    }

    setLoading(true);

    try {
      const note = await api.createNote(title.trim(), content.trim());

      let questionCount = 0;
      try {
        const questions = await api.generateQuestions(note.id);
        questionCount = questions?.length || 0;
      } catch (err) {
        console.error('Error generating questions:', err);
      }

      Alert.alert('Success', `Created ${questionCount} quiz questions!`, [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        style={styles.titleInput}
        placeholder="Note Title"
        placeholderTextColor={COLORS.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        style={styles.contentInput}
        placeholder="Paste or type your notes here..."
        placeholderTextColor={COLORS.textMuted}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.scanButtons}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => pickImage(true)} disabled={scanLoading}>
          <Text style={styles.scanBtnText}>{scanLoading ? 'Scanning...' : 'Scan with Camera'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.scanBtn} onPress={() => pickImage(false)} disabled={scanLoading}>
          <Text style={styles.scanBtnText}>From Gallery</Text>
        </TouchableOpacity>
      </View>

      {scanLoading && <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />}

      <TouchableOpacity style={styles.saveBtn} onPress={saveNote} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={COLORS.bg} />
        ) : (
          <Text style={styles.saveBtnText}>Save & Generate Quiz</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20 },
  titleInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  contentInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    minHeight: 200,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scanButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  scanBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scanBtnText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  loader: { marginVertical: 16 },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { color: COLORS.bg, fontSize: 16, fontWeight: '700' },
});
