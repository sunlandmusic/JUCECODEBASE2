#pragma once

#include <JuceHeader.h>

class PianoKeyComponent : public juce::Button
{
public:
    PianoKeyComponent(const juce::String& noteName, bool isBlackKey, bool isInScale);
    ~PianoKeyComponent() override;

    void paintButton(juce::Graphics& g, bool isMouseOverButton, bool isButtonDown) override;

    void setNoteName(const juce::String& newName);
    void setIsInScale(bool inScale);

    static juce::Colour getWhiteKeyColour() { return juce::Colour::fromString("#FF4A4A4A"); }
    static juce::Colour getBlackKeyColour() { return juce::Colour::fromString("#FF000000"); }
    static juce::Colour getInScaleBorderColour() { return juce::Colour::fromString("#FFFF9500"); }
    static juce::Colour getBlackKeyDefaultBorderColour() { return juce::Colour::fromString("#FF4A4A4A"); }


private:
    juce::String currentNoteName;
    bool bIsBlackKey;
    bool bIsInScale;

    const float cornerRadius = 15.0f;
    const int textPaddingBottom = 10;
    const float fontSize = 17.6f;
    // fontWeight 400 is normal. juce::Font default weight is normal.

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(PianoKeyComponent)
}; 