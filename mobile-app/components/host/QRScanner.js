import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, MONO } from '../../theme/theme';
import { useQRScanner } from '../../hooks/useQRScanner';

/**
 * @param {Object} props
 * @param {boolean} props.visible
 * @param {Function} props.onClose
 * @param {Function} props.onScanned
 */
export default function QRScanner({ visible, onClose, onScanned }) {
  const {
    permission,
    requestPermission,
    scanned,
    handleBarCodeScanned,
  } = useQRScanner({ visible, onScanned });

  if (!visible) return null;

  if (!permission || !permission.granted) {
    return (
      <Modal visible={visible} animationType="fade" transparent={false} onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialCommunityIcons name="camera-off" size={64} color={C.muted} />
          <Text style={{ color: C.text, fontFamily: MONO, fontSize: 14, textAlign: 'center', marginTop: 20, marginBottom: 30 }}>
            CAMERA PERMISSION IS REQUIRED TO SCAN QR CODES
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            style={{ backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 }}
          >
            <Text style={{ color: C.bg, fontWeight: '700', fontFamily: MONO }}>GRANT PERMISSION</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
            <Text style={{ color: C.muted, fontFamily: MONO }}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        />
        
        {/* Overlay */}
        <View style={StyleSheet.absoluteFill}>
          <View style={{ flex: 1, backgroundColor: C.overlay }} />
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, backgroundColor: C.overlay }} />
            <View 
              style={{ 
                width: 250, 
                height: 250, 
                borderWidth: 2, 
                borderColor: C.primary, 
                backgroundColor: 'transparent',
                borderRadius: 12,
              }} 
            />
            <View style={{ flex: 1, backgroundColor: C.overlay }} />
          </View>
          <View style={{ flex: 1, backgroundColor: C.overlay, alignItems: 'center', paddingTop: 30 }}>
            <Text style={{ color: C.text, fontFamily: MONO, fontSize: 12, letterSpacing: 1 }}>
              ALIGN QR CODE WITHIN FRAME
            </Text>
          </View>
        </View>

        {/* Header/Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: C.outlineFaint,
          }}
        >
          <MaterialCommunityIcons name="close" size={24} color={C.text} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            bottom: 60,
            alignSelf: 'center',
            backgroundColor: C.overlayDark,
            paddingHorizontal: 30,
            paddingVertical: 12,
            borderRadius: 25,
            borderWidth: 1,
            borderColor: C.outline,
          }}
        >
          <Text style={{ color: C.text, fontFamily: MONO, fontSize: 12, fontWeight: '700' }}>CANCEL SCAN</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
