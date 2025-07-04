import { NoteName, MusicMode } from '@/types/music';

const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
const DORIAN_INTERVALS = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN_INTERVALS = [0, 1, 3, 5, 7, 8, 10];
const LYDIAN_INTERVALS = [0, 2, 4, 6, 7, 9, 11];
const MIXOLYDIAN_INTERVALS = [0, 2, 4, 5, 7, 9, 10];
const LOCRIAN_INTERVALS = [0, 1, 3, 5, 6, 8, 10];

const noteNames: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const getScaleNotes = (root: NoteName, mode: MusicMode): NoteName[] => {
  let intervals: number[];
  
  switch (mode) {
    case 'major':
      intervals = MAJOR_SCALE_INTERVALS;
      break;
    case 'minor':
      intervals = MINOR_SCALE_INTERVALS;
      break;
    case 'dorian':
      intervals = DORIAN_INTERVALS;
      break;
    case 'phrygian':
      intervals = PHRYGIAN_INTERVALS;
      break;
    case 'lydian':
      intervals = LYDIAN_INTERVALS;
      break;
    case 'mixolydian':
      intervals = MIXOLYDIAN_INTERVALS;
      break;
    case 'locrian':
      intervals = LOCRIAN_INTERVALS;
      break;
    default:
      return [];
  }

  const rootIndex = noteNames.indexOf(root);
  if (rootIndex === -1) return [];

  return intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return noteNames[noteIndex];
  });
}; 