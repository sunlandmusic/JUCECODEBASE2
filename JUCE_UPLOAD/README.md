# PianoXL JUCE Implementation

This repository contains the JUCE-based implementation of PianoXL, converting it from React Native to a native AUv3 plugin.

## Current Status

- UI components have been implemented in JUCE
- Basic layout and visual elements are in place
- Selection functionality needs to be implemented

## Implementation Requirements

### 1. Inversion Button Selection
- Make the INV button selectable (currently not working)
- Implement visual feedback for selection state
- Enable/disable plus/minus buttons based on selection
- Broadcast selection state changes

### 2. Plus/Minus Button Functionality
- Implement increment/decrement of inversion value
- Update the display value
- Handle value limits (if any)
- Broadcast value changes

### 3. State Management
- Implement ValueTree state management
- Persist selection and value states
- Handle state restoration

## Reference Files
- `SettingsPanelXLComponent.h/cpp`: Contains the INV button UI and selection logic
- `MainComponent.h/cpp`: Contains plus/minus button implementation
- Original React Native implementation is available for reference

## Implementation Notes
1. The selection functionality is partially implemented in `toggleSelection()` but needs to be completed
2. The UI follows the original React Native styling
3. Selection state changes should be broadcast through the Listener pattern
4. State should persist across plugin instances

## Testing
Please ensure:
1. INV button is properly selectable
2. Visual feedback works correctly
3. Plus/minus buttons enable/disable appropriately
4. Value changes are persisted
5. State restoration works correctly

## Dependencies
- JUCE framework
- C++17 or later
- CMake build system 