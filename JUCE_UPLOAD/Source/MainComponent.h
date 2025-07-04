#pragma once

#include <JuceHeader.h>
#include "PianoKeyComponent.h" 
#include "TitleComponent.h"
#include "VerticalFaderComponent.h"
#include "SettingsPanelXLComponent.h"

//==============================================================================
/*
    This component lives inside our window, and this is where you should put all
    your controls and content.
*/
class MainComponent  : public juce::Component,
                      public SettingsPanelXLComponent::Listener
{
public:
    //==============================================================================
    MainComponent();
    ~MainComponent() override;

    //==============================================================================
    void paint (juce::Graphics&) override;
    void resized() override;
    void inversionSelectionChanged(bool isSelected, int value) override;

private:
    //==============================================================================
    // Your private member variables go here...
    
    // Define base dimensions and aspect ratio
    const float baseWidth = 844.0f;
    const float baseHeight = 390.0f;
    const float aspectRatio = baseWidth / baseHeight;

    // Define min/max constraints for the content area
    const int minWidth = 844;
    const int minHeight = static_cast<int>(minWidth / aspectRatio); // approx 390
    const int maxWidth = static_cast<int>(390.0f * aspectRatio); // approx 844 if height is capped
    const int maxHeight = 390;

    juce::Rectangle<int> contentBounds;

    // Test Piano Key
    // PianoKeyComponent testKey; // Will be replaced by arrays of keys

    // Other UI Elements
    TitleComponent titleComponent;
    VerticalFaderComponent verticalFader;
    SettingsPanelXLComponent settingsPanel;

    // ValueTree to store persistent state
    juce::ValueTree state { "AppState" };

    // Custom LookAndFeel for plus/minus buttons
    class ButtonLookAndFeel : public juce::LookAndFeel_V4
    {
    public:
        void drawButtonBackground(juce::Graphics& g, juce::Button& button,
                                const juce::Colour& backgroundColour,
                                bool shouldDrawButtonAsHighlighted,
                                bool shouldDrawButtonAsDown) override
        {
            auto bounds = button.getLocalBounds().toFloat().reduced(0.5f, 0.5f);
            auto baseColour = backgroundColour;

            if (shouldDrawButtonAsDown)
                baseColour = baseColour.contrasting(0.2f);
            else if (shouldDrawButtonAsHighlighted)
                baseColour = baseColour.contrasting(0.1f);

            g.setColour(baseColour);
            g.fillRoundedRectangle(bounds, 8.0f); // 8px border radius from PianoXL.tsx
        }

        juce::Font getTextButtonFont(juce::TextButton&, int) override
        {
            return juce::Font(juce::FontOptions().withHeight(28.0f).withStyle("Bold"));
        }
    };

    ButtonLookAndFeel buttonLookAndFeel;
    juce::TextButton plusButton;
    juce::TextButton minusButton;

    // Piano Keys
    std::vector<std::unique_ptr<PianoKeyComponent>> whiteKeys;
    std::vector<std::unique_ptr<PianoKeyComponent>> blackKeys;

    // Key names (using "Db" for "C#" etc. for easier processing if needed, but display can be "#")
    const juce::String whiteKeyNotes[7] = {"C", "D", "E", "F", "G", "A", "B"};
    // Using nullptrs for spacing in black key array based on PianoXL.tsx structure
    const juce::String blackKeyNotes[6] = {"C#", "D#", "", "F#", "G#", "A#"}; // "" for placeholder

    // Persistence helpers
    void loadState();
    void saveState();

    juce::File getStateFile() const;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (MainComponent)
}; 