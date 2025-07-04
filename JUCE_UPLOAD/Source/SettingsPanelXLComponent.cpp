#include "SettingsPanelXLComponent.h"
#include <iostream>

SettingsPanelXLComponent::SettingsPanelXLComponent()
{
    // Set initial size
    setSize(928, static_cast<int>(panelHeight));

    // Initialize buttons
    addAndMakeVisible(eyeButton);
    eyeButton.setBackgroundColour(buttonColor);
    eyeButton.setBorderColour(buttonBorder);

    addAndMakeVisible(skinButton);
    skinButton.setBackgroundColour(buttonColor);
    skinButton.setBorderColour(buttonBorder);

    addAndMakeVisible(memoryButton);
    memoryButton.setBackgroundColour(buttonColor);
    memoryButton.setBorderColour(buttonBorder);

    addAndMakeVisible(disableButton);
    disableButton.setBackgroundColour(buttonColor);
    disableButton.setBorderColour(buttonBorder);

    addAndMakeVisible(bassOffsetButton);
    bassOffsetButton.setBackgroundColour(buttonColor);
    bassOffsetButton.setBorderColour(buttonBorder);

    // Initialize combo boxes with custom look and feel
    instrumentSelector.setLookAndFeel(&customLookAndFeel);
    addAndMakeVisible(instrumentSelector);
    instrumentSelector.addItem("BALAFON", 1);
    instrumentSelector.setSelectedId(1);

    modeSelector.setLookAndFeel(&customLookAndFeel);
    addAndMakeVisible(modeSelector);
    modeSelector.addItem("FREE", 1);
    modeSelector.setSelectedId(1);
    modeSelector.addListener(this);
    modeSelector.getProperties().set("isSelected", false);

    // Initialize key labels
    addAndMakeVisible(keyLabel);
    keyLabel.setText("KEY", juce::dontSendNotification);
    keyLabel.setFont(smallLabelFont);
    keyLabel.setColour(juce::Label::textColourId, labelColor);
    keyLabel.setJustificationType(juce::Justification::centred);

    addAndMakeVisible(keyValueLabel);
    keyValueLabel.setText("C", juce::dontSendNotification);
    keyValueLabel.setFont(displayFont);
    keyValueLabel.setColour(juce::Label::textColourId, textColor);
    keyValueLabel.setJustificationType(juce::Justification::centred);

    // Initialize octave labels
    addAndMakeVisible(octaveLabel);
    octaveLabel.setText("OCT", juce::dontSendNotification);
    octaveLabel.setFont(smallLabelFont);
    octaveLabel.setColour(juce::Label::textColourId, labelColor);
    octaveLabel.setJustificationType(juce::Justification::centred);

    addAndMakeVisible(octaveValueLabel);
    octaveValueLabel.setText("0", juce::dontSendNotification);
    octaveValueLabel.setFont(displayFont);
    octaveValueLabel.setColour(juce::Label::textColourId, textColor);
    octaveValueLabel.setJustificationType(juce::Justification::centred);

    // Initialize inversion labels
    addAndMakeVisible(inversionLabel);
    inversionLabel.setText("INV", juce::dontSendNotification);
    inversionLabel.setFont(smallLabelFont);
    inversionLabel.setColour(juce::Label::textColourId, labelColor);
    inversionLabel.setJustificationType(juce::Justification::centred);

    addAndMakeVisible(inversionValueLabel);
    inversionValueLabel.setText("0", juce::dontSendNotification);
    inversionValueLabel.setFont(displayFont);
    inversionValueLabel.setColour(juce::Label::textColourId, textColor);
    inversionValueLabel.setJustificationType(juce::Justification::centred);

    // Initialize chord label
    addAndMakeVisible(chordLabel);
    chordLabel.setText("CHORD", juce::dontSendNotification);
    chordLabel.setFont(smallLabelFont);
    chordLabel.setColour(juce::Label::textColourId, labelColor);
    chordLabel.setJustificationType(juce::Justification::centred);

    // Initialize chord display
    addAndMakeVisible(chordDisplay);
    chordDisplay.setText("C#", juce::dontSendNotification);
    chordDisplay.setFont(chordDisplayFont);
    chordDisplay.setColour(juce::Label::textColourId, textColor);
    chordDisplay.setJustificationType(juce::Justification::centred);

    // Add mouse listeners for selectable labels
    createSelectableContainer(keyLabel, keyValueLabel, "key");
    createSelectableContainer(octaveLabel, octaveValueLabel, "octave");
    createSelectableContainer(inversionLabel, inversionValueLabel, "inversion");
}

