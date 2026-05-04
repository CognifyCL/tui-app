import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, MONO } from '../../theme/theme';
import { CONNECTION_STATUS } from '../../config/constants';
import SessionRow from './SessionRow';

/**
 * @param {Object} props
 * @param {string} props.serverIp
 * @param {Array} props.sessions
 * @param {string} props.connectedSession
 * @param {Function} props.onConnect
 * @param {Function} props.onSessionPress
 * @param {boolean} props.isSimplified
 * @param {Function} props.onManagePress
 * @param {Function} props.onDeletePress
 * @param {Function} props.onEditPress
 * @param {Function} props.onNoHostPress
 * @param {string} props.hostName
 * @param {boolean} props.isActive
 * @param {string} props.status
 * @param {number} props.reconnectAttempt
 */
export default function HostCard({ 
  serverIp, 
  sessions = [], 
  connectedSession, 
  onConnect, 
  onSessionPress, 
  isSimplified = true,
  onManagePress,
  onDeletePress,
  onEditPress,
  onNoHostPress,
  hostName,
  isActive = false,
  status = CONNECTION_STATUS.DISCONNECTED,
  reconnectAttempt = 0
}) {
  const getStatusConfig = () => {
    switch (status) {
      case CONNECTION_STATUS.CONNECTED:
        return { label: 'ACTIVE', color: C.primary, bg: C.primary, text: C.onPrimary };
      case CONNECTION_STATUS.CONNECTING:
        return { label: 'CONNECTING...', color: C.warn, bg: C.warn, text: C.bg };
      case CONNECTION_STATUS.RECONNECTING:
        return { label: `RETRYING (${reconnectAttempt})`, color: C.warn, bg: C.warn, text: C.bg };
      case CONNECTION_STATUS.ERROR:
        return { label: 'ERROR', color: C.error, bg: C.error, text: C.text };
      default:
        return { label: 'OFFLINE', color: C.muted, bg: C.muted, text: C.bg };
    }
  };

  const statusConfig = getStatusConfig();
  const isCurrentlyConnecting = status === CONNECTION_STATUS.CONNECTING || status === CONNECTION_STATUS.RECONNECTING;
  const isCurrentlyConnected = status === CONNECTION_STATUS.CONNECTED;

  if (!serverIp) {
    return (
      <View
        style={{
          backgroundColor: C.surface,
          padding: 24,
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text
          style={{
            color: C.muted,
            fontSize: 13,
            fontFamily: MONO,
          }}
        >
          No hosts configured
        </Text>
        {!isSimplified && onNoHostPress && (
          <TouchableOpacity
            onPress={onNoHostPress}
            activeOpacity={0.7}
            style={{
              backgroundColor: C.surfaceHigh,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: C.outline,
            }}
          >
            <Text
              style={{
                color: C.primary,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                fontFamily: MONO,
              }}
            >
              ADD HOST
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderLeftWidth: 4,
        borderLeftColor: isActive ? C.primary : C.outline,
        marginBottom: 12,
      }}
    >
      {/* Card header row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 14,
          gap: 12,
        }}
      >
        {/* Icon container */}
        <View
          style={{
            width: 36,
            height: 36,
            backgroundColor: isActive ? C.primaryFaint : C.mutedFaint,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
          }}
        >
          <MaterialCommunityIcons name="dns" size={20} color={isActive ? C.primary : C.muted} />
        </View>

        {/* Host info */}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={{
                fontWeight: '700',
                fontSize: 16,
                textTransform: 'uppercase',
                color: isActive ? statusConfig.color : C.text,
                fontFamily: MONO,
                letterSpacing: 0.5,
              }}
            >
              {hostName || serverIp.split(':')[0]}
            </Text>
            {isActive && (
              <View
                style={{
                  backgroundColor: statusConfig.bg,
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 2,
                }}
              >
                <Text
                  style={{
                    color: statusConfig.text,
                    fontSize: 8,
                    fontWeight: '700',
                    fontFamily: MONO,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {statusConfig.label}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: C.muted,
            }}
          >
            {serverIp}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={{ gap: 6 }}>
          {onConnect && !isCurrentlyConnected && (
            <TouchableOpacity
              onPress={onConnect}
              disabled={isCurrentlyConnecting}
              activeOpacity={0.7}
              style={{
                backgroundColor: C.surfaceHigh,
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderWidth: 1,
                borderColor: C.outline,
                opacity: isCurrentlyConnecting ? 0.5 : 1
              }}
            >
              <Text
                style={{
                  color: isCurrentlyConnecting ? C.muted : C.primary,
                  fontSize: 10,
                  fontFamily: MONO,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                }}
              >
                {isCurrentlyConnecting ? 'WAIT...' : 'CONNECT'}
              </Text>
            </TouchableOpacity>
          )}
          {!isSimplified && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {onEditPress && (
                <TouchableOpacity
                  onPress={onEditPress}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: C.surfaceHigh,
                    padding: 6,
                    borderWidth: 1,
                    borderColor: C.outlineFaint,
                  }}
                >
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={C.muted} />
                </TouchableOpacity>
              )}
              {onDeletePress && (
                <TouchableOpacity
                  onPress={onDeletePress}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: C.surfaceHigh,
                    padding: 6,
                    borderWidth: 1,
                    borderColor: C.outlineFaint,
                  }}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={C.error} />
                </TouchableOpacity>
              )}
              {onManagePress && (
                <TouchableOpacity
                  onPress={onManagePress}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: C.surfaceHigh,
                    paddingHorizontal: 8,
                    paddingVertical: 6,
                    borderWidth: 1,
                    borderColor: C.outlineFaint,
                  }}
                >
                  <Text style={{ color: C.muted, fontSize: 9, fontFamily: MONO, letterSpacing: 1, textTransform: 'uppercase' }}>MANAGE</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Sessions section - only show if not simplified AND sessions exist, OR if specifically for active host */}
      {sessions.length > 0 && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          <Text
            style={{
              fontSize: 9,
              fontFamily: MONO,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: C.muted,
              opacity: 0.6,
              marginBottom: 8,
            }}
          >
            ATTACHED TMUX SESSIONS
          </Text>

          {sessions.map((s, idx) => (
            <SessionRow
              key={idx}
              session={s}
              connectedSession={connectedSession}
              onPress={() => onSessionPress(s.name)}
            />
          ))}
        </View>
      )}
    </View>
  );
}
