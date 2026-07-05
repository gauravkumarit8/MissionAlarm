import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, stack: null };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true, error: error.message, stack: info.componentStack });
    console.error('APP CRASH:', error.message);
    console.error('STACK:', info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.container}>
          <Text style={s.title}>Crash caught!</Text>
          <Text style={s.error}>{this.state.error}</Text>
          <ScrollView style={s.scroll}>
            <Text style={s.stack}>{this.state.stack}</Text>
          </ScrollView>
          <TouchableOpacity style={s.btn}
            onPress={() => this.setState({ hasError: false, error: null, stack: null })}>
            <Text style={s.btnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a14', padding: 20, paddingTop: 60 },
  title: { fontSize: 20, fontWeight: '700', color: '#e74c3c', marginBottom: 10 },
  error: { fontSize: 14, color: '#fff', marginBottom: 16, padding: 10, backgroundColor: '#1a0a0a', borderRadius: 8 },
  scroll: { flex: 1, backgroundColor: '#151520', borderRadius: 8, padding: 10, marginBottom: 16 },
  stack: { fontSize: 11, color: '#888', fontFamily: 'monospace' },
  btn: { backgroundColor: '#1D9E75', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