void SettingsPanelXLComponent::createSelectableContainer(juce::Label& label, juce::Label& value, const juce::String& controlName)
{
    // Make both labels mouse-enabled
    label.setMouseCursor(juce::MouseCursor::PointingHandCursor);
    value.setMouseCursor(juce::MouseCursor::PointingHandCursor);

    // Add click handlers
    label.setInterceptsMouseClicks(true, false);
    value.setInterceptsMouseClicks(true, false);

    // Store the control name in the label's name property for identification
    label.setName(controlName);
    value.setName(controlName);

    // Set initial colors
    label.setColour(juce::Label::backgroundColourId, buttonColor);
    value.setColour(juce::Label::backgroundColourId, buttonColor);
}

void SettingsPanelXLComponent::mouseDown(const juce::MouseEvent& event)
{
    auto* clickedComponent = event.eventComponent;
    
    // Check if we clicked on a label or its value
    if (auto* label = dynamic_cast<juce::Label*>(clickedComponent))
    {
        // Get the control name for the clicked label
        juce::String controlName;
        
        if (label == &keyLabel || label == &keyValueLabel)
            controlName = "key";
        else if (label == &octaveLabel || label == &octaveValueLabel)
            controlName = "octave";
        else if (label == &inversionLabel || label == &inversionValueLabel)
            controlName = "inversion";
        
        if (controlName.isNotEmpty())
        {
            toggleSelection(controlName);
        }
    }
}

void SettingsPanelXLComponent::toggleSelection(const juce::String& control)
{
    // If clicking the same control, deselect it
    if (selectedControl == control)
    {
        selectedControl = "";
        if (control == "inversion")
        {
            isInversionSelected = false;
            // Broadcast deselection
            listeners.call([this](Listener& l) { l.inversionSelectionChanged(false, currentInversionValue); });
        }
    }
    // If clicking a different control, select it
    else
    {
        selectedControl = control;
        if (control == "inversion")
        {
            isInversionSelected = true;
            // Broadcast selection
            listeners.call([this](Listener& l) { l.inversionSelectionChanged(true, currentInversionValue); });
        }
    }

    // Update visual state for labels
    auto updateLabelPair = [this](juce::Label& label, juce::Label& value, const juce::String& controlName) {
        bool isSelected = selectedControl == controlName;
        
        // Set background color
        label.setColour(juce::Label::backgroundColourId, buttonColor);
        value.setColour(juce::Label::backgroundColourId, buttonColor);

        // Set border color and thickness
        if (isSelected)
        {
            label.setColour(juce::Label::outlineColourId, selectedBorder);
            value.setColour(juce::Label::outlineColourId, selectedBorder);
            label.setBorderSize(juce::BorderSize<int>(2));
            value.setBorderSize(juce::BorderSize<int>(2));
            
            // Add hover effect for selected state
            label.setColour(juce::Label::backgroundColourId, buttonColor.brighter(0.1f));
            value.setColour(juce::Label::backgroundColourId, buttonColor.brighter(0.1f));
        }
        else
        {
            label.setColour(juce::Label::outlineColourId, juce::Colours::transparentBlack);
            value.setColour(juce::Label::outlineColourId, juce::Colours::transparentBlack);
            label.setBorderSize(juce::BorderSize<int>(0));
            value.setBorderSize(juce::BorderSize<int>(0));
        }
    };

    // Update all controls
    updateLabelPair(keyLabel, keyValueLabel, "key");
    updateLabelPair(octaveLabel, octaveValueLabel, "octave");
    updateLabelPair(inversionLabel, inversionValueLabel, "inversion");

    // Update mode selector
    modeSelector.getProperties().set("isSelected", selectedControl == "mode");
    modeSelector.repaint();

    repaint();
    std::cout << "Selected control: " << (selectedControl.isEmpty() ? "none" : selectedControl) << std::endl;
}

void SettingsPanelXLComponent::setInversionValue(int newValue)
{
    if (currentInversionValue != newValue)
    {
        currentInversionValue = newValue;
        inversionValueLabel.setText(juce::String(newValue), juce::dontSendNotification);
        
        // Broadcast value change if selected
        if (isInversionSelected)
        {
            listeners.call([this](Listener& l) { l.inversionSelectionChanged(true, currentInversionValue); });
        }
    }
}

void SettingsPanelXLComponent::comboBoxChanged(juce::ComboBox* comboBoxThatHasChanged)
{
    if (comboBoxThatHasChanged == &modeSelector)
    {
        toggleSelection("mode");
    }
}

