import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Modal, TextInput, Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTerminal } from '../hooks/useTerminal';

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  bg:          '#0e0e0e',
  surface:     '#131313',
  surfaceHigh: '#20201f',
  primary:     '#52fd2e',
  onPrimary:   '#0e5b00',
  muted:       '#adaaaa',
  outline:     '#484847',
  error:       '#ff7351',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY   = '@cognifycl/snippets';
const EMPTY_FORM    = { label: '', command: '' };

const DEFAULT_SNIPPETS = [
  { id: '1', label: 'System Update',  command: 'sudo apt update && sudo apt upgrade -y' },
  { id: '2', label: 'Check Logs',     command: 'tail -f /var/log/syslog' },
  { id: '3', label: 'Docker Status',  command: 'docker ps -a' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatId = (idx) => `ID: 0X${String(idx + 1).padStart(3, '0')}`;

// ─── Main component ───────────────────────────────────────────────────────────
export default function SnippetsScreen() {
  const insets = useSafeAreaInsets();
  const { sendInput, ws, logs } = useTerminal();

  const [snippets,       setSnippets]       = useState([]);
  const [modalVisible,   setModalVisible]   = useState(false);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [editingSnippet, setEditingSnippet] = useState(null);
  const [snackVisible,   setSnackVisible]   = useState(false);
  const [snackMessage,   setSnackMessage]   = useState('');

  // Snackbar auto-hide
  useEffect(() => {
    if (!snackVisible) return;
    const t = setTimeout(() => setSnackVisible(false), 1500);
    return () => clearTimeout(t);
  }, [snackVisible]);

  useEffect(() => { loadSnippets(); }, []);

  // ── AsyncStorage ──────────────────────────────────────────────────────────
  const loadSnippets = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        setSnippets(JSON.parse(data));
      } else {
        setSnippets(DEFAULT_SNIPPETS);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SNIPPETS));
      }
    } catch (_) {
      setSnippets(DEFAULT_SNIPPETS);
    }
  };

  const persist = async (updated) => {
    setSnippets(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.label.trim() || !form.command.trim()) return;
    if (editingSnippet) {
      const updated = snippets.map(s =>
        s.id === editingSnippet.id
          ? { ...s, label: form.label.trim(), command: form.command.trim() }
          : s
      );
      await persist(updated);
    } else {
      const newSnippet = {
        id: Date.now().toString(),
        label: form.label.trim(),
        command: form.command.trim(),
      };
      await persist([...snippets, newSnippet]);
    }
    closeModal();
  };

  const handleEdit = (snippet) => {
    setEditingSnippet(snippet);
    setForm({ label: snippet.label, command: snippet.command });
    setModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTarget) {
      await persist(snippets.filter(s => s.id !== deleteTarget));
      setDeleteTarget(null);
    }
  };

  const handleExecute = (snippet) => {
    setSnackMessage(`EXEC: ${snippet.label}`);
    setSnackVisible(true);
    sendInput(snippet.command + '\n');
  };

  const openAddModal = () => {
    setEditingSnippet(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingSnippet(null);
    setForm(EMPTY_FORM);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isConnected   = !!ws;
  const lastLog       = logs && logs.length > 0 ? logs[logs.length - 1] : null;
  const terminalLine  = lastLog
    ? (typeof lastLog === 'string' ? lastLog : lastLog.text ?? lastLog.message ?? JSON.stringify(lastLog))
    : 'No output yet.';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>

      {/* ── Edit / Add Modal ─────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center', paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.outline,
            padding: 20, borderRadius: 4,
          }}>
            {/* Modal header */}
            <Text style={{
              color: C.primary, fontWeight: '700', fontSize: 14,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
            }}>
              {editingSnippet ? '// EDIT_SNIPPET' : '// NEW_SNIPPET'}
            </Text>
            <View style={{ height: 1, backgroundColor: C.outline, marginBottom: 16 }} />

            <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
              Label
            </Text>
            <TextInput
              value={form.label}
              onChangeText={(v) => setForm(f => ({ ...f, label: v }))}
              placeholder="e.g. Docker Status"
              placeholderTextColor={C.outline}
              style={{
                backgroundColor: C.bg, color: '#fff', borderWidth: 1,
                borderColor: C.outline, padding: 10, marginBottom: 14,
                fontFamily: 'monospace', fontSize: 13, borderRadius: 2,
              }}
            />

            <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
              Command
            </Text>
            <TextInput
              value={form.command}
              onChangeText={(v) => setForm(f => ({ ...f, command: v }))}
              placeholder="e.g. docker ps -a"
              placeholderTextColor={C.outline}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              style={{
                backgroundColor: C.bg, color: C.primary, borderWidth: 1,
                borderColor: C.outline, padding: 10, marginBottom: 20,
                fontFamily: 'monospace', fontSize: 12, borderRadius: 2, minHeight: 60,
              }}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={closeModal}
                style={{
                  borderWidth: 1, borderColor: C.outline,
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 2,
                }}
              >
                <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={!form.label.trim() || !form.command.trim()}
                style={{
                  backgroundColor: (!form.label.trim() || !form.command.trim()) ? C.outline : C.primary,
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 2,
                }}
              >
                <Text style={{
                  color: (!form.label.trim() || !form.command.trim()) ? C.muted : C.onPrimary,
                  fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold',
                }}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
          justifyContent: 'center', paddingHorizontal: 20,
        }}>
          <View style={{
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.error,
            padding: 20, borderRadius: 4,
          }}>
            <Text style={{
              color: C.error, fontWeight: '700', fontSize: 13,
              letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8,
            }}>
              // DELETE_NODE
            </Text>
            <Text style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
              Remove this snippet permanently?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setDeleteTarget(null)}
                style={{
                  borderWidth: 1, borderColor: C.outline,
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 2,
                }}
              >
                <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={{
                  backgroundColor: C.error,
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Screen body ───────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: insets.bottom + 96, // clear terminal strip + tab bar
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Page header */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 22, letterSpacing: -0.5 }}>
              SNIPS_LIBRARY
            </Text>
            <View style={{
              backgroundColor: C.primary,
              paddingHorizontal: 6, paddingVertical: 2, borderRadius: 2,
            }}>
              <Text style={{
                color: C.onPrimary, fontSize: 9, fontWeight: 'bold',
                textTransform: 'uppercase',
              }}>
                {snippets.length} ACTIVE_NODES
              </Text>
            </View>
          </View>

          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
            Execute frequently used command sequences directly to your active terminal session.
          </Text>

          {/* Green underline accent */}
          <View style={{ height: 2, backgroundColor: C.primary, width: 40, marginTop: 8 }} />
        </View>

        {/* Snippet cards */}
        {snippets.map((snippet, idx) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            idx={idx}
            isFirst={idx === 0}
            isConnected={isConnected}
            onEdit={handleEdit}
            onDelete={(id) => setDeleteTarget(id)}
            onExecute={handleExecute}
          />
        ))}

        {/* NEW_SNIPPET card */}
        <TouchableOpacity
          onPress={openAddModal}
          style={{
            borderWidth: 1, borderStyle: 'dashed', borderColor: C.outline,
            borderRadius: 4, padding: 24,
            alignItems: 'center', justifyContent: 'center',
            marginTop: 4,
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="plus" size={28} color={C.outline} />
          <Text style={{
            color: C.outline, fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', fontWeight: 'bold', marginTop: 6,
          }}>
            NEW_SNIPPET
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Terminal output strip (fixed bottom) ─────────────────────────── */}
      <View style={{
        position: 'absolute',
        bottom: insets.bottom,
        left: 0, right: 0,
        height: 80,
        backgroundColor: '#000',
        borderTopWidth: 1,
        borderTopColor: C.outline,
        paddingHorizontal: 12,
        justifyContent: 'center',
      }}>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }} numberOfLines={2}>
          <Text style={{ color: C.primary }}>user@kinetic:~$ </Text>
          <Text style={{ color: C.muted }}>{terminalLine}</Text>
        </Text>
      </View>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      {snackVisible && (
        <View style={{
          position: 'absolute',
          bottom: insets.bottom + 88,
          left: 16, right: 16,
          backgroundColor: C.surfaceHigh,
          borderLeftWidth: 3, borderLeftColor: C.primary,
          padding: 12, borderRadius: 2,
        }}>
          <Text style={{ color: C.primary, fontFamily: 'monospace', fontSize: 12 }}>
            {snackMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── SnippetCard ──────────────────────────────────────────────────────────────
function SnippetCard({ snippet, idx, isFirst, isConnected, onEdit, onDelete, onExecute }) {
  const execConnected = isConnected;

  return (
    <View style={{
      backgroundColor: C.surface,
      borderLeftWidth: 2,
      borderLeftColor: isFirst ? C.primary : C.outline,
      borderRadius: 4,
      padding: 14,
      marginBottom: 12,
    }}>
      {/* Top row: ID + action icons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ color: C.muted, fontSize: 9, fontFamily: 'monospace', letterSpacing: 1 }}>
          {formatId(idx)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TouchableOpacity onPress={() => onEdit(snippet)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="pencil-outline" size={16} color={C.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(snippet.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 10 }}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Label */}
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {snippet.label}
      </Text>

      {/* Command row */}
      <View style={{ backgroundColor: C.bg, padding: 8, marginVertical: 8, borderRadius: 2 }}>
        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }} numberOfLines={2}>
          {'_ '}{snippet.command}
        </Text>
      </View>

      {/* Execute button */}
      <TouchableOpacity
        onPress={() => onExecute(snippet)}
        style={
          execConnected
            ? {
                backgroundColor: C.primary,
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 2, alignSelf: 'flex-start',
              }
            : {
                borderWidth: 1, borderColor: C.outline,
                backgroundColor: 'transparent',
                paddingHorizontal: 16, paddingVertical: 8,
                borderRadius: 2, alignSelf: 'flex-start',
              }
        }
        activeOpacity={0.75}
      >
        <Text style={{
          color: execConnected ? C.onPrimary : C.muted,
          fontSize: 10, letterSpacing: 2,
          textTransform: 'uppercase', fontWeight: 'bold',
        }}>
          EXECUTE
        </Text>
      </TouchableOpacity>
    </View>
  );
}
