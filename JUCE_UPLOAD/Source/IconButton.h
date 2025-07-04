#pragma once

#include <JuceHeader.h>

class IconButton : public juce::Button
{
public:
    IconButton(const juce::String& name = "") : juce::Button(name)
    {
        setClickingTogglesState(false);
    }

    void setIcon(const juce::String& iconPath)
    {
        if (juce::File::isAbsolutePath(iconPath))
            icon = juce::ImageCache::getFromFile(juce::File(iconPath));
        else
        {
            // Try to load from the Resources/icons directory
            juce::File resourceDir = juce::File::getCurrentWorkingDirectory().getChildFile("Resources/icons");
            icon = juce::ImageCache::getFromFile(resourceDir.getChildFile(iconPath));
        }
        if (icon.isValid())
            icon = icon.rescaled(24, 24, juce::Graphics::highResamplingQuality); // Set a reasonable default size
        repaint();
    }

    void setIconText(const juce::String& text, const juce::Colour& colour)
    {
        iconText = text;
        textColour = colour;
        icon = juce::Image(); // Clear any image
        repaint();
    }

    void setIconColour(juce::Colour colour)
    {
        iconColour = colour;
        repaint();
    }

    void setBackgroundColour(juce::Colour colour)
    {
        backgroundColour = colour;
        repaint();
    }

    void setBorderColour(juce::Colour colour)
    {
        borderColour = colour;
        repaint();
    }

protected:
    void paintButton(juce::Graphics& g, bool shouldDrawButtonAsHighlighted, bool shouldDrawButtonAsDown) override
    {
        auto bounds = getLocalBounds().toFloat();
        const float cornerRadius = bounds.getWidth() / 2.0f; // Make it circular

        // Draw background
        g.setColour(backgroundColour);
        g.fillRoundedRectangle(bounds, cornerRadius);

        // Draw border
        g.setColour(borderColour);
        g.drawRoundedRectangle(bounds.reduced(0.5f), cornerRadius, 1.0f);

        // Draw icon if available
        if (icon.isValid())
        {
            const float iconPadding = bounds.getWidth() * 0.25f;
            auto iconBounds = bounds.reduced(iconPadding);
            
            if (shouldDrawButtonAsDown)
                iconBounds.translate(1.0f, 1.0f);

            g.setColour(iconColour);
            g.drawImageWithin(icon, 
                            static_cast<int>(iconBounds.getX()), 
                            static_cast<int>(iconBounds.getY()), 
                            static_cast<int>(iconBounds.getWidth()), 
                            static_cast<int>(iconBounds.getHeight()),
                            juce::RectanglePlacement::centred);
        }
        else if (iconText.isNotEmpty())
        {
            g.setColour(textColour);
            g.setFont(juce::Font(bounds.getHeight() * 0.5f));
            g.drawText(iconText, bounds, juce::Justification::centred);
        }
    }

private:
    juce::Image icon;
    juce::String iconText;
    juce::Colour textColour = juce::Colours::white;
    juce::Colour iconColour = juce::Colours::white;
    juce::Colour backgroundColour = juce::Colour::fromFloatRGBA(0.0f, 0.0f, 0.0f, 0.5f);
    juce::Colour borderColour = juce::Colour::fromFloatRGBA(1.0f, 1.0f, 1.0f, 0.15f);

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(IconButton)
}; 