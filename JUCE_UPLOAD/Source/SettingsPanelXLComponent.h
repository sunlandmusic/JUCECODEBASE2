#pragma once

#include <JuceHeader.h>
#include "IconButton.h"
#include "CustomLookAndFeel.h"

class SettingsPanelXLComponent : public juce::Component,
                                private juce::ComboBox::Listener
{
public:
    // Add a listener class for broadcasting selection changes
    class Listener
    {
    public:
        virtual ~Listener() = default;
        virtual void inversionSelectionChanged(bool isSelected, int value) = 0;
    };

    void addListener(Listener* l) { listeners.add(l); }
    void removeListener(Listener* l) { listeners.remove(l); }

    SettingsPanelXLComponent();
    ~SettingsPanelXLComponent() override;

    void paint(juce::Graphics& g) override;
    void resized() override;
    void mouseDown(const juce::MouseEvent& event) override;

    // Add methods to handle button selection
    void setSelectedControl(const juce::String& control);
    juce::String getSelectedControl() const { return selectedControl; }
    void setInversionValue(int newValue);

private:
    // ComboBox::Listener
    void comboBoxChanged(juce::ComboBox* comboBoxThatHasChanged) override;

    // Based on SettingsPanelXL.tsx styles
    const float panelHeight = 55.0f;
    const float cornerRadius = 8.8f;
    const juce::Colour backgroundColor = juce::Colours::transparentBlack;
    
    // Common button properties
    const float circularButtonSize = 42.57f;
    const float circularButtonRadius = 19.35f;
    const juce::Colour buttonColor = juce::Colour::fromFloatRGBA(0.0f, 0.0f, 0.0f, 0.5f);
    const juce::Colour buttonBorder = juce::Colour::fromFloatRGBA(0.5f, 0.5f, 0.5f, 0.5f);
    const juce::Colour selectedBorder = juce::Colour::fromFloatRGBA(0.4f, 0.4f, 0.4f, 0.8f);
    
    // Track which control is currently selected
    juce::String selectedControl;
    bool isMusicModeSelected = false;
    bool isInversionSelected = false;
    int currentInversionValue = 0;
    juce::ListenerList<Listener> listeners;

    // Helper method to create a selectable label container
    void createSelectableContainer(juce::Label& label, juce::Label& value, const juce::String& controlName);
    
    // Helper method to toggle music mode
    void toggleMusicMode();
    
    // Helper method to toggle selection
    void toggleSelection(const juce::String& control);
    
    // All buttons from left to right
    IconButton eyeButton;                // 1. Eye icon
    IconButton skinButton;               // 2. Skin icon
    IconButton memoryButton;             // 3. Memory icon
    IconButton disableButton;            // 4. Disable icon
    IconButton bassOffsetButton;         // 5. Bass clef icon
    
    // Custom look and feel for combo boxes
    CustomLookAndFeel customLookAndFeel;
    
    // Combo boxes and displays
    juce::ComboBox instrumentSelector;    // 6. Instrument selector
    
    // Key display (7)
    juce::Label keyLabel;                 // "KEY" text
    juce::Label keyValueLabel;            // "C" value
    
    juce::ComboBox modeSelector;          // 8. Mode selector ("FREE")
    
    // Number displays
    juce::Label octaveLabel;              // "OCT" text
    juce::Label octaveValueLabel;         // "0" value
    juce::Label inversionLabel;           // "INV" text
    juce::Label inversionValueLabel;      // "0" value
    juce::Label chordLabel;               // "CHORD" text
    juce::Label chordDisplay;             // "C#" value
    
    // Fonts and text properties
    const juce::Font displayFont { "Arial", 24.0f, juce::Font::plain };
    const juce::Font smallLabelFont { "Arial", 14.0f, juce::Font::plain };
    const juce::Font chordDisplayFont { "Arial", 32.0f, juce::Font::plain };
    const juce::Colour textColor = juce::Colours::white;
    const juce::Colour labelColor = juce::Colours::grey;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(SettingsPanelXLComponent)
}; 