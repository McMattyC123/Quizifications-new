import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://a4eb0cc8-2b22-4d44-aeab-a63bdb9b6ad1-00-31pbv5x2qat5.picard.replit.dev';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface ApiUser {
  id: number;
  email: string;
  displayName: string;
  authProvider?: string;
}

export interface ApiNote {
  id: number;
  user_id: number;
  title: string;
  content: string;
  question_count: number;
  created_at: string;
}

export interface ApiQuestion {
  id: number;
  note_id: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  times_shown: number;
  times_correct: number;
}

export interface ApiStats {
  totalAttempts: number;
  correctCount: number;
  accuracy: number;
  streak: number;
  notesCount: number;
}

export interface ApiSettings {
  id: number;
  user_id: number;
  notifications_enabled: boolean;
  quiz_frequency: number;
  quiz_interval_minutes: number;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface AttemptResult {
  attempt: any;
  isCorrect: boolean;
  correctAnswer: string;
}

async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn('Failed to save token');
  }
}

async function removeToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  } catch {
    console.warn('Failed to remove token');
  }
}

async function saveUser(user: ApiUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    console.warn('Failed to save user');
  }
}

async function getSavedUser(): Promise<ApiUser | null> {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
}

async function handleAuthResponse(res: Response): Promise<{ user: ApiUser; token: string }> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  await setToken(data.token);
  await saveUser(data.user);
  return { user: data.user, token: data.token };
}

export const api = {
  getToken,
  getSavedUser,

  async register(email: string, password: string, displayName: string): Promise<{ user: ApiUser; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName }),
    });
    return handleAuthResponse(res);
  },

  async login(email: string, password: string): Promise<{ user: ApiUser; token: string }> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleAuthResponse(res);
  },

  async deleteAccount(): Promise<void> {
    const res = await authFetch('/api/auth/account', { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete account');
    }
    await removeToken();
  },

  async signOut(): Promise<void> {
    await removeToken();
  },

  async getNotes(): Promise<ApiNote[]> {
    const res = await authFetch('/api/notes');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get notes');
    }
    return res.json();
  },

  async createNote(title: string, content: string): Promise<ApiNote> {
    const res = await authFetch('/api/notes', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create note');
    }
    return res.json();
  },

  async deleteNote(noteId: number): Promise<void> {
    const res = await authFetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete note');
    }
  },

  async getQuestions(noteId: number): Promise<ApiQuestion[]> {
    const res = await authFetch(`/api/notes/${noteId}/questions`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get questions');
    }
    return res.json();
  },

  async generateQuestions(noteId: number): Promise<ApiQuestion[]> {
    const res = await authFetch(`/api/notes/${noteId}/generate-questions`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to generate questions');
    }
    return res.json();
  },

  async getNextQuestion(): Promise<ApiQuestion | null> {
    const res = await authFetch('/api/quiz/next');
    if (res.status === 404) return null;
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get question');
    }
    return res.json();
  },

  async submitAttempt(questionId: number, selectedAnswer: string): Promise<AttemptResult> {
    const res = await authFetch('/api/quiz/attempt', {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAnswer }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit attempt');
    }
    return res.json();
  },

  async submitNotificationAnswer(questionId: number, selectedAnswer: string): Promise<void> {
    const res = await authFetch('/api/quiz/notification-answer', {
      method: 'POST',
      body: JSON.stringify({ questionId, selectedAnswer }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit notification answer');
    }
  },

  async getStats(): Promise<ApiStats> {
    const res = await authFetch('/api/quiz/stats');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get stats');
    }
    return res.json();
  },

  async getSettings(): Promise<ApiSettings> {
    const res = await authFetch('/api/settings');
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to get settings');
    }
    return res.json();
  },

  async updateSettings(settings: Partial<ApiSettings>): Promise<ApiSettings> {
    const res = await authFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update settings');
    }
    return res.json();
  },

  async updatePushToken(pushToken: string): Promise<void> {
    const res = await authFetch('/api/settings/push-token', {
      method: 'PUT',
      body: JSON.stringify({ pushToken }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update push token');
    }
  },

  async extractTextFromImage(base64Image: string): Promise<string | null> {
    const res = await authFetch('/api/notes/ocr', {
      method: 'POST',
      body: JSON.stringify({ base64Image }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to extract text');
    }
    const data = await res.json();
    return data.text || null;
  },
};
