import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable, PanResponder } from 'react-native';
import { colors } from '@/constants/colors';
import { NoteName, MusicMode, Chord, ChordType, InstrumentType, sharpToFlatMap } from '@/types/music';
import { getScaleNotes, createChord } from '@/utils/chord-utils';
import { playChord, stopChord, playBassNote } from '@/utils/audio-utils';

// Full list of available chord types in preference order (for 'FREE' mode)
// Full list of available chord types in preference order (for 'free' mode)
const ALL_CHORD_TYPES: ChordType[] = [
  // Basic triads first
  'major', 'minor', 'dim', 'augmented', '5',
  
  // 7th chords
  'major7', 'M7', 'minor7', '7', 'dim7', 'm7b5', 'φ7', 'minorMajor7',
  
  // 9th chords
  'major9', 'minor9', '9', 'add9', '7b9', '7#9', 'dim9', 'aug9',
  
  // 11th & 13th chords
  '11', 'm11', 'major11', '13', '13sus', '13b9', 'm11b5',
  
  // Sus chords
  'sus2', 'sus4', '7sus', '7sus4', '9sus', '7sus2b9',
  
  // 6th chords
  '6', 'minor6', '69', 'm69',
  
  // Altered/special chords
  '7#11', '7b13', 'maj9#11', 'm9b5', '9#11', 
  'maj7#5', '7alt', '7b5', '7#5',
  'augmented7', 'augmentedMajor7',
  
  // Other section removed
];

interface PianoXLProps {
  onNoteSelect?: (note: string) => void;
  selectedKey: NoteName;
  mode: MusicMode;
  octave: number;
  inversion: number;
  selectedSound: InstrumentType;
  onChordChange?: (chord: Chord | null, buttonIndex?: number) => void;
  onScaleNotesChange?: (notes: NoteName[]) => void;
  useFlats?: boolean;  // New prop to control flat/sharp display
  selectedControl?: string | null;
  onBassPress?: (buttonIndex?: number) => void;
  activeBassKey?: NoteName | null;
  disabledKeys?: Set<NoteName>;
  disabledSlots?: { [note: string]: Set<number> };
  disableEditActive?: boolean;
  onDisableKey?: (note: NoteName) => void;
  onDisableSlot?: (note: NoteName, slot: number) => void;
  sizeText?: string;
  onSizePress?: () => void;
  onBassOffsetChange?: (slotKey: string, newOffset: string) => void;
  chordBassOffsets: Record<string, string>;
}

// Add helper function for bass note calculation
const getBassNote = (root: NoteName, bassOffset: string): string => {
  if (!bassOffset || bassOffset === 'BASS' || bassOffset === 'OFF') return '';
  
  const notes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const rootIndex = notes.indexOf(root);
  if (rootIndex === -1) return '';
  
  const offset = parseInt(bassOffset.replace(/[+\-]/, ''));
  const direction = bassOffset.startsWith('-') ? -1 : 1;
  const bassIndex = (rootIndex + (offset * direction) + 12) % 12;
  return `/${notes[bassIndex]}`;
};

// Add a type for the chord indices map
type ChordTypeIndicesMap = {
  [key: string]: number | { [buttonIndex: number]: number };
};

// Add VerticalFader component before PianoXL
const VerticalFader = ({ value, onValueChange }: { value: number; onValueChange: (value: number) => void }) => {
  const snapPoints = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
  const handleTap = () => {
    const currentIndex = snapPoints.findIndex(snap => Math.abs(snap - value) < 0.01);
    const nextIndex = (currentIndex + 1) % snapPoints.length;
    onValueChange(snapPoints[nextIndex]);
  };
  return (
    <Pressable onPress={handleTap} style={styles.faderContainer}>
      <View style={styles.faderTrack}>
        <View 
          style={[
            styles.faderHandle,
            { bottom: `${value * 100}%` }
          ]}
        />
      </View>
    </Pressable>
  );
};

