import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';

/**
 * LogViewer Component
 * Displays a terminal-style modal with the logs.
 */
const LogViewer = ({ isVisible, logs, onClose, onClear, embedded = false }) => {
  const listRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new logs are added
    if (logs.length > 0 && listRef.current) {
      // Small delay to ensure the list has rendered the new item
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [logs]);

  const renderItem = ({ item }) => {
    const typeStyle = styles[`log_${item.type}`] || styles.log_info;
    const timestamp = new Date(item.timestamp).toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return (
      <View style={styles.logItem}>
        <Text style={styles.timestamp}>[{timestamp}]</Text>
        <Text style={[styles.logText, typeStyle]}>{item.message}</Text>
      </View>
    );
  };

  const content = (
    <View style={[styles.container, embedded && styles.embeddedContainer]}>
      {!embedded && (
        <View style={styles.header}>
          <Text style={styles.title}>📜 Logs</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={onClear} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <FlatList
        ref={listRef}
        data={logs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
    </View>
  );

  if (embedded) {
    return content;
  }

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <SafeAreaView style={styles.modalOverlay}>
        {content}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  container: {
    flex: 1,
    margin: 10,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  embeddedContainer: {
    margin: 0,
    borderRadius: 0,
    borderWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  clearButton: {
    marginRight: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f44',
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 10,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginRight: 6,
  },
  logText: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  log_info: { color: '#ccc' },
  log_error: { color: '#f55' },
  log_debug: { color: '#888' },
  log_success: { color: '#5f5' },
});

export default LogViewer;
