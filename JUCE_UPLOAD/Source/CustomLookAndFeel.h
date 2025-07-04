#pragma once
#include <JuceHeader.h>

class CustomLookAndFeel : public juce::LookAndFeel_V4
{
public:
    CustomLookAndFeel()
    {
        setColour(juce::ComboBox::backgroundColourId, juce::Colour::fromFloatRGBA(0.0f, 0.0f, 0.0f, 0.5f));
        setColour(juce::ComboBox::textColourId, juce::Colours::white);
        setColour(juce::PopupMenu::backgroundColourId, juce::Colour::fromFloatRGBA(0.0f, 0.0f, 0.0f, 0.95f));
        setColour(juce::PopupMenu::textColourId, juce::Colours::white);
    }

    void drawComboBox(juce::Graphics& g, int width, int height, bool,
                     int, int, int, int,
                     juce::ComboBox& box) override
    {
        auto cornerSize = 16.5f;
        auto bounds = juce::Rectangle<int>(0, 0, width, height).toFloat();

        g.setColour(box.findColour(juce::ComboBox::backgroundColourId));
        g.fillRoundedRectangle(bounds, cornerSize);

        // Draw border if this control is selected
        if (box.getProperties()["isSelected"])
        {
            g.setColour(juce::Colour::fromFloatRGBA(0.4f, 0.4f, 0.4f, 0.8f)); // Selected border color
            g.drawRoundedRectangle(bounds.reduced(0.5f), cornerSize, 2.0f);
        }

        // Draw the text
        auto font = juce::Font(19.8f);
        g.setFont(font);
        g.setColour(box.findColour(juce::ComboBox::textColourId));

        auto text = box.getText();
        auto textArea = bounds.reduced(11, 0);
        g.drawText(text, textArea, juce::Justification::centred, true);
    }

    void positionComboBoxText(juce::ComboBox& box, juce::Label& label) override
    {
        label.setBounds(1, 1, box.getWidth() - 2, box.getHeight() - 2);
        label.setFont(juce::Font(19.8f));
        label.setJustificationType(juce::Justification::centred);
    }
}; 