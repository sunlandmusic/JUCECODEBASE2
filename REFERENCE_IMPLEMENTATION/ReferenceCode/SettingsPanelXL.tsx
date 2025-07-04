import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image as ImageIcon, Ban } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { NoteName, MusicMode, InstrumentType, sharpToFlatMap } from '@/types/music';

// Add helper function for relative key calculation
const getRelativeKey = (currentKey: NoteName, currentMode: MusicMode): { key: NoteName, mode: MusicMode } | null => {
  if (currentMode !== 'major' && currentMode !== 'minor') return null;
  
  const notes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const currentIndex = notes.indexOf(currentKey);
  
  if (currentMode === 'minor') {
    // Going from minor to major: up 3 semitones
    const majorIndex = (currentIndex + 3) % 12;
    return { key: notes[majorIndex], mode: 'major' };
  } else {
    // Going from major to minor: down 3 semitones
    const minorIndex = (currentIndex + 9) % 12;
    return { key: notes[minorIndex], mode: 'minor' };
  }
};

const BASS_SEQUENCE = ['edit', '+1', '+2', '+3', '+4', '+5', '+6', '+7', '+8', '+9', '+10', '+11'];

interface SettingsPanelXLProps {
  onSkinPress?: () => void;
  onSkinLongPress?: () => void;
  onSavePress?: () => void;
  onSoundPress?: () => void;
  onKeyPress?: () => void;
  onKeyLongPress?: () => void;
  onModePress?: () => void;
  onModeLongPress?: () => void;
  onOctavePress?: () => void;
  onInversionPress?: () => void;
  selectedKey?: NoteName;
  selectedMode?: MusicMode;
  selectedOctave?: number;
  selectedInversion?: number;
  selectedSound?: InstrumentType;
  currentChord?: string;
  isSaving?: boolean;
  isSoundWindowSelected?: boolean;
  selectedControl?: string | null;
  abMemory?: { A: any | null; B: any | null };
  onABSave?: (slot: 'A' | 'B') => void;
  onABLoad?: (slot: 'A' | 'B') => void;
  onABClear?: (slot: 'A' | 'B') => void;
  onRelativeKeyChange?: (key: NoteName, mode: MusicMode) => void;
  onToggleFlats?: () => void;
  useFlats?: boolean;
  selectedBassOffset?: number | null;
  onBassPress?: () => void;
  onBassChange?: (offset: number | null) => void;
  currentBassOffset?: string;
  onBassOffsetChange?: (offset: string) => void;
  onBassExit?: () => void;
  onDisablePress?: () => void;
}

