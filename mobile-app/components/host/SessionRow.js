import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, MONO } from '../../theme/theme';

/**
 * @param {Object} props
 * @param {Object} props.session
 * @param {string} props.connectedSession
 * @param {Function} props.onPress
 */
export default function SessionRow({ session, connectedSession, onPress }) {
  const isActive = session.name === connectedSession;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 2,
        gap: 10,
      }}
    >
      <MaterialCommunityIcons
        name="console"
        size={16}
        color={isActive ? C.primary : C.muted}
      />
      <Text
        style={{
          fontFamily: MONO,
          fontSize: 13,
          color: isActive ? C.primary : C.muted,
          flex: 1,
        }}
      >
        {session.name}
      </Text>
      {session.attached && (
        <View
          style={{
            backgroundColor: C.primaryFaint,
            paddingHorizontal: 5,
            paddingVertical: 2,
            borderRadius: 2,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              color: C.primary,
              letterSpacing: 1,
              textTransform: 'uppercase',
              fontFamily: MONO,
            }}
          >
            ATT
          </Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={14} color={C.muted} />
    </TouchableOpacity>
  );
}
