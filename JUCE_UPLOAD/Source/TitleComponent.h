#pragma once

#include <JuceHeader.h>

class TitleComponent : public juce::Component
{
public:
    TitleComponent();
    ~TitleComponent() override;

    void paint(juce::Graphics& g) override;
    void resized() override;
    
    // Calculate the original unrotated width and height based on styled elements
    // This helps in layout before rotation.
    float getOriginalUnrotatedWidth() const;
    float getOriginalUnrotatedHeight() const;

    juce::TextButton& getXlButton() { return xlButton; }

private:
    juce::TextButton xlButton;
    juce::Label titleLabel;

    // Style constants from PianoXL.tsx
    // titleText: fontSize: 18.4, fontWeight: '300'
    // xlButton: width: 78, height: 47, borderRadius: 15
    // xlButtonText: fontSize: 18.4, fontWeight: '400'
    // Spacing between title and button? Assume a small padding, e.g., 10px.

    const float titleFontSize = 23.0f;
    const float xlButtonFontSize = 23.0f;
    const float xlButtonWidth = 78.0f;
    const float xlButtonHeight = 47.0f;
    const float xlButtonCornerRadius = 15.0f;
    const float internalPadding = 10.0f; // Between label and button

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(TitleComponent)
}; 