SettingsPanelXLComponent::~SettingsPanelXLComponent()
{
    instrumentSelector.setLookAndFeel(nullptr);
    modeSelector.setLookAndFeel(nullptr);
    modeSelector.removeListener(this);
}

void SettingsPanelXLComponent::paint(juce::Graphics& g)
{
    // Draw the panel background with rounded corners
    g.setColour(backgroundColor);
    g.fillRoundedRectangle(getLocalBounds().toFloat(), cornerRadius);

    // Draw icons
    auto drawIcon = [&](const juce::Rectangle<float>& bounds, const juce::String& text, const juce::Colour& iconColor) {
        g.setColour(iconColor);
        g.setFont(displayFont);
        g.drawText(text, bounds, juce::Justification::centred);
    };

    drawIcon(eyeButton.getBounds().toFloat(), String::fromUTF8("\xF0\x9F\x91\x81"), textColor);
    drawIcon(skinButton.getBounds().toFloat(), String::fromUTF8("\xE2\x86\x91"), textColor);
    drawIcon(memoryButton.getBounds().toFloat(), String::fromUTF8("\xF0\x9F\x96\xAB"), textColor);
    drawIcon(disableButton.getBounds().toFloat(), "X", juce::Colour::fromFloatRGBA(0.6f, 0.6f, 0.6f, 1.0f));
    drawIcon(bassOffsetButton.getBounds().toFloat(), String::fromUTF8("\xF0\x9D\x84\xA2"), textColor);
}

void SettingsPanelXLComponent::resized()
{
    auto bounds = getLocalBounds();
    const float padding = 11.0f;
    float x = padding + 45.0f;

    // Layout circular buttons
    auto layoutCircularButton = [&](IconButton& button) {
        button.setBounds(
            static_cast<int>(x),
            static_cast<int>((panelHeight - circularButtonSize) / 2),
            static_cast<int>(circularButtonSize),
            static_cast<int>(circularButtonSize)
        );
        x += circularButtonSize + padding;
    };

    layoutCircularButton(eyeButton);
    layoutCircularButton(skinButton);
    layoutCircularButton(memoryButton);
    layoutCircularButton(disableButton);
    layoutCircularButton(bassOffsetButton);

    // Layout combo boxes
    const float comboWidth = 132.0f;
    const float comboHeight = 50.6f;
    const float comboY = (panelHeight - comboHeight) / 2;

    instrumentSelector.setBounds(
        static_cast<int>(x),
        static_cast<int>(comboY),
        static_cast<int>(comboWidth),
        static_cast<int>(comboHeight)
    );
    x += comboWidth + padding;

    // Layout key labels
    const float keyWidth = 66.0f;
    const float labelHeight = 16.5f;
    const float valueHeight = 27.5f;
    const float totalHeight = labelHeight + valueHeight;
    const float labelY = (panelHeight - totalHeight) / 2;

    auto layoutStackedLabels = [&](juce::Label& label, juce::Label& value, float width) {
        label.setBounds(
            static_cast<int>(x),
            static_cast<int>(labelY),
            static_cast<int>(width),
            static_cast<int>(labelHeight)
        );

        value.setBounds(
            static_cast<int>(x),
            static_cast<int>(labelY + labelHeight),
            static_cast<int>(width),
            static_cast<int>(valueHeight)
        );
        x += width + padding;
    };

    layoutStackedLabels(keyLabel, keyValueLabel, keyWidth);

    modeSelector.setBounds(
        static_cast<int>(x),
        static_cast<int>(comboY),
        static_cast<int>(88.0f),
        static_cast<int>(comboHeight)
    );
    x += 88.0f + padding;

    // Layout octave and inversion labels
    const float numberWidth = 66.0f;
    layoutStackedLabels(octaveLabel, octaveValueLabel, numberWidth);
    layoutStackedLabels(inversionLabel, inversionValueLabel, numberWidth);

    // Position chord label and display
    float chordLabelX = x - 20.0f; // Keep CHORD label at current position
    float chordDisplayX = x - 45.0f; // Move C# display further left by 25px
    
    chordLabel.setBounds(
        static_cast<int>(chordLabelX),
        static_cast<int>(labelY),
        static_cast<int>(numberWidth),
        static_cast<int>(labelHeight)
    );

    chordDisplay.setBounds(
        static_cast<int>(chordDisplayX),
        static_cast<int>(labelY + labelHeight),
        static_cast<int>(numberWidth * 2),
        static_cast<int>(valueHeight)
    );
} 