const formatInstrumentName = (name: InstrumentType): string => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function SettingsPanelXL({
  onSkinPress,
  onSkinLongPress,
  onSavePress,
  onSoundPress,
  onKeyPress,
  onKeyLongPress,
  onModePress,
  onModeLongPress,
  onOctavePress,
  onInversionPress,
  selectedKey = 'A#',
  selectedMode = 'free',
  selectedOctave = 0,
  selectedInversion = 0,
  selectedSound = 'balafon',
  currentChord = '',
  isSaving = false,
  isSoundWindowSelected = false,
  selectedControl = null,
  abMemory = { A: null, B: null },
  onABSave,
  onABLoad,
  onABClear,
  onRelativeKeyChange,
  onToggleFlats,
  useFlats = false,
  selectedBassOffset,
  onBassPress,
  onBassChange,
  currentBassOffset = 'BASS',
  onBassOffsetChange,
  onBassExit,
  onDisablePress,
}: SettingsPanelXLProps) {

  const isLongPressing = useRef(false);
  const longPressTimeout = useRef<any>(null);
  const longPressTriggered = useRef(false);

  const renderModeWithAlternateName = (mode: string) => {
    const upperMode = mode.toUpperCase();
    let mainText = '';
    let alternateName = '';
    
    switch (upperMode) {
      case 'OFF': 
        mainText = 'MODE';
        alternateName = 'OFF';
        break;
      case 'MAJOR': 
        mainText = 'MAJOR';
        alternateName = 'IONIAN';
        break;
      case 'MINOR': 
        mainText = 'MINOR';
        alternateName = 'AEOLIAN';
        break;
      case 'MIXOLYDIAN': 
        mainText = 'MIXO';
        alternateName = 'LYDIAN';
        break;
      case 'PHRYGIAN':
        mainText = 'PHRYG';
        alternateName = 'IAN';
        break;
      default: 
        mainText = upperMode;
        break;
    }

    return (
      <View style={styles.modeValueContainer}>
        {mainText && <Text style={styles.settingValue}>{mainText}</Text>}
        {alternateName && (
          <Text style={styles.alternateModeName}>{alternateName}</Text>
        )}
      </View>
    );
  };

  const SettingItem = ({ 
    label, 
    value, 
    onPress,
    onLongPress,
    isSelected = false
  }: { 
    label: string; 
    value: string | number; 
    onPress?: () => void;
    onLongPress?: () => void;
    isSelected?: boolean;
  }) => {
    const getChordFontSize = (chordName: string) => {
      const length = chordName.length;
      if (length <= 5) return 28;
      if (length <= 7) return 24;
      if (length <= 9) return 20;
      return 16;
    };

    const handleItemLongPress = () => {
      if (label === 'KEY') {
        if (selectedMode === 'free') {
          // In FREE mode, toggle between sharp and flat notation
          onToggleFlats?.();
        } else if (selectedMode === 'major' || selectedMode === 'minor') {
          // In major/minor modes, switch to relative key
          const relative = getRelativeKey(selectedKey as NoteName, selectedMode);
          if (relative && onRelativeKeyChange) {
            onRelativeKeyChange(relative.key, relative.mode);
          }
        }
      } else if (label === 'MODE' && selectedMode !== 'free') {
        // Toggle to FREE mode on long press
        onModeLongPress?.();
      }
      onLongPress?.();
    };

    return (
      <Pressable 
        style={[
          styles.settingItem,
          label === 'MODE' && styles.modeSettingItem,
          label === 'CHORD' && styles.chordDisplay,
          isSelected && styles.selectedSetting,
        ]}
        onPress={onPress}
        onLongPress={handleItemLongPress}
      >
        {(label !== 'MODE' || value.toString().toUpperCase() === 'OFF') && (
          <Text style={styles.settingLabel}>{label}</Text>
        )}
        {label === 'MODE' ? (
          renderModeWithAlternateName(value.toString())
        ) : (
          <Text style={[
            styles.settingValue,
            label === 'CHORD' && [
              styles.chordValue,
              { fontSize: getChordFontSize(value.toString()) }
            ]
          ]}>{value}</Text>
        )}
      </Pressable>
    );
  };

  const handleBassPressIn = () => {
    longPressTriggered.current = false;
    longPressTimeout.current = setTimeout(() => {
      longPressTriggered.current = true;
      onBassExit?.();
    }, 500); // 500ms for long press
  };

  const handleBassPressOut = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    if (!longPressTriggered.current) {
      // Treat as tap
      const currentIndex = BASS_SEQUENCE.indexOf(currentBassOffset);
      const nextIndex = (currentIndex + 1) % BASS_SEQUENCE.length;
      const newOffset = BASS_SEQUENCE[nextIndex];
      onBassOffsetChange?.(newOffset);
    }
  };

  return (
    <View style={styles.container}>
      {/* Skin button */}
      <Pressable 
        style={styles.skinButton} 
        onPress={onSkinPress}
        onLongPress={onSkinLongPress}
      >
        <ImageIcon size={24.2} color={colors.text} />
      </Pressable>

      {/* Bass clef button (toggle color and border) */}
      <Pressable
        style={[
          styles.bassClefButton,
          selectedControl === 'bass' && currentBassOffset !== 'clef' && styles.bassClefButtonActive
        ]}
        onPressIn={selectedControl === 'bass' ? handleBassPressIn : onBassPress}
        onPressOut={selectedControl === 'bass' ? handleBassPressOut : undefined}
      >
        {selectedControl === 'bass' ? (
          currentBassOffset === 'edit' ? (
            <Text style={[styles.bassClefButtonText, { color: '#FFA500' }]}>𝄢</Text>
          ) : currentBassOffset === 'clef' ? (
            <Text style={styles.bassClefButtonText}>𝄢</Text>
          ) : (
            <Text style={styles.bassOffsetText}>{currentBassOffset}</Text>
          )
        ) : (
          <Text style={styles.bassClefButtonText}>𝄢</Text>
        )}
      </Pressable>

      {/* Sound selection window */}
      <Pressable 
        style={[
          styles.soundWindow,
          isSoundWindowSelected && styles.soundWindowSelected
        ]}
        onPress={onSoundPress}
      >
        <Text style={styles.soundText}>{formatInstrumentName(selectedSound).toUpperCase()}</Text>
      </Pressable>

      {/* Settings Panel */}
      <View style={styles.settingsPanel}>
        <SettingItem 
          label="KEY" 
          value={selectedMode === 'free' && useFlats ? sharpToFlatMap[selectedKey] : selectedKey}
          onPress={onKeyPress}
          onLongPress={onKeyLongPress}
          isSelected={selectedControl === 'key'}
        />
        <SettingItem 
          label="MODE" 
          value={selectedMode}
          onPress={onModePress}
          onLongPress={() => onModeLongPress?.()}
          isSelected={selectedControl === 'mode'}
        />
        <SettingItem 
          label="OCT" 
          value={selectedOctave}
          onPress={onOctavePress}
          isSelected={selectedControl === 'octave'}
        />
        <SettingItem 
          label="INV" 
          value={selectedInversion}
          onPress={onInversionPress}
          isSelected={selectedControl === 'inversion'}
        />
        <View style={styles.chordDisplay}>
          <Text style={styles.chordLabel}>CHORD</Text>
          <Text style={[
            styles.chordValue,
            { fontSize: currentChord.length <= 5 ? 28 : 
                       currentChord.length <= 7 ? 24 : 
                       currentChord.length <= 9 ? 20 : 16 }
          ]}>
            {currentChord}
          </Text>
        </View>
      </View>

      {/* A and DISABLE (circle-slash) buttons */}
      <View style={styles.abButtonRow}>
        <Pressable
          style={[styles.abButton, abMemory.A ? styles.abButtonOccupied : null]}
          onPress={() => abMemory.A && onABLoad && onABLoad('A')}
          onLongPress={() => {
            if (abMemory.A) {
              onABClear && onABClear('A');
            } else {
              onABSave && onABSave('A');
            }
          }}
        >
          <Text style={styles.abButtonText}>A</Text>
        </Pressable>
        <Pressable
          style={[
            styles.abButton,
            selectedControl === 'disable' && styles.selectedSetting,
            { marginLeft: -10 }
          ]}
          onPress={onDisablePress}
        >
          <Ban size={24} color="#888" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  skinButton: {
    position: 'absolute',
    top: 29,
    left: 48,
    width: 38.7,
    height: 38.7,
    borderRadius: 19.35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  abButtonRow: {
    position: 'absolute',
    top: 22,
    left: 95,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  abButton: {
    width: 32,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  abButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  soundWindow: {
    position: 'absolute',
    left: 213,
    top: 22,
    width: 132,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002,
    marginRight: 8,
  },
  soundWindowSelected: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
  },
  soundText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  settingsPanel: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
    paddingHorizontal: 5,
    height: 67,
    alignItems: 'center',
    position: 'absolute',
    top: 12,
    left: 344,
    width: 'auto',
    zIndex: 3,
  },
  settingItem: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'transparent',
    width: 58,
    marginRight: 7,
  },
  modeSettingItem: {
    width: 102,
    minWidth: 0,
    padding: 2,
    margin: 0,
    height: 67,
    marginRight: 7,
  },
  settingLabel: {
    color: colors.textSecondary,
    fontSize: 13.8,
    fontWeight: '400',
    marginBottom: 2,
  },
  settingValue: {
    color: colors.text,
    fontSize: 18.4,
    fontWeight: '400',
  },
  chordDisplay: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    height: 67,
    justifyContent: 'center',
    width: 102,
  },
  chordLabel: {
    color: colors.textSecondary,
    fontSize: 13.8,
    fontWeight: '400',
    marginBottom: 2,
  },
  chordValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '400',
    textAlign: 'center',
  },
  modeValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
    margin: 0,
    width: '100%',
  },
  alternateModeName: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 0,
    letterSpacing: 0.5,
  },
  selectedSetting: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'rgba(100, 100, 100, 0.8)',
    borderWidth: 2,
  },
  abButtonOccupied: {
    borderColor: 'rgba(100, 100, 100, 0.5)',
    borderWidth: 3,
  },
  bassClefButton: {
    position: 'absolute',
    top: 22,
    left: 167,
    width: 40,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'rgba(255,255,255,0.2)',
    zIndex: 20,
  },
  bassClefButtonText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 6,
  },
  bassOffsetText: {
    color: '#FFF',
    fontSize: 18.4,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 50,
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginTop: -6,
  },
  bassClefButtonActive: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
}); 