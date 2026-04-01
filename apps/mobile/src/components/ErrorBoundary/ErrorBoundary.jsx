import { Component } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@saintrocky/icons';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
        >
          <Icon name="alertTriangle" size={40} color="#ef4444" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <View style={styles.retryButton}>
            <Text style={styles.retryText} onPress={this.handleRetry}>
              TAP TO RETRY
            </Text>
          </View>
        </ScrollView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060a09'
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  title: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '900',
    color: '#f5faf7',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center'
  },
  message: {
    fontSize: 14,
    color: 'rgba(245,250,247,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24
  },
  retryText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#4ade80',
    textTransform: 'uppercase'
  }
});
