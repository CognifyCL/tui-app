import React from 'react';
import { View, Text } from 'react-native';
import { C, MONO } from '../../theme/theme';

/**
 * @param {Object} props
 * @param {Array} [props.logs]
 */
export default function LogStrip({ logs = [] }) {
  const last3 = logs.slice(-3);

  const levelStyle = (level) => {
    if (level === 'error') return { color: C.error };
    if (level === 'warn') return { color: C.warn };
    return { color: C.primary };
  };

  const levelPrefix = (level) => {
    if (level === 'error') return '[ERR]';
    if (level === 'warn') return '[WARN]';
    return '[OK]';
  };

  return (
    <View
      style={{
        backgroundColor: C.bg,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: C.outlineFaint,
      }}
    >
      {last3.length === 0 ? (
        <Text
          style={{
            fontFamily: MONO,
            fontSize: 11,
            color: C.muted,
            opacity: 0.4,
          }}
        >
          {'// no log entries'}
        </Text>
      ) : (
        last3.map((entry, idx) => (
          <View key={idx} style={{ flexDirection: 'row', gap: 6 }}>
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 11,
                fontWeight: '700',
                ...levelStyle(entry.type),
              }}
            >
              {levelPrefix(entry.type)}
            </Text>
            <Text
              style={{
                fontFamily: MONO,
                fontSize: 11,
                color: C.muted,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {entry.message}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
