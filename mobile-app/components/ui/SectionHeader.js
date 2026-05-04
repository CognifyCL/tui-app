import React from 'react';
import { View, Text } from 'react-native';
import { C, MONO } from '../../theme/theme';

/**
 * @param {Object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {React.ReactNode} [props.rightElement]
 */
export default function SectionHeader({ title, subtitle, rightElement }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 8,
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: C.outlineFaint,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: MONO,
            fontWeight: '700',
            fontSize: 22,
            letterSpacing: -0.5,
            textTransform: 'uppercase',
            color: C.primary,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: C.muted,
              opacity: 0.7,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View>
          {rightElement}
        </View>
      )}
    </View>
  );
}
