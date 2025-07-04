#include "TitleComponent.h"

TitleComponent::TitleComponent() : xlButton("XL")
{
    // Title Label ("PIANO")
    titleLabel.setText("PIANO", juce::dontSendNotification);
    titleLabel.setFont(juce::Font(titleFontSize).withStyle(juce::Font::plain)); // fontWeight: '300' is light
    titleLabel.setColour(juce::Label::textColourId, juce::Colours::white);
    titleLabel.setJustificationType(juce::Justification::centredRight); // Aligns right, useful before rotation
    addAndMakeVisible(titleLabel);

    // XL Button
    xlButton.setColour(juce::TextButton::buttonColourId, juce::Colour::fromString("#00000000").withAlpha(0.5f)); // rgba(0, 0, 0, 0.5)
    xlButton.setColour(juce::TextButton::textColourOnId, juce::Colours::white);
    xlButton.setColour(juce::TextButton::textColourOffId, juce::Colours::white);
    // For border: juce::TextButton doesn't have a direct border color. Need LookAndFeel or custom paint.
    // For now, we'll rely on a LookAndFeel or skip exact border for this iteration.
    // A simple way to get a border is to draw it in paint() if LookAndFeel is too much now.
    xlButton.setConnectedEdges(0); // No connected edges for custom rounding
    xlButton.setTriggeredOnMouseDown(true); // Typical button behavior
    xlButton.setMouseClickGrabsKeyboardFocus(false);


    // Font for XL button text
    juce::Font xlFont(xlButtonFontSize); // fontWeight: '400' is normal
    // How to set font for TextButton? LookAndFeel or custom component.
    // For now, we accept default button font, or it might inherit.
    // A more JUCE-idiomatic way for custom button font and border is LookAndFeel.

    // Set a temporary LookAndFeel for the button to customize rounding and font
    // This is a bit heavy for just one button, but illustrates the method.
    // A better approach for project-wide styles would be a shared LookAndFeel instance.
    struct ButtonLookAndFeel : public juce::LookAndFeel_V4
    {
        float cornerRadius;
        juce::Font buttonFont;
        ButtonLookAndFeel(float r, juce::Font f) : cornerRadius(r), buttonFont(f) {}

        void drawButtonBackground (juce::Graphics& g,
                                   juce::Button& button,
                                   const juce::Colour& backgroundColour,
                                   bool shouldDrawButtonAsHighlighted,
                                   bool shouldDrawButtonAsDown) override
        {
            auto bounds = button.getLocalBounds().toFloat();
            auto baseColour = backgroundColour;

            if (shouldDrawButtonAsDown)
                baseColour = baseColour.contrasting(0.2f);
            else if (shouldDrawButtonAsHighlighted)
                baseColour = baseColour.contrasting(0.1f);

            g.setColour(baseColour);
            g.fillRoundedRectangle(bounds, cornerRadius);

            // Border: rgba(255, 255, 255, 0.15)
            g.setColour(juce::Colour::fromString("#FFFFFFFF").withAlpha(0.15f));
            g.drawRoundedRectangle(bounds.reduced(0.5f), cornerRadius, 1.0f);
        }
        
        juce::Font getTextButtonFont (juce::TextButton&, int /*buttonHeight*/) override
        {
            return buttonFont;
        }
    };
    // This LookAndFeel instance will be owned by the button
    xlButton.setLookAndFeel(new ButtonLookAndFeel(xlButtonCornerRadius, xlFont));


    addAndMakeVisible(xlButton);

    // Determine initial size based on content - this is for the unrotated state
    // The parent component will set our actual rotated bounds.
    // We need to report our desired unrotated size.
}

TitleComponent::~TitleComponent()
{
    xlButton.setLookAndFeel(nullptr); // Clean up LookAndFeel
}

float TitleComponent::getOriginalUnrotatedWidth() const
{
    // Width of "PIANO" text + padding + XL button width
    juce::Font titleFont(titleFontSize);
    juce::GlyphArrangement glyphs;
    glyphs.addLineOfText(titleFont, titleLabel.getText(), 0, 0);
    float titleTextWidth = glyphs.getBoundingBox(0, -1, true).getWidth();
    return titleTextWidth + internalPadding + xlButtonWidth;
}

float TitleComponent::getOriginalUnrotatedHeight() const
{
    // Max of title text height and XL button height
    return std::max(titleFontSize, xlButtonHeight); // Font size is a rough proxy for height here
}

void TitleComponent::paint(juce::Graphics& g)
{
    // The component itself is rotated by its parent through setTransform.
    // Here we just paint the background if needed, but children do their own painting.
    // g.fillAll (juce::Colours::green.withAlpha(0.3f)); // For debugging unrotated bounds

    // If we needed to draw the button border manually (if not using LookAndFeel):
    // auto& laf = getLookAndFeel();
    // if (!dynamic_cast<ButtonLookAndFeel*>(&laf)) // only if not using custom L&F
    // {
    //     g.setColour(juce::Colour::fromString("#FFFFFFFF").withAlpha(0.15f));
    //     g.drawRoundedRectangle(xlButton.getBounds().toFloat().reduced(0.5f), xlButtonCornerRadius, 1.0f);
    // }
}

void TitleComponent::resized()
{
    // Layout child components in their unrotated state.
    // The component's transform will handle the rotation.
    // We assume the bounds set by the parent are for the *unrotated* component.
    // The parent will then apply a transform.

    auto localBounds = getLocalBounds();
    
    // XL Button is on the right (before rotation: top)
    xlButton.setBounds(static_cast<int>(localBounds.getWidth() - xlButtonWidth),
                       static_cast<int>((localBounds.getHeight() - xlButtonHeight) / 2.0f), // Centered vertically
                       static_cast<int>(xlButtonWidth),
                       static_cast<int>(xlButtonHeight));

    // Title Label is on the left (before rotation: bottom)
    juce::Rectangle<int> titleLabelBounds;
    titleLabelBounds.setWidth(static_cast<int>(localBounds.getWidth() - xlButtonWidth - internalPadding));
    titleLabelBounds.setHeight(localBounds.getHeight()); // Takes full height to allow vertical centering by Justification
    titleLabelBounds.setX(0);
    titleLabelBounds.setY(0);
    titleLabel.setBounds(titleLabelBounds);
    
    // The problem description's "left: -211, top: -50" for titleContainer
    // and "transform: [{ rotate: '-90deg' }]" means the TitleComponent itself
    // will be positioned and then rotated.
    // The actual rotation transform will be applied by MainComponent to this TitleComponent.
} 