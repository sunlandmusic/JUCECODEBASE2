#include "PianoKeyComponent.h"

PianoKeyComponent::PianoKeyComponent(const juce::String& noteName, bool isBlackKey, bool isInScale)
    : juce::Button(noteName) // Use noteName for button name for accessibility/debugging
{
    currentNoteName = noteName;
    bIsBlackKey = isBlackKey;
    bIsInScale = isInScale;
}

PianoKeyComponent::~PianoKeyComponent()
{
}

void PianoKeyComponent::setNoteName(const juce::String& newName)
{
    if (currentNoteName != newName)
    {
        currentNoteName = newName;
        repaint();
    }
}

void PianoKeyComponent::setIsInScale(bool inScale)
{
    if (bIsInScale != inScale)
    {
        bIsInScale = inScale;
        repaint();
    }
}

void PianoKeyComponent::paintButton(juce::Graphics& g, bool isMouseOverButton, bool isButtonDown)
{
    auto bounds = getLocalBounds().toFloat();
    
    // Key Body
    juce::Colour keyColour = bIsBlackKey ? getBlackKeyColour() : getWhiteKeyColour();
    if (isButtonDown)
    {
        keyColour = keyColour.brighter(0.2f);
    }
    else if (isMouseOverButton)
    {
        keyColour = keyColour.brighter(0.1f);
    }
    g.setColour(keyColour);
    g.fillRoundedRectangle(bounds, cornerRadius);

    // Border
    float borderThickness = 2.0f; // As per styles.keyInScale and styles.blackKey
    juce::Colour borderColour;

    if (bIsInScale)
    {
        borderColour = getInScaleBorderColour();
    }
    else
    {
        if (bIsBlackKey)
        {
            borderColour = getBlackKeyDefaultBorderColour();
        }
        else
        {
            // White keys not in scale don't have a specific border colour mentioned other than keyInScale
            // So, no explicit border or a very subtle one. Let's not draw one for now unless specified.
            borderColour = juce::Colours::transparentBlack; // No border if not in scale and white
        }
    }

    if (borderColour != juce::Colours::transparentBlack)
    {
        g.setColour(borderColour);
        g.drawRoundedRectangle(bounds.reduced(borderThickness / 2.0f), cornerRadius, borderThickness);
    }

    // Chord Name Text
    // From PianoXL.tsx: styles.chordNameText, styles.whiteKeyText, styles.blackKeyText
    // fontSize: 16, fontWeight: '400' (normal)
    // color: colors.text (assuming this is white or a light color for visibility on dark keys)
    // For now, let's use white text. This might need to be configurable or adaptive.
    g.setColour(juce::Colours::white); 
    g.setFont(juce::Font(fontSize)); // Default weight is normal (400)

    // Text alignment:
    // justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 10
    // This means text is at the bottom, centered horizontally.
    auto textBounds = getLocalBounds();
    textBounds.removeFromTop(textBounds.getHeight() - fontSize - textPaddingBottom); // Position for bottom alignment
    textBounds.reduce(0, textPaddingBottom); // Effectively handles paddingBottom

    g.drawText(currentNoteName, textBounds, juce::Justification::centredBottom, false);
} 