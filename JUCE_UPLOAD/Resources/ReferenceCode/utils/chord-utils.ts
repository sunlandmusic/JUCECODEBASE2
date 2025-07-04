import { Chord, ChordModifier, ChordType, MusicMode, NoteName, noteNames } from '@/types/music';
import { nanoid } from '@/utils/nanoid';
import { CGLS_MODE_QUALITIES } from '@/config/CGLS';
import { useChordStore } from '../stores/chord-store';

// MIDI note number for middle C (C4)
const MIDDLE_C = 60;

// Chord intervals (semitones from root)
export const chordIntervals: Record<ChordType, number[]> = {
  // Basic triads
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dim: [0, 3, 6],
  augmented: [0, 4, 8],
  '5': [0, 7],
  
  // 7th chords
  '7': [0, 4, 7, 10],
  'major7': [0, 4, 7, 11],
  'M7': [0, 4, 7, 11], // Same intervals as major7
  'minor7': [0, 3, 7, 10],
  'dim7': [0, 3, 6, 9],
  'm7b5': [0, 3, 6, 10],
  'φ7': [0, 3, 6, 10], // Same as m7b5
  'minorMajor7': [0, 3, 7, 11],
  
  // 9th chords
  'major9': [0, 4, 7, 11, 14],
  'minor9': [0, 3, 7, 10, 14],
  '9': [0, 4, 7, 10, 14],
  'add9': [0, 4, 7, 14],
  '7b9': [0, 4, 7, 10, 13],
  '7#9': [0, 4, 7, 10, 15],
  'dim9': [0, 3, 6, 9, 14],
  'aug9': [0, 4, 8, 10, 14],
  
  // 11th & 13th chords
  '11': [0, 4, 7, 10, 14, 17],
  'm11': [0, 3, 7, 10, 14, 17],
  'major11': [0, 4, 7, 11, 14, 17],
  '13': [0, 4, 7, 10, 14, 21],
  '13sus': [0, 5, 7, 10, 14, 21],
  '13b9': [0, 4, 7, 10, 13, 21],
  'm11b5': [0, 3, 6, 10, 14, 17],
  
  // Sus chords
  'sus2': [0, 2, 7],
  'sus4': [0, 5, 7],
  '7sus': [0, 5, 7, 10],
  '7sus4': [0, 5, 7, 10],
  '9sus': [0, 5, 7, 10, 14],
  '7sus2b9': [0, 2, 7, 10, 13],
  
  // 6th chords
  '6': [0, 4, 7, 9],
  'minor6': [0, 3, 7, 9],
  '69': [0, 4, 7, 9, 14],
  'm69': [0, 3, 7, 9, 14],
  
  // Altered/special chords
  '7#11': [0, 4, 7, 10, 18],
  '7b13': [0, 4, 7, 10, 20],
  'maj9#11': [0, 4, 7, 11, 14, 18],
  'm9b5': [0, 3, 6, 10, 14],
  '9#11': [0, 4, 7, 10, 14, 18],
  'maj7#5': [0, 4, 8, 11],
  '7alt': [0, 4, 8, 10, 15, 21], // 7#5#9 alt chord
  '7b5': [0, 4, 6, 10],
  '7#5': [0, 4, 8, 10],
  'augmented7': [0, 4, 8, 10],
  'augmentedMajor7': [0, 4, 8, 11],
  
  // Other
  'bass': [0],
  'user': [] // This will be overridden by userChordIntervals
};

// Get MIDI note number from note name and octave
export const getMidiNote = (note: NoteName, octave: number): number => {
  const noteIndex = noteNames.indexOf(note);
  return MIDDLE_C + (octave - 4) * 12 + noteIndex;
};

// Get note name from MIDI note number
export const getNoteNameFromMidi = (midiNote: number): NoteName => {
  const noteIndex = (midiNote % 12);
  return noteNames[noteIndex];
};

// Get chord notes based on root note and chord type
export const getChordNotes = (rootNote: number, type: ChordType, bassOffset: number = 0): number[] => {
  const intervals = type === 'user' 
    ? useChordStore.getState().userChordIntervals
    : chordIntervals[type];
    
  if (type === 'user' && (!intervals || intervals.length === 0)) {
    return []; // Return empty array if no user chord intervals are set
  }
  
  return [rootNote + bassOffset, ...intervals.map(interval => rootNote + interval)];
};