export const PianoXL = forwardRef(function PianoXL({ 
  onNoteSelect,
  selectedKey,
  mode,
  octave = 0,
  inversion = -2,
  selectedSound = 'balafon',
  onChordChange,
  onScaleNotesChange,
  useFlats = false,  // Default to sharp notation
  selectedControl,
  onBassPress,
  activeBassKey,
  disabledKeys = new Set(),
  disabledSlots = {},
  disableEditActive = false,
  onDisableKey,
  onDisableSlot,
  sizeText = 'XL',
  onSizePress,
  onBassOffsetChange,
  chordBassOffsets,
}: PianoXLProps, ref) {
  // State
  const [scaleNotes, setScaleNotes] = useState<NoteName[]>([]);
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [lastPressedNote, setLastPressedNote] = useState<NoteName | null>(null);
  const [chordTypeIndices, setChordTypeIndices] = useState<ChordTypeIndicesMap>({});
  const [prevMode, setPrevMode] = useState<MusicMode>(mode);
  const [prevKey, setPrevKey] = useState<NoteName>(selectedKey);
  const [faderValue, setFaderValue] = useState(0.25);
  const [bassOffsets, setBassOffsets] = useState<Record<string, number>>({});
  const [lastPlayedChord, setLastPlayedChord] = useState<Chord | null>(null);
  const [bassMode, setBassMode] = useState<{ chord: Chord, offset: number } | null>(null);
  const [bassOffset, setBassOffset] = useState<number>(0); // 0 = root
  const [bassEditActive, setBassEditActive] = useState<boolean>(false);
  const [activeBassSlotKey, setActiveBassSlotKey] = useState<string | null>(null);

  // Track mode changes and update scales/chords accordingly
  useEffect(() => {
    if (selectedKey) {
      const allNotes: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      
      if (mode === 'free' && mode !== prevMode) {
        // When entering FREE mode:
        // 1. Make all notes available
        setScaleNotes(allNotes);
        onScaleNotesChange?.(allNotes);
        
        // 2. Get the notes that were NOT in the previous scale
        const prevScaleNotes = getScaleNotes(selectedKey, prevMode);
        const newlyAvailableNotes = allNotes.filter(note => !prevScaleNotes.includes(note));
        
        // 3. Only add major triads for newly available notes that don't have a type
        if (newlyAvailableNotes.length > 0) {
          const updatedIndices = { ...chordTypeIndices };
          newlyAvailableNotes.forEach(note => {
            if (updatedIndices[note] === undefined) {
              updatedIndices[note] = 0; // major triad
            }
          });
          setChordTypeIndices(updatedIndices);
        }
      } else if (prevMode === 'free' && mode !== 'free') {
        // When leaving FREE mode
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
        // Clear all chord types to start fresh in the new mode
        setChordTypeIndices({});
      } else if (mode !== prevMode) {
        // For changes between non-FREE modes
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
        // Clear chord types for mode change
        setChordTypeIndices({});
      } else {
        // Just key changes within the same mode
        const newScaleNotes = getScaleNotes(selectedKey, mode);
        setScaleNotes(newScaleNotes);
        onScaleNotesChange?.(newScaleNotes);
      }
      
      // Stop any playing chord when mode changes
      if (mode !== prevMode) {
        setCurrentChord(null);
        onChordChange?.(null);
      }
      
      // Update prevMode for next change
      setPrevMode(mode);
    }
  }, [selectedKey, mode, prevMode]);

  // Clear bass offsets when mode changes or key changes (except in FREE mode)
  useEffect(() => {
    if (mode !== prevMode) {
      // Clear on ALL mode changes
      setBassOffsets({});
      setPrevMode(mode);
    } else if (selectedKey !== prevKey && mode !== 'free') {
      // Clear on key changes only in non-FREE modes
      setBassOffsets({});
      setPrevKey(selectedKey);
    }
  }, [mode, selectedKey]);

  // Reset bass offset when key, mode, or chord changes
  useEffect(() => {
    setBassOffset(0);
    setBassEditActive(false);
  }, [selectedKey, mode]);

  // Sync bassEditActive with selectedControl from parent
  useEffect(() => {
    setBassEditActive(selectedControl === 'bass');
  }, [selectedControl]);

  // Convert note to flat notation if needed
  const convertNoteDisplay = (note: NoteName): NoteName => {
    if (mode === 'free' && useFlats) {
      return sharpToFlatMap[note];
    }
    return note;
  };

  // Helper to get the musical note for calculations
  function getMusicalNote(note: string) {
    if (note === 'C_xxl1' || note === 'C_xxl2') return 'C';
    if (note === 'C#_xxl1' || note === 'C#_xxl2') return 'C#';
    return note;
  }

  // Get chord name for a note in the current scale
  const getChordName = (note: NoteName, chordType: ChordType, buttonIndex?: number): string => {
    // Always use the musical note for display, never the identifier
    const displayRoot = getMusicalNote(note);
    const slotKey = getKeyId(note, buttonIndex, sizeText);
    if (mode !== 'free' && !scaleNotes.includes(displayRoot as NoteName)) return '';
    
    let name = convertNoteDisplay(displayRoot as NoteName);
    
    switch (chordType) {
      // Basic triads
      case 'major': break;
      case 'minor': name += 'm'; break;
      case 'dim': name += 'dim'; break;
      case 'augmented': name += 'aug'; break;
      case '5': name += '5'; break;
      
      // 7th chords
      case 'major7': name += 'maj7'; break;
      case 'M7': name += 'M7'; break;
      case 'minor7': name += 'm7'; break;
      case '7': name += '7'; break;
      case 'dim7': name += 'dim7'; break;
      case 'm7b5': name += 'm7b5'; break;
      case 'φ7': name += 'φ7'; break;
      case 'minorMajor7': name += 'mMaj7'; break;
      
      // 9th chords
      case 'major9': name += 'maj9'; break;
      case 'minor9': name += 'm9'; break;
      case '9': name += '9'; break;
      case 'add9': name += 'add9'; break;
      case '7b9': name += '7b9'; break;
      case '7#9': name += '7#9'; break;
      case 'dim9': name += 'dim9'; break;
      case 'aug9': name += 'aug9'; break;
      
      // 11th & 13th chords
      case '11': name += '11'; break;
      case 'm11': name += 'm11'; break;
      case 'major11': name += 'maj11'; break;
      case '13': name += '13'; break;
      case '13sus': name += '13sus'; break;
      case '13b9': name += '13b9'; break;
      case 'm11b5': name += 'm11b5'; break;
      
      // Sus chords
      case 'sus2': name += 'sus2'; break;
      case 'sus4': name += 'sus4'; break;
      case '7sus': name += '7sus'; break;
      case '7sus4': name += '7sus4'; break;
      case '9sus': name += '9sus'; break;
      case '7sus2b9': name += '7sus2b9'; break;
      
      // 6th chords
      case '6': name += '6'; break;
      case 'minor6': name += 'm6'; break;
      case '69': name += '69'; break;
      case 'm69': name += 'm69'; break;
      
      // Altered/special chords
      case '7#11': name += '7#11'; break;
      case '7b13': name += '7b13'; break;
      case 'maj9#11': name += 'maj9#11'; break;
      case 'm9b5': name += 'm9b5'; break;
      case '9#11': name += '9#11'; break;
      case 'maj7#5': name += 'maj7#5'; break;
      case '7alt': name += '7alt'; break;
      case '7b5': name += '7b5'; break;
      case '7#5': name += '7#5'; break;
      case 'augmented7': name += 'aug7'; break;
      case 'augmentedMajor7': name += 'augMaj7'; break;
      
      // 'bass' and 'user' cases removed
      
      default: name += chordType;
    }

    // Add bass note if this chord has a stored bass offset
    const bassOffset = chordBassOffsets[slotKey];
    if (typeof bassOffset === 'string' && bassOffset !== 'BASS' && bassOffset !== 'OFF') {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = notes.indexOf(displayRoot);
      const offsetNum = parseInt(bassOffset.replace('+', ''));
      const bassIndex = (rootIndex + offsetNum + 12) % 12;
      let bassNote = notes[bassIndex];
      if (mode === 'free' && useFlats && bassNote in sharpToFlatMap) {
        bassNote = sharpToFlatMap[bassNote as NoteName];
      }
      name += `/${bassNote}`;
    }

    return name;
  };

  // Get chord name with bass note
  const getChordNameWithBass = (chord: Chord, bassOffset: number | null): string => {
    if (!bassOffset || bassOffset === 0 || !chord.name) return chord.name || '';
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(chord.root);
    if (rootIndex === -1) return chord.name;
    
    const bassIndex = (rootIndex + bassOffset) % 12;
    const bassNote = notes[bassIndex];
    
    return `${chord.name}/${bassNote}`;
  };

  // Helper to get a unique key for any slot/key
  function getKeyId(note: string, slotIndex?: number, sizeText?: string) {
    // For XXL slot IDs like 'C#_xxl1', 'C#_xxl2', return as-is
    if (note.endsWith('_xxl1') || note.endsWith('_xxl2')) {
      return note;
    }
    if (sizeText !== 'XL' && slotIndex !== undefined) {
      return `${note}_${slotIndex}`;
    }
    return note;
  }

  // Modify getCurrentChordType to handle button indices
  const getCurrentChordType = (note: NoteName, buttonIndex?: number): ChordType => {
    const slotKey = getKeyId(note, buttonIndex, sizeText);
    const noteIndices = chordTypeIndices[slotKey];
    let currentIndex = 0;
    const availableTypes = mode === 'free' ? ALL_CHORD_TYPES : getAvailableChordTypes(note);
      currentIndex = typeof noteIndices === 'number' ? noteIndices : 0;
    return availableTypes[currentIndex % availableTypes.length] || 'major';
  };

  // Get available chord types for a note based on scale degree
  const getAvailableChordTypes = (note: NoteName): ChordType[] => {
    // In 'off' mode, all chord types are available
    if (mode === 'free') {
      return ALL_CHORD_TYPES;
    }
    
    // In other modes, chord types depend on the scale degree
    if (!scaleNotes.includes(note)) return [];
    
    const scaleIndex = scaleNotes.indexOf(note);
    const scaleDegree = (scaleIndex + 1).toString();
    
    return mode === 'minor' ? 
      MINOR_SCALE_CHORDS[scaleDegree] || [] : 
      MAJOR_SCALE_CHORDS[scaleDegree] || [];
  };

  // Modify the PianoKey component to handle the new design
  const PianoKey = ({ isWhite = true, note }: { isWhite?: boolean; note: string }) => {
    const isDisabledKey = disabledKeys.has(note as NoteName);
    const displayNote = mode === 'free' && useFlats && !isWhite ? 
      sharpToFlatMap[note as NoteName] : 
      note;
    const isInScale = mode === 'free' ? true : scaleNotes.includes(note as NoteName);

    // Split key rendering for XXL and XXXL modes
    if (sizeText !== 'XL' && (isInScale || mode === 'free')) {
      const sections = sizeText === 'XXL' ? 2 : 3;
      // Check if all slots are disabled
      const slotsDisabled = disabledSlots[note] && disabledSlots[note].size === sections;
      const keyIsDisabled = isDisabledKey || slotsDisabled;
      if (sizeText === 'XXL' && note === 'C') {
        // Special rendering for C key in XXL mode: two vertically stacked Pressables
      return (
        <View style={[
          styles.keyPosition,
              isWhite ? styles.whiteKey : styles.blackKey,
              styles.multiKeyBase,
            styles.xxlKey,
            isInScale && styles.keyInScale,
              !isWhite && { backgroundColor: '#000000' },
            mode !== 'free' && !isInScale && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
          ]}>
            {[0, 1].map(index => {
              const slotDisabled = disabledSlots[note] && disabledSlots[note].has(index);
              const showSlot = !slotDisabled;
              const chordType = getCurrentChordType(note as NoteName, index);
              const chordName = showSlot
                ? getChordName(note as NoteName, chordType, index)
                : (() => {
                    const fullName = getChordName(note as NoteName, chordType, index);
                    const parts = fullName.split('/');
                    const baseChord = parts[0];
                    const chordTypeOnly = baseChord.replace(/^[A-G][#b]?/, '');
                    return chordTypeOnly || 'maj';
                  })();
              return (
                <Pressable
                  key={index}
                  style={[
                    { height: '50%', justifyContent: 'center', alignItems: 'center', borderBottomWidth: index === 0 ? 2 : 0, borderBottomColor: 'rgba(255, 149, 0, 0.4)' },
                    slotDisabled && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
                  ]}
                  onPressIn={() => {
                    if (disableEditActive) {
                      onDisableSlot && onDisableSlot(note as NoteName, index);
                    } else if (showSlot) {
                      handleKeyPress(note, index);
                    }
                  }}
                  onPressOut={() => {
                    stopChord();
                    setCurrentChord(null);
                    onChordChange?.(null);
                  }}
                >
                      <Text style={[
                    styles.chordNameText,
                    isWhite ? styles.whiteKeyText : styles.blackKeyText,
                    slotDisabled && { opacity: 0 },
                        mode !== 'free' && !isInScale && { opacity: 0 },
                      ]}>
                    {showSlot ? chordName : ''}
                      </Text>
                </Pressable>
              );
            })}
                      </View>
                    );
                  }
      return (
        <View style={[
          styles.keyPosition,
          !isWhite && styles.blackKeyPosition
        ]}>
          <Pressable 
            style={[
              styles.pianoKey,
              isWhite ? styles.whiteKey : styles.blackKey,
              isInScale && styles.keyInScale,
              styles.multiKeyBase,
              sizeText === 'XXL' ? styles.xxlKey : styles.xxxlKey,
              !isWhite && { backgroundColor: '#000000' },
              mode !== 'free' && !isInScale && { 
                backgroundColor: 'rgba(64,64,64,0.75)',
                borderColor: 'rgba(64,64,64,0.7)',
                borderWidth: 3,
              },
              keyIsDisabled && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
            ]}
          >
            {Array.from({ length: sections }).map((_, index) => {
              const slotDisabled = disabledSlots[note] && disabledSlots[note].has(index);
              const showSlot = !keyIsDisabled && !slotDisabled;
              const chordType = getCurrentChordType(note as NoteName, index);
              const chordName = showSlot
                ? getChordName(note as NoteName, chordType, index)
                : (() => {
                    // For lower slots, show only the chord type without root note
                    const fullName = getChordName(note as NoteName, chordType, index);
                    const parts = fullName.split('/');
                    const baseChord = parts[0];
                    const chordTypeOnly = baseChord.replace(/^[A-G][#b]?/, '');
                    return chordTypeOnly || 'maj';
                  })();
              // Add a small BASS button/area for each slot
              return (
                <View key={index} style={{ width: '100%', height: '100%' }}>
                <Pressable
                  style={[
                    sizeText === 'XXL' ? styles.xxlKeyContent : styles.xxxlKeyContent,
                    (index === sections - 1) && 
                      (sizeText === 'XXL' ? styles.xxlKeyContentBottom : styles.xxxlKeyContentBottom),
                    !isWhite && { backgroundColor: '#000000' },
                      mode !== 'free' && !isInScale && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
                      (keyIsDisabled || slotDisabled) && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
                  ]}
                    onPressIn={() => {
                      if (disableEditActive) {
                        onDisableSlot && onDisableSlot(note as NoteName, index);
                      } else if (showSlot) {
                        handleKeyPress(note, index);
                      }
                    }}
                  onPressOut={() => {
                    stopChord();
                    setCurrentChord(null);
                    onChordChange?.(null);
                  }}
                >
                    <Text style={[
                      styles.chordNameText,
                      isWhite ? styles.whiteKeyText : styles.blackKeyText,
                      (keyIsDisabled || slotDisabled) && { opacity: 0 },
                      mode !== 'free' && !isInScale && { opacity: 0 },
                    ]}>
                      {showSlot ? chordName : ''}
                    </Text>
                </Pressable>
                </View>
              );
            })}
          </Pressable>
        </View>
      );
    }

    // XL mode
    if (isDisabledKey) {
      return (
        <Pressable 
          style={[
            styles.pianoKey,
            isWhite ? styles.whiteKey : styles.blackKey,
            { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
          ]}
          onPressIn={() => disableEditActive && onDisableKey && onDisableKey(note as NoteName)}
        />
      );
    }

    // Original single key rendering for XL mode
    const chordType = getCurrentChordType(note as NoteName);
    const chordName = getChordName(note as NoteName, chordType, undefined);
    const displayChordName = mode === 'free' && useFlats ? 
      chordName.replace(/[A-G]#/g, match => sharpToFlatMap[match as NoteName]) : 
      chordName;

    return (
      <Pressable 
        style={[
          styles.pianoKey,
          isWhite ? styles.whiteKey : styles.blackKey,
          isInScale && styles.keyInScale,
          mode !== 'free' && !isInScale && { backgroundColor: 'rgba(64,64,64,0.75)', borderColor: 'rgba(64,64,64,0.7)', borderWidth: 3 },
        ]}
        onPressIn={() => {
          if (disableEditActive) {
            onDisableKey && onDisableKey(note as NoteName);
          } else if (isInScale) {
            handleKeyPress(note);
          }
        }}
        onPressOut={() => {
          stopChord();
          setCurrentChord(null);
          onChordChange?.(null);
        }}
      >
        <View style={styles.keyContent}>
          <Text style={[
            styles.chordNameText,
            isWhite ? styles.whiteKeyText : styles.blackKeyText,
            mode !== 'free' && !isInScale && { opacity: 0.3 },
          ]}>
            {displayChordName}
          </Text>
        </View>
      </Pressable>
    );
  };

  // Helper to extract the musical note from a slot ID
  function extractRootFromSlotId(slotId: string): NoteName {
    if (slotId.startsWith('C#_xxl')) return 'C#';
    if (slotId.startsWith('C_xxl')) return 'C';
    if (slotId.startsWith('D#_xxl')) return 'D#';
    if (slotId.startsWith('F#_xxl')) return 'F#';
    if (slotId.startsWith('G#_xxl')) return 'G#';
    if (slotId.startsWith('A#_xxl')) return 'A#';
    // fallback for other keys
    return slotId.split('_')[0] as NoteName;
  }

  // Modify handleKeyPress to handle bass notes
  const handleKeyPress = (note: string, buttonIndex?: number) => {
    const slotKey = getKeyId(note, buttonIndex, sizeText);
    setLastPressedNote(slotKey as NoteName);
    if (bassMode) {
      setBassMode(null);
      console.log('Exited BASS mode (new chord played)');
    }
    if (mode !== 'free' && !scaleNotes.includes(note as NoteName)) return;
    
    // Update lastPressedNote to include buttonIndex if provided, so adjustLastChordType knows which slot is being edited
    const chordType = getCurrentChordType(note as NoteName, buttonIndex);
    const chord = createChord(note as NoteName, chordType);
    if (chord) {
      // Apply octave and inversion
      const modifiedNotes = chord.notes.map(note => {
        let modifiedNote = note;
        if (octave !== 0) {
          modifiedNote += 12 * octave;
        }
        return modifiedNote;
      });
      // Apply inversion if set
      if (inversion !== 0) {
        for (let i = 0; i < Math.abs(inversion); i++) {
          if (inversion > 0) {
            modifiedNotes[0] += 12;
            modifiedNotes.push(modifiedNotes.shift()!);
          } else {
            modifiedNotes[modifiedNotes.length - 1] -= 12;
            modifiedNotes.unshift(modifiedNotes.pop()!);
          }
        }
      }
      // Calculate volumes based on fader position
      const chordVolume = faderValue;
      const bassVolume = 1 - faderValue;
      // Play the main chord
      playChord(modifiedNotes, selectedSound, chordVolume);
      // Play bass note: always play root as bass if no valid offset, otherwise play offset
      const slotBassOffset = chordBassOffsets[slotKey];
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const rootIndex = notes.indexOf(note);
      let bassIndex = rootIndex;
      if (typeof slotBassOffset === 'string' && slotBassOffset !== 'BASS' && slotBassOffset !== 'OFF') {
        const offsetNum = parseInt(slotBassOffset.replace('+', ''));
        bassIndex = (rootIndex + offsetNum) % 12;
      }
      const baseNote = 48; // C3
          const extraOctaveShift = bassIndex >= 5 ? -12 : 0;
      const bassNote = baseNote + bassIndex + extraOctaveShift;
          playBassNote(bassNote, bassVolume);
      // --- Ensure valid chord name ---
      let validChordName = chord.name;
      if (!validChordName || validChordName === '') {
        validChordName = getChordName(note as NoteName, chordType, buttonIndex);
      }
      // For lower slots, remove slash from chord name
      if (buttonIndex !== undefined && buttonIndex > 0) {
        validChordName = validChordName.split('/')[0];
      }
      const modifiedChord = { 
        ...chord, 
        notes: modifiedNotes,
        name: validChordName
      };
      setLastPlayedChord(modifiedChord);
      setCurrentChord(modifiedChord);
      onChordChange?.(modifiedChord, buttonIndex);
      onNoteSelect?.(note);
      console.log('Played chord:', modifiedChord);
    }
  };

  // Helper to get slash chord name
  const getSlashChordName = (chord: Chord, offset: number) => {
    if (!chord || offset === 0) return chord.name;
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = notes.indexOf(chord.root);
    const bassIndex = (rootIndex + offset) % 12;
    return `${chord.name}/${notes[bassIndex]}`;
  };

  // Modify the imperative handle to handle button indices
  useImperativeHandle(ref, () => ({
    adjustLastChordType: (direction: 'up' | 'down') => {
      if (!lastPressedNote) return;
      const slotKey = lastPressedNote;
      const note = slotKey.split('_')[0] as NoteName;
      const availableTypes = mode === 'free' ? ALL_CHORD_TYPES : getAvailableChordTypes(note);
      if (mode !== 'free' && !scaleNotes.includes(note)) return;
      if (availableTypes.length === 0) return;
      setChordTypeIndices(prev => {
        const currentIndex = typeof prev[slotKey] === 'number' ? prev[slotKey] : 0;
          const newIndex = direction === 'up'
            ? (currentIndex + 1) % availableTypes.length
            : (currentIndex - 1 + availableTypes.length) % availableTypes.length;
          return {
            ...prev,
          [slotKey]: newIndex,
          };
      });
    },
    getChordTypeIndices: () => chordTypeIndices,
    setChordTypeIndices: (indices: ChordTypeIndicesMap) => setChordTypeIndices(indices),
    handleBassOffsetChange: (direction: 'up' | 'down') => {
      handleBassOffsetChange(direction);
    }
  }));

  // Add handler to cycle through sizes (handled by parent now)
  // const handleSizePress = () => { ... } // removed

  // Remove internal toggling in handleBassPress
  const handleBassPress = () => {
    // No-op: parent controls selectedControl
    console.log('handleBassPress called, but state is controlled by parent');
  };

  // Handle PLUS/MINUS for bass offset
  const handleBassOffsetChange = (direction: 'up' | 'down') => {
    if (!bassEditActive || !activeBassSlotKey) return;
    const currentOffset = typeof chordBassOffsets[activeBassSlotKey] === 'string' ? chordBassOffsets[activeBassSlotKey] : 'BASS';
    const BASS_SEQUENCE = ['BASS', '+1', '+2', '+3', '+4', '+5', '-6', '-5', '-4', '-3', '-2', '-1', 'OFF'];
    const currentIndex = BASS_SEQUENCE.indexOf(currentOffset);
    const nextIndex = direction === 'up'
      ? (currentIndex + 1) % BASS_SEQUENCE.length
      : (currentIndex - 1 + BASS_SEQUENCE.length) % BASS_SEQUENCE.length;
    const newOffset = BASS_SEQUENCE[nextIndex];
    if (onBassOffsetChange) {
      onBassOffsetChange(activeBassSlotKey, newOffset);
    }
  };

  // Helper to get unique slot ID for XXL
  function getXXLSlotId(note: string, slotIndex: number) {
    return `${note}xxl${slotIndex + 1}`;
  }

  return (
    <View style={styles.container}>
      {/* Piano Keys Container */}
      <View style={styles.pianoContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>PIANO   </Text>
          <Pressable 
            style={styles.xlButton}
            onPress={onSizePress}
          >
            <Text style={styles.xlButtonText}>{sizeText}</Text>
          </Pressable>
        </View>
        {sizeText === 'XL' && (
          <>
        <View style={styles.whiteKeysRow}>
              {["C_xxl1", "D", "E", "F", "G", "A", "B"].map(note => (
            <PianoKey key={note} note={note} isWhite={true} />
          ))}
        </View>
        <View style={styles.blackKeysRow}>
          {['C#', 'D#', null, 'F#', 'G#', 'A#'].map((note, index) => (
            note ? (
              <React.Fragment key={note}>
                <PianoKey 
                  note={note} 
                  isWhite={false} 
                />
                {note === 'A#' && (
                  <View style={styles.faderWrapper}>
                    <VerticalFader 
                      value={faderValue}
                      onValueChange={setFaderValue}
                    />
                  </View>
                )}
              </React.Fragment>
            ) : (
              <View key={index} style={styles.blackKeyPlaceholder} />
            )
          ))}
        </View>
          </>
        )}
        {sizeText === 'XXL' && (
          <>
            <View style={styles.whiteKeysRow}>
              {/* Blend C_xxl1 and C_xxl2 into a single key with two independent halves */}
              <View
                style={{
                  width: 72,
                  height: 130,
                  backgroundColor: '#4A4A4A',
                  borderRadius: 15,
                  marginHorizontal: 13.5,
                  borderWidth: 2,
                  borderColor: mode === 'free' ? '#FF9500' : 'transparent',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {[['C_xxl1', 0], ['C_xxl2', 1]].map(([slotId, slotIndex]) => {
                  const bassOffset = chordBassOffsets[slotId as string];
                  const showBassOffset = typeof bassOffset === 'string' ? bassOffset : undefined;
                  const chordType = getCurrentChordType(slotId as NoteName);
                  const chordName = getChordName(slotId as NoteName, chordType);
                  return (
                    <React.Fragment key={slotId}>
                      <Pressable
                        style={{
                          height: 65,
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                        onPressIn={() => handleKeyPress(slotId as string)}
                        onPressOut={() => {
                          stopChord();
                          // Don't clear currentChord here to maintain display
                        }}
                      >
                        <Text style={[styles.chordNameText, styles.whiteKeyText]}>{chordName}</Text>
                      </Pressable>
                      {slotIndex === 0 && (
                        <View style={{
                          height: 2,
                          width: '100%',
                          backgroundColor: 'rgba(255, 149, 0, 0.4)',
                          position: 'absolute',
                          top: 64,
                          left: 0,
                        }} />
                      )}
                    </React.Fragment>
                  );
                })}
      </View>
              {/* Then the rest of the keys */}
              {['D', 'E', 'F', 'G', 'A', 'B'].map(note => (
                <View
                  key={note}
                  style={{
                    width: 72,
                    height: 130,
                    backgroundColor: '#4A4A4A',
                    borderRadius: 15,
                    marginHorizontal: 13.5,
                    borderWidth: 2,
                    borderColor: mode === 'free' ? '#FF9500' : 'transparent',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {[0, 1].map(slotIndex => {
                    const slotId = getXXLSlotId(note, slotIndex);
                    const bassOffset = chordBassOffsets[slotId];
                    const showBassOffset = typeof bassOffset === 'string' ? bassOffset : undefined;
                    const chordType = getCurrentChordType(note as NoteName, slotIndex);
                    const chordName = getChordName(note as NoteName, chordType, slotIndex);
                    return (
                      <React.Fragment key={slotId}>
                        <Pressable
                          style={{
                            height: 65,
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPressIn={() => handleKeyPress(note, slotIndex)}
                          onPressOut={() => {
                            stopChord();
                            // Don't clear currentChord here to maintain display
                          }}
                        >
                          <Text style={[styles.chordNameText, styles.whiteKeyText]}>{chordName}</Text>
                        </Pressable>
                        {slotIndex === 0 && (
                          <View style={{
                            height: 2,
                            width: '100%',
                            backgroundColor: 'rgba(255, 149, 0, 0.4)',
                            position: 'absolute',
                            top: 64,
                            left: 0,
                          }} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.blackKeysRow}>
              {["C#", "D#", null, "F#", "G#", "A#"].map((note, index) => {
                if (note === "C#") {
                  // Render C# key as a black key, with two slots
                  return (
                    <View
                      key="C#_black"
                      style={{
                        width: 72,
                        height: 130,
                        backgroundColor: '#000000',
                        borderRadius: 15,
                        marginHorizontal: 13.5,
                        borderWidth: 2,
                        borderColor: mode === 'free' ? '#FF9500' : '#4A4A4A',
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      {[['C#_xxl1', 0], ['C#_xxl2', 1]].map(([slotId, slotIndex]) => {
                        const chordType = getCurrentChordType(slotId as NoteName);
                        const chordName = getChordName(slotId as NoteName, chordType);
                        return (
                          <React.Fragment key={slotId}>
                            <Pressable
                              style={{
                                height: 65,
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                              onPressIn={() => handleKeyPress(slotId as string)}
                              onPressOut={() => {
                                stopChord();
                                // Don't clear currentChord here to maintain display
                              }}
                            >
                              <Text style={[styles.chordNameText, styles.blackKeyText]}>{chordName}</Text>
                            </Pressable>
                            {slotIndex === 0 && (
                              <View style={{
                                height: 2,
                                width: '100%',
                                backgroundColor: 'rgba(255, 149, 0, 0.4)',
                                position: 'absolute',
                                top: 64,
                                left: 0,
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </View>
                  );
                } else if (note) {
                  return (
                    <React.Fragment key={note}>
                      <View
                        style={{
                          width: 72,
                          height: 130,
                          backgroundColor: '#000000',
                          borderRadius: 15,
                          marginHorizontal: 13.5,
                          borderWidth: 2,
                          borderColor: mode === 'free' ? '#FF9500' : '#4A4A4A',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        {[0, 1].map(slotIndex => {
                          const slotId = getXXLSlotId(note, slotIndex);
                          const chordType = getCurrentChordType(note as NoteName, slotIndex);
                          const chordName = getChordName(note as NoteName, chordType, slotIndex);
                          return (
                            <React.Fragment key={slotId}>
                              <Pressable
                                style={{
                                  height: 65,
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                }}
                                onPressIn={() => {
                                  setLastPressedNote(getKeyId(note, slotIndex, sizeText) as NoteName);
                                  handleKeyPress(note, slotIndex);
                                }}
                                onPressOut={() => {
                                  stopChord();
                                  // Don't clear currentChord here to maintain display
                                }}
                              >
                                <Text style={[styles.chordNameText, styles.blackKeyText]}>{chordName}</Text>
                              </Pressable>
                              {slotIndex === 0 && (
                                <View style={{
                                  height: 2,
                                  width: '100%',
                                  backgroundColor: 'rgba(255, 149, 0, 0.4)',
                                  position: 'absolute',
                                  top: 64,
                                  left: 0,
                                }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </View>
                      {note === 'A#' && (
                        <View style={styles.faderWrapper}>
                          <VerticalFader 
                            value={faderValue}
                            onValueChange={setFaderValue}
                          />
                        </View>
                      )}
                    </React.Fragment>
                  );
                } else {
                  return <View key={index} style={styles.blackKeyPlaceholder} />;
                }
              })}
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const MAJOR_SCALE_CHORDS: { [key: string]: ChordType[] } = {
  '1': ['major', 'major7', 'major9', 'major11', '6', '69', 'add9', 'sus2', 'sus4', '7', '9', '11'],
  '2': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'm7b5', 'sus2', 'sus4'],
  '3': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'sus2', 'sus4'],
  '4': ['major', 'major7', 'major9', 'major11', '6', 'add9', 'sus2', 'sus4', '11'],
  '5': ['major', '7', '9', '11', '7sus4', 'sus4', 'sus2', 'add9', '13'],
  '6': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'sus2', 'sus4'],
  '7': ['dim', 'dim7', 'm7b5', 'minor7', '7b5', 'sus2'],
};

const MINOR_SCALE_CHORDS: { [key: string]: ChordType[] } = {
  '1': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'minorMajor7', 'sus2', 'sus4'],
  '2': ['dim', 'dim7', 'm7b5', 'minor7', '7b5', 'sus2'],
  '3': ['major', 'major7', 'major9', 'add9', '6', 'sus2', 'sus4'],
  '4': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'sus2', 'sus4'],
  '5': ['minor', 'minor7', 'minor9', 'm11', 'minor6', 'sus2', 'sus4'],
  '6': ['major', 'major7', 'major9', '6', 'add9', 'sus2', 'sus4'],
  '7': ['major', '7', '9', '11', 'sus2', 'sus4'],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '-90deg' }],
    left: -211,
    top: -50,
    zIndex: 4,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18.4,
    fontWeight: '300',
    textAlign: 'center',
  },
  xlButton: {
    alignItems: 'center',
    padding: 5,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    width: 78,
    height: 47,
  },
  xlButtonText: {
    color: '#FFFFFF',
    fontSize: 18.4,
    fontWeight: '400',
  },
  pianoContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
    alignItems: 'center',
    transform: [{ translateX: -134 }, { translateY: 78 }],
  },
  whiteKeysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
    paddingHorizontal: 20,
    width: '100%',
    maxWidth: 800,
    transform: [{ translateY: 10 }],
  },
  blackKeysRow: {
    position: 'absolute',
    top: -128,
    left: -3,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    height: '60%',
    zIndex: 3,
    width: '100%',
    maxWidth: 800,
  },
  pianoKey: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  whiteKey: {
    width: 72,
    height: 129,
    backgroundColor: '#4A4A4A',
    marginHorizontal: 13.5,
  },
  blackKey: {
    width: 72,
    height: 129,
    backgroundColor: '#000000',
    marginHorizontal: 13.5,
    borderWidth: 2,
    borderColor: '#4A4A4A',
  },
  blackKeyPlaceholder: {
    width: 99,
    height: 129,
  },
  keyInScale: {
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  keyContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 10,
  },
  chordNameText: {
    position: 'relative',
    bottom: 0,
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '400',
  },
  whiteKeyText: {
    color: colors.text,
  },
  blackKeyText: {
    color: colors.text,
  },
  multiKeyContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 72,
  },
  multiKeyWrapper: {
    width: 72,
  },
  multiKeyBase: {
    width: 72,
    marginHorizontal: 0,
    left: 0,
    overflow: 'hidden',
  },
  xxlKey: {
    height: 129,
    position: 'relative',
  },
  xxlKeyContent: {
    height: '50%', // Each section takes up half the height
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2, // Increased from 1 to 2
    borderBottomColor: 'rgba(255, 149, 0, 0.4)', // Slightly more opaque
    display: 'flex',
    paddingHorizontal: 4, // Add some padding for text
  },
  xxlKeyContentBottom: {
    borderBottomWidth: 0,
  },
  xxxlKey: {
    height: 129,
    position: 'relative',
  },
  xxxlKeyContent: {
    height: '33.33%',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 149, 0, 0.4)',
    display: 'flex',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  xxxlTopSection: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  xxxlKeyName: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
  },
  xxxlChordType: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
  },
  xxxlKeyContentBottom: {
    borderBottomWidth: 0,
  },
  keyPosition: {
    width: 72,
    marginHorizontal: 13.5,
    height: 129,
    position: 'relative',
  },
  blackKeyPosition: {
    zIndex: 3,
    height: 129,
  },
  faderWrapper: {
    position: 'absolute',
    right: -112,
    top: 13,
    height: 92.65,
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faderContainer: {
    width: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faderTrack: {
    width: 4,
    height: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
    position: 'relative',
  },
  faderHandle: {
    width: 31,
    height: 9,
    backgroundColor: '#2A2A2A',
    borderRadius: 4.5,
    position: 'absolute',
    left: -15.5,
    transform: [{ translateY: 4.5 }],
    borderWidth: 1,
    borderColor: '#000000',
  },
}); 