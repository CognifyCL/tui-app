import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput as RNTextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Portal, Dialog, TextInput, Button } from 'react-native-paper';

import { useTerminal } from '../hooks/useTerminal';
import { C, MONO } from '../theme/theme';
import { CONNECTION_STATUS } from '../config/constants';
import { resolveHost } from '../utils/url';
import SectionHeader from '../components/ui/SectionHeader';
import HostCard from '../components/host/HostCard';
import QRScanner from '../components/host/QRScanner';

export default function HostsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    recentHosts,
    addHost,
    editHost,
    deleteHost,
    setServerIp,
    serverIp,
    status,
    reconnectAttempt,
  } = useTerminal();

  const [showScanner, setShowScanner] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIp, setFormIp] = useState('');
  const [formToken, setFormToken] = useState('');
  const [editingIp, setEditingIp] = useState(null); // null = add mode

  useEffect(() => {
    if (recentHosts.length === 0) {
      setShowScanner(true);
    }
  }, []);

  const resetForm = () => {
    setFormName('');
    setFormIp('');
    setFormToken('');
    setEditingIp(null);
  };

  const handleSubmit = () => {
    const trimmedInput = formIp.trim();
    if (!trimmedInput) return;

    // Use resolveHost to parse potential Magic Links
    const { httpUrl, token, id } = resolveHost(trimmedInput);
    const cleanIp = httpUrl.replace(/^https?:\/\//, '');
    
    const finalToken = token || formToken.trim();
    const finalName = formName.trim() || id || 'Remote Proxy';

    if (editingIp !== null) {
      editHost(editingIp, { name: finalName, ip: cleanIp, token: finalToken });
    } else {
      addHost({ name: finalName, ip: cleanIp, token: finalToken });
    }
    resetForm();
  };

  const handleStartEdit = (host) => {
    setFormName(host.name || '');
    setFormIp(host.ip);
    setFormToken(host.token || '');
    setEditingIp(host.ip);
  };

  const handleSelectHost = (ip) => {
    setServerIp(ip);
    navigation.goBack();
  };

  const handleQRScanned = ({ url, token, id }) => {
    // Clean URL from protocol
    const cleanIp = url.replace(/^https?:\/\//, '');
    addHost({ name: id, ip: cleanIp, token });
    setServerIp(cleanIp);
    setShowScanner(false);
    navigation.goBack();
  };

  const isEditing = editingIp !== null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingTop: insets.top + 10,
          paddingHorizontal: 14,
          paddingBottom: 10,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(72,72,71,0.2)'
        }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={{
            color: C.muted,
            fontWeight: '700',
            fontSize: 18,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: MONO,
          }}>
            MANAGE HOSTS
          </Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => setShowScanner(true)}>
            <MaterialCommunityIcons name="qrcode-scan" size={22} color={C.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 20 }}
        >
          {/* ADD / EDIT FORM */}
          <View
            style={{
              backgroundColor: C.surface,
              borderLeftWidth: 3,
              borderLeftColor: isEditing ? C.warn : C.primary,
              padding: 14,
              marginBottom: 24,
              gap: 10,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: isEditing ? C.warn : C.primary,
                marginBottom: 2,
                fontFamily: MONO,
              }}
            >
              {isEditing ? 'EDIT_EXISTING_HOST' : 'REGISTER_NEW_HOST'}
            </Text>

            <RNTextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="Alias (e.g. AWS_EDGE_01)"
              placeholderTextColor={C.outline}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: C.muted,
                backgroundColor: C.surfaceHigh,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: C.outline,
              }}
            />

            <RNTextInput
              value={formIp}
              onChangeText={setFormIp}
              placeholder="ENDPOINT_ADDRESS (IP:PORT)"
              placeholderTextColor={C.outline}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: C.muted,
                backgroundColor: C.surfaceHigh,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: C.outline,
              }}
            />

            <RNTextInput
              value={formToken}
              onChangeText={setFormToken}
              placeholder="SECURITY_TOKEN (AUTH)"
              placeholderTextColor={C.outline}
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                fontFamily: MONO,
                fontSize: 13,
                color: C.muted,
                backgroundColor: C.surfaceHigh,
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderWidth: 1,
                borderColor: C.outline,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={handleSubmit}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  backgroundColor: isEditing ? C.warn : C.primary,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    fontWeight: '700',
                    letterSpacing: 2,
                    color: C.bg,
                    textTransform: 'uppercase',
                  }}
                >
                  {isEditing ? 'SAVE_CHANGES' : 'COMMIT_HOST'}
                </Text>
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  onPress={resetForm}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderWidth: 1,
                    borderColor: C.outline,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: MONO,
                      fontSize: 11,
                      letterSpacing: 1,
                      color: C.muted,
                    }}
                  >
                    ABORT
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* HOST LIST */}
          <SectionHeader title="SAVED_HOSTS" subtitle="./known_hosts" />

          {recentHosts.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <MaterialCommunityIcons name="server-off" size={48} color={C.muted} style={{ opacity: 0.3 }} />
              <Text
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  color: C.muted,
                  opacity: 0.4,
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                {'// NO_HOSTS_DETECTED\n// SCAN_QR_OR_MANUAL_ENTRY'}
              </Text>
            </View>
          ) : (
            recentHosts.map((host) => (
              <HostCard
                key={host.ip}
                serverIp={host.ip}
                hostName={host.name}
                isActive={host.ip === serverIp}
                status={host.ip === serverIp ? status : CONNECTION_STATUS.DISCONNECTED}
                reconnectAttempt={host.ip === serverIp ? reconnectAttempt : 0}
                isSimplified={false}
                onConnect={() => handleSelectHost(host.ip)}
                onEditPress={() => handleStartEdit(host)}
                onDeletePress={() => deleteHost(host.ip)}
              />
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <QRScanner
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onScanned={handleQRScanned}
      />
    </View>
  );
}
