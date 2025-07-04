// Music-related types

// Note names (C, C#, D, etc.)
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B' |
                      'Db' | 'Eb' | 'Gb' | 'Ab' | 'Bb';

// Sharp to flat conversion map
export const sharpToFlatMap: Record<NoteName, NoteName> = {
  'C': 'C',
  'C#': 'Db',
  'D': 'D',
  'D#': 'Eb',
  'E': 'E',
  'F': 'F',
  'F#': 'Gb',
  'G': 'G',
  'G#': 'Ab',
  'A': 'A',
  'A#': 'Bb',
  'B': 'B',
  'Db': 'Db',
  'Eb': 'Eb',
  'Gb': 'Gb',
  'Ab': 'Ab',
  'Bb': 'Bb'
};

// Flat to sharp conversion map
export const flatToSharpMap: Record<NoteName, NoteName> = {
  'C': 'C',
  'Db': 'C#',
  'D': 'D',
  'Eb': 'D#',
  'E': 'E',
  'F': 'F',
  'Gb': 'F#',
  'G': 'G',
  'Ab': 'G#',
  'A': 'A',
  'Bb': 'A#',
  'B': 'B',
  'C#': 'C#',
  'D#': 'D#',
  'F#': 'F#',
  'G#': 'G#',
  'A#': 'A#'
};

// Array of note names in sharp notation
export const noteNames: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Array of note names in flat notation
export const flatNoteNames: NoteName[] = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Chord types
export type ChordType = 
  // Basic triads
  | 'major' 
  | 'minor' 
  | 'dim' 
  | 'augmented'
  | '5'
  // 7th chords 
  | '7' 
  | 'major7'
  | 'M7'
  | 'minor7'
  | 'dim7'
  | 'm7b5'
  | 'φ7'
  | 'minorMajor7'
  // 9th chords
  | 'major9' 
  | 'minor9' 
  | '9' 
  | 'add9'
  | '7b9'
  | '7#9'
  | 'dim9'
  | 'aug9'
  // 11th & 13th chords
  | '11'
  | 'm11'
  | 'major11'
  | '13'
  | '13sus'
  | '13b9'
  | 'm11b5'
  // Sus chords
  | 'sus2' 
  | 'sus4'
  | '7sus'
  | '7sus4'
  | '9sus'
  | '7sus2b9'
  // 6th chords
  | '6'
  | 'minor6'
  | '69'
  | 'm69'
  // Altered/special chords
  | '7#11'
  | '7b13'
  | 'maj9#11'
  | 'm9b5'
  | '9#11'
  | 'maj7#5'
  | '7alt'
  | '7b5'
  | '7#5'
  | 'augmented7'
  | 'augmentedMajor7'
  // 'bass' and 'user' options removed
  ;

// Chord object
export interface Chord {
  id: string;
  root: NoteName;
  type: ChordType;
  notes: number[]; // MIDI note numbers
  bassNote?: NoteName; // For slash chords (e.g., C/G)
  duration?: number;
  inversion?: number; // 0 = root position, 1 = first inversion, etc.
  voicing?: number; // Different voicing options
  isOccupied?: boolean; // Whether the step is occupied in the sequencer
  name?: string; // Display name of the chord (e.g., "Cmaj7")
}

// Scale modes
export type MusicMode = 'major' | 'minor' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian' | 'free';

// Instrument types
export type InstrumentType = 
  | 'balafon'
  | 'piano' 
  | 'rhodes' 
  | 'pluck' 
  | 'pad' 
  | 'steel_drum'
  | 'bass';

// Flam values (for chord arpeggiation)
export type FlamValue = 'off' | '1/48' | '1/32' | '1/24' | '1/16';

// Time signature
export type TimeSignature = [number, number]; // [beats per measure, beat unit]

// Chord modifier (for progressions)
export interface ChordModifier {
  duration: number; // Duration in beats
  velocity: number; // Velocity (0-127)
  articulation?: 'staccato' | 'legato' | 'accent'; // Articulation type
}

// Section (for songs)
export interface Section {
  id: string;
  name: string; // e.g., 'Verse', 'Chorus', etc.
  progressionId: string;
  repeat: number;
  steps: Chord[]; // Array of chords in the section
  settings: {
    bpm: number;
    bars: number;
  };
}

// Chord progression
export interface ChordProgression {
  id: string;
  name: string;
  chords: Chord[];
  timeSignature: TimeSignature;
  tempo: number;
  key: NoteName;
  mode: MusicMode;
  createdAt: number;
  updatedAt: number;
}

// Song object
export interface Song {
  id: string;
  name: string;
  sections: Section[];
  progressions: ChordProgression[];
  instrument: InstrumentType;
  flamValue: FlamValue;
  createdAt: number;
  updatedAt: number;
}

export interface Progression {
  id: string;
  name: string;
  steps: Chord[];
  bpm: number;
  createdAt: Date;
}