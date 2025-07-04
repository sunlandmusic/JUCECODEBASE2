#pragma once

#include <JuceHeader.h>

class VerticalFaderComponent : public juce::Slider
{
public:
    VerticalFaderComponent();
    ~VerticalFaderComponent() override;

    // The fader value in PianoXL.tsx seems to range 0.0 to 1.0
    // with snap points. JUCE Slider can handle this with setRange and setInterval.

private:
    // LookAndFeel class to customize slider appearance
    class FaderLookAndFeel : public juce::LookAndFeel_V4
    {
    public:
        FaderLookAndFeel();
        void drawLinearSlider (juce::Graphics& g, int x, int y, int width, int height,
                               float sliderPos, float minSliderPos, float maxSliderPos,
                               const juce::Slider::SliderStyle style, juce::Slider& slider) override;
        
        // Dimensions from PianoXL.tsx styles:
        // faderTrack: width: 4, height: '100%', backgroundColor: '#2A2A2A', borderRadius: 2
        // faderHandle: width: 31, height: 9, backgroundColor: '#2A2A2A', borderRadius: 4.5
        //              borderWidth: 1, borderColor: '#000000'
        // The handle is wider than the track.

        const float trackWidth = 8.0f;
        const float trackCornerRadius = 4.0f;
        const juce::Colour trackColour = juce::Colour::fromString("#FF4A4A4A");

        const float thumbWidth = 31.0f;
        const float thumbHeight = 9.0f;
        const float thumbCornerRadius = 4.5f;
        const juce::Colour thumbColour = juce::Colour::fromString("#FF2A2A2A");
        const juce::Colour thumbBorderColour = juce::Colour::fromString("#FF000000");
        const float thumbBorderThickness = 1.0f;
    };
    
    FaderLookAndFeel lookAndFeel; // Own an instance of the LookAndFeel

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(VerticalFaderComponent)
}; 