import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';

import { api } from '@/api/client.js';
import { buildDirectMessagesChannel } from '@saintrocky/realtime';
import { MAX_DIRECT_MESSAGE_LENGTH } from '@saintrocky/shared';
import { ChatBubble, IconButton, useTheme } from '@saintrocky/ui-native';

import { useRealtimeChannel } from '@/hooks/useRealtimeChannel.js';
import { createStyles } from '@/screens/SocialScreen/ChatScreen.styles.js';

export function ChatScreen({ route, auth }) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { counterpartyUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  const ownerEmail = auth.user?.email;
  const ownerUserId = auth.user?.id;
  const messagesChannel = ownerEmail ? buildDirectMessagesChannel(ownerEmail) : null;

  useRealtimeChannel(messagesChannel, {
    onEvent(payload) {
      const newMessage = payload?.message;
      if (
        newMessage &&
        (newMessage.sender?.id === counterpartyUserId ||
          newMessage.recipient?.id === counterpartyUserId)
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    }
  });

  const loadMessages = useCallback(async () => {
    try {
      const result = await api.messages.listMessages(counterpartyUserId);
      setMessages(result.messages || []);
      await api.messages.markRead(counterpartyUserId);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load messages.');
    }
  }, [counterpartyUserId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const sendMessage = useCallback(async () => {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      await api.messages.send({
        recipientUserId: counterpartyUserId,
        body
      });
      setDraft('');
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to send message.');
    }
    setSending(false);
  }, [draft, sending, counterpartyUserId]);

  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={reversedMessages}
        inverted
        keyExtractor={(item, index) => item.messageId || String(index)}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={item.sender?.id === ownerUserId}
          />
        )}
        contentContainerStyle={styles.messagesList}
      />

      <View style={styles.composerBar}>
        <TextInput
          style={styles.composerInput}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={theme.colors.muted}
          maxLength={MAX_DIRECT_MESSAGE_LENGTH}
          multiline
        />
        <IconButton
          name="send"
          color={draft.trim() ? theme.colors.accent : theme.colors.muted}
          onPress={sendMessage}
          disabled={!draft.trim() || sending}
          accessibilityLabel="Send message"
        />
      </View>
    </KeyboardAvoidingView>
  );
}
