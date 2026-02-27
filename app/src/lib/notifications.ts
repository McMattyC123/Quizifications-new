import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('quiz', [
    { identifier: 'answer_a', buttonTitle: 'A', options: { opensAppToForeground: false } },
    { identifier: 'answer_b', buttonTitle: 'B', options: { opensAppToForeground: false } },
    { identifier: 'answer_c', buttonTitle: 'C', options: { opensAppToForeground: false } },
    { identifier: 'answer_d', buttonTitle: 'D', options: { opensAppToForeground: false } },
  ]);
}

const ACTION_TO_LETTER: Record<string, string> = {
  'answer_a': 'A',
  'answer_b': 'B',
  'answer_c': 'C',
  'answer_d': 'D',
};

export async function handleNotificationAnswer(response: Notifications.NotificationResponse): Promise<void> {
  const actionId = response.actionIdentifier;
  const answerLetter = ACTION_TO_LETTER[actionId];

  if (!answerLetter) {
    return;
  }

  const data = response.notification.request.content.data;
  const questionId = data?.questionId;

  if (!questionId) {
    return;
  }

  try {
    await api.submitNotificationAnswer(Number(questionId), answerLetter);
  } catch (error) {
    console.error('Failed to submit notification answer:', error);
  }
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api.updatePushToken(token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('quiz', {
        name: 'Quiz Notifications',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export interface QuizQuestion {
  id: string;
  question: string;
  answers: string[];
  correctIndex: number;
  sourceName: string;
}

export async function scheduleQuizNotification(question: QuizQuestion, delayMinutes: number): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Quiz Time!',
      body: question.question,
      data: {
        questionId: question.id,
        question: question.question,
        answers: question.answers,
        correctIndex: question.correctIndex,
      },
      categoryIdentifier: 'quiz',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: delayMinutes * 60,
    },
  });
  return identifier;
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function setupNotificationListeners(
  onReceived: (n: Notifications.Notification) => void,
  onResponse: (r: Notifications.NotificationResponse) => void
) {
  const sub1 = Notifications.addNotificationReceivedListener(onReceived);
  const sub2 = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => {
    sub1.remove();
    sub2.remove();
  };
}