// Create a chord object
export const createChord = (
  root: NoteName,
  type: ChordType,
  octave: number = 4,
  bassNote?: NoteName,
  modifier?: ChordModifier
): Chord | null => {
  if (type === 'user') {
    const { userChordType, userChordIntervals } = useChordStore.getState();
    if (!userChordType || !userChordIntervals || userChordIntervals.length === 0) {
      return null; // Return null if no user chord type or intervals are set
    }
    return {
      id: nanoid(),
      root,
      type: 'user',
      notes: [getMidiNote(root, octave), ...userChordIntervals.map(interval => getMidiNote(root, octave) + interval)],
      bassNote: bassNote || root,
    };
  }
  
  const notes = getChordNotes(getMidiNote(root, octave), type, getMidiNote(bassNote || root, octave) - getMidiNote(root, octave));
  if (notes.length === 0) return null;
  
  return {
    id: nanoid(),
    root,
    type,
    notes,
    bassNote: bassNote || root
  };
};

// Get notes in a scale/mode
export const getScaleNotes = (key: NoteName, mode: MusicMode): NoteName[] => {
  if (mode === 'free') return noteNames;
  
  const keyIndex = noteNames.indexOf(key);
  
  // Intervals for different modes (in semitones from the root)
  const modeIntervals: Record<MusicMode, number[]> = {
    free: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  
  // Get the scale notes
  return modeIntervals[mode].map(interval => {
    const noteIndex = (keyIndex + interval) % 12;
    return noteNames[noteIndex];
  });
};

// Get diatonic chords for a key and mode
export const getDiatonicChords = (key: NoteName, mode: MusicMode): Chord[] => {
  if (mode === 'free') return [];
  
  const scaleNotes = getScaleNotes(key, mode);
  const chords: Chord[] = [];
  
  // For each scale degree
  for (let i = 0; i < scaleNotes.length; i++) {
    const root = scaleNotes[i];
    
    // Try all possible chord types
    const allChordTypes: ChordType[] = [
      'major', 'minor', 'dim', 'augmented',
      '7', 'major7', 'minor7', 'major9', 'minor9',
      '9', 'sus2', 'sus4', 'add9', 'm7b5', 'm11',
      'dim7', '6', '69', 'minor6', 'minorMajor7',
      'major11', '13', '7sus4',
      'augmented7', 'augmentedMajor7', '11'
    ];
    
    // Test each chord type
    allChordTypes.forEach(type => {
      const chord = createChord(root, type);
      if (chord && isChordDiatonic(chord, key, mode)) {
        chords.push(chord);
      }
    });
  }
  
  return chords;
};

// Check if a chord is diatonic to a key and mode
export const isChordDiatonic = (chord: Chord, key: NoteName, mode: MusicMode): boolean => {
  if (mode === 'free') return true;
  
  // Get the scale notes
  const scaleNotes = getScaleNotes(key, mode);
  
  // Get all notes in the chord, normalized to a single octave
  const chordNotes = chord.notes.map(note => getNoteNameFromMidi(note));
  
  // Check if all chord notes are in the scale, ignoring octave
  return chordNotes.every(note => {
    const normalizedNote = note;
    return scaleNotes.includes(normalizedNote);
  });
};

// Check if a chord type is diatonic to the current key and mode for any root
export const isChordTypeDiatonic = (root: NoteName, type: ChordType, mode: MusicMode, currentKey: NoteName): boolean => {
  // If mode is 'free', all chord types are allowed
  if (mode === 'free') return true;
  
  // Get the scale notes for the current key and mode
  const scaleNotes = getScaleNotes(currentKey, mode);
  
  // Find the scale degree of the root note
  const rootIndex = scaleNotes.indexOf(root);
  if (rootIndex === -1) return false;

  // Get the allowed chord types for this scale degree based on the mode from CGLS config
  const qualities = CGLS_MODE_QUALITIES[mode];
  const allowedTypes = qualities[rootIndex] || [];
  
  // Check if the chord type is in the allowed types
  return allowedTypes.includes(type);
};

// Get common chord progressions for a key
export const getCommonProgressions = (key: NoteName, mode: MusicMode = 'major'): { name: string, chords: Chord[] }[] => {
  const diatonicChords = getDiatonicChords(key, mode);
  
  // Common progressions by scale degree (1-based)
  const progressionPatterns = [
    { name: "I-IV-V", degrees: [1, 4, 5] },
    { name: "I-V-vi-IV", degrees: [1, 5, 6, 4] },
    { name: "ii-V-I", degrees: [2, 5, 1] },
    { name: "I-vi-IV-V", degrees: [1, 6, 4, 5] },
    { name: "vi-IV-I-V", degrees: [6, 4, 1, 5] }
  ];
  
  return progressionPatterns.map(pattern => {
    const progressionChords = pattern.degrees.map(degree => {
      // Convert 1-based to 0-based index
      const index = (degree - 1) % diatonicChords.length;
      return diatonicChords[index];
    });
    
    return {
      name: pattern.name,
      chords: progressionChords
    };
  });
};

// Get chord suggestions based on previous chord and key
export const getChordSuggestions = (previousChord: Chord | null, key: NoteName, mode: MusicMode): Chord[] => {
  const diatonicChords = getDiatonicChords(key, mode);
  
  // If no previous chord, suggest diatonic chords
  if (!previousChord) {
    return diatonicChords;
  }
  
  // Find common chord progressions
  const suggestions: Chord[] = [];
  const prevRootIndex = noteNames.indexOf(previousChord.root);
  
  // Add fifth up (circle of fifths progression)
  const fifthUpIndex = (prevRootIndex + 7) % 12;
  const fifthUpRoot = noteNames[fifthUpIndex];
  
  // Add fourth up (circle of fourths progression)
  const fourthUpIndex = (prevRootIndex + 5) % 12;
  const fourthUpRoot = noteNames[fourthUpIndex];
  
  // Filter for diatonic chords with these roots
  diatonicChords.forEach(chord => {
    if (chord.root === fifthUpRoot || chord.root === fourthUpRoot) {
      suggestions.push(chord);
    }
  });
  
  // Add relative minor/major if applicable
  if (previousChord.type === 'major') {
    const relativeMinorIndex = (prevRootIndex + 9) % 12;
    const relativeMinorRoot = noteNames[relativeMinorIndex];
    
    diatonicChords.forEach(chord => {
      if (chord.root === relativeMinorRoot && chord.type === 'minor') {
        suggestions.push(chord);
      }
    });
  } else if (previousChord.type === 'minor') {
    const relativeMajorIndex = (prevRootIndex + 3) % 12;
    const relativeMajorRoot = noteNames[relativeMajorIndex];
    
    diatonicChords.forEach(chord => {
      if (chord.root === relativeMajorRoot && chord.type === 'major') {
        suggestions.push(chord);
      }
    });
  }
  
  // Add more suggestions if we don't have enough
  if (suggestions.length < 3) {
    diatonicChords.forEach(chord => {
      if (!suggestions.some(c => c.root === chord.root && c.type === chord.type)) {
        suggestions.push(chord);
      }
      
      if (suggestions.length >= 5) return;
    });
  }
  
  return suggestions;
};

export const getChordFromString = (chordString: string): Chord | null => {
  // Parse chord string to get root, type, and bass note
  // This is a placeholder implementation
  return null;
};

export const getChordFromMidi = (midiNote: number): Chord | null => {
  // Convert MIDI note to chord
  // This is a placeholder implementation
  return null;
};

// Define chord group types
export type ChordGroup = 'TRIAD' | 'FOUR_NOTE' | 'HIGHER' | 'RANDOM';

// Define chord priorities for each group
export const CHORD_PRIORITIES = {
  TRIAD: ['major', 'minor'],
  FOUR_NOTE: [
    // Priority 1: Simple common 4-note chords
    '7', 'major7', 'minor7',
    // Priority 2: Uncommon 4-note chords
    'm7b5', 'dim7',
    // Priority 3: Uncommon 3-note chords
    'augmented', 'dim', 'sus2', 'sus4',
    // Priority 4: Basic triads
    'major', 'minor'
  ],
  HIGHER: [
    // Priority 1: Simpler 5-note chords
    'major9', 'minor9', '9',
    // Priority 2: Complex 5-note chords
    '69', '11',
    // Priority 3: Complex 4-note chords
    'major7', 'minor7', '7',
    // Priority 4: Simpler chords
    'major', 'minor'
  ]
};

// Get all available chord types
export const getAllChordTypes = () => {
  const allChords = new Set<string>();
  Object.values(CHORD_PRIORITIES).forEach(chords => {
    chords.forEach(chord => allChords.add(chord));
  });
  return Array.from(allChords);
};

// Get chords for a specific group
export const getChordsForGroup = (group: ChordGroup, mode: MusicMode): string[] => {
  if (mode === 'free') {
    return getAllChordTypes();
  }
  
  if (group === 'RANDOM') {
    return getAllChordTypes();
  }
  
  return CHORD_PRIORITIES[group] || CHORD_PRIORITIES.TRIAD;
};