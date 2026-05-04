import React from 'react';
import { View, Text } from 'react-native';
import { C, MONO } from '../../theme/theme';
import { CONNECTION_STATUS } from '../../config/constants';

/**
 * @param {Object} props
 * @param {string} [props.status]
 * @param {number} [props.reconnectAttempt]
 * @param {Array} [props.sessions]
 */
export default function StatusDashboard({ status = CONNECTION_STATUS.DISCONNECTED, reconnectAttempt = 0, sessions = [] }) {
  const getStatusConfig = () => {
    switch (status) {
      case CONNECTION_STATUS.CONNECTED:
        return { label: 'UPLINK_STABLE', color: C.primary };
      case CONNECTION_STATUS.CONNECTING:
        return { label: 'CONNECTING...', color: C.warn };
      case CONNECTION_STATUS.RECONNECTING:
        return { label: `RETRYING (${reconnectAttempt})`, color: C.warn };
      case CONNECTION_STATUS.ERROR:
        return { label: 'UPLINK_ERROR', color: C.error };
      default:
        return { label: 'DISCONNECTED', color: C.muted };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
      {/* SYSTEM STATUS */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          borderLeftWidth: 2,
          borderLeftColor: statusConfig.color,
        }}
      >
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 6,
          }}
        >
          SYSTEM STATUS
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: statusConfig.color,
            }}
          />
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: statusConfig.color,
              fontWeight: '700',
            }}
          >
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* ACTIVE SESSIONS */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          marginLeft: 1,
        }}
      >
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 4,
          }}
        >
          ACTIVE SESSIONS
        </Text>
        <Text>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 20,
              color: C.primary,
              fontWeight: '700',
            }}
          >
            {sessions.length}
          </Text>
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 10,
              color: C.muted,
            }}
          >
            {' TOTAL'}
          </Text>
        </Text>
      </View>

      {/* LATENCY */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.surface,
          padding: 12,
          marginLeft: 1,
        }}
      >
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: C.muted,
            marginBottom: 4,
          }}
        >
          LATENCY
        </Text>
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 20,
            color: C.muted,
            fontWeight: '700',
          }}
        >
          —
        </Text>
      </View>
    </View>
  );
}
