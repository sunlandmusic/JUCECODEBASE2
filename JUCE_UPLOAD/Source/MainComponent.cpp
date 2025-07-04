#include "MainComponent.h"
#include <iostream> // For std::cout

MainComponent::MainComponent()
{
    // Set background color to black
    setOpaque(true);
    getLookAndFeel().setColour(juce::ResizableWindow::backgroundColourId, juce::Colours::black);

    // Set an initial size for the component itself.
    setSize (static_cast<int>(baseWidth), static_cast<int>(baseHeight));

    // Initialize White Keys
    for (int i = 0; i < 7; ++i)
    {
        // Default to "C" key in scale for now for visual testing, others not in scale
        bool isInScale = (whiteKeyNotes[i] == "C" || whiteKeyNotes[i] == "E" || whiteKeyNotes[i] == "G"); 
        whiteKeys.push_back(std::make_unique<PianoKeyComponent>(whiteKeyNotes[i], false, isInScale));
        addAndMakeVisible(*whiteKeys.back());
    }

    // Initialize Black Keys
    // Black keys should be added after white keys so they are drawn on top by default.
    for (int i = 0; i < 6; ++i) // 6 potential positions in blackKeyNotes array
    {
        if (!blackKeyNotes[i].isEmpty()) // Skip placeholders
        {
            // Default to "F#" key in scale for now
            bool isInScale = (blackKeyNotes[i] == "F#");
            blackKeys.push_back(std::make_unique<PianoKeyComponent>(blackKeyNotes[i], true, isInScale));
            addAndMakeVisible(*blackKeys.back());
        }
    }
    
    // Initialize and make visible the title component, fader, and settings panel
    addAndMakeVisible(titleComponent);
    addAndMakeVisible(verticalFader);
    addAndMakeVisible(settingsPanel);
    settingsPanel.addListener(this); // Add this component as a listener

    // Plus/Minus Buttons
    plusButton.setButtonText("+");
    minusButton.setButtonText("-");

    // Style the buttons based on PianoXL.tsx specifications
    auto buttonStyle = [this](juce::TextButton& button) {
        button.setColour(juce::TextButton::buttonColourId, juce::Colour::fromFloatRGBA(58.0f/255.0f, 58.0f/255.0f, 60.0f/255.0f, 0.8f));
        button.setColour(juce::TextButton::textColourOffId, juce::Colours::white);
        button.setColour(juce::TextButton::textColourOnId, juce::Colours::white);

        // Apply custom LookAndFeel for rounded corners and font
        button.setLookAndFeel(&buttonLookAndFeel);
        button.setEnabled(false); // Initially disabled
    };

    buttonStyle(plusButton);
    buttonStyle(minusButton);

    plusButton.onClick = [this] {
        // Handle plus button click
        std::cout << "Plus button clicked" << std::endl;
    };
    minusButton.onClick = [this] {
        // Handle minus button click
        std::cout << "Minus button clicked" << std::endl;
    };

    addAndMakeVisible(plusButton);
    addAndMakeVisible(minusButton);

    // Add basic interactions (lambdas for simplicity)
    for (auto& key : whiteKeys)
    {
        key->onClick = [name = key->getButtonText()] {
            std::cout << "White key " << name << " clicked." << std::endl;
        };
    }

    for (auto& key : blackKeys)
    {
        key->onClick = [name = key->getButtonText()] {
            std::cout << "Black key " << name << " clicked." << std::endl;
        };
    }

    verticalFader.onValueChange = [this] {
        std::cout << "Fader value: " << verticalFader.getValue() << std::endl;
    };

    titleComponent.getXlButton().onClick = [this] {
        juce::String currentText = titleComponent.getXlButton().getButtonText();
        if (currentText == "XL") titleComponent.getXlButton().setButtonText("XXL");
        else if (currentText == "XXL") titleComponent.getXlButton().setButtonText("XXXL");
        else titleComponent.getXlButton().setButtonText("XL");
        std::cout << "XL Button clicked. New mode: " << titleComponent.getXlButton().getButtonText() << std::endl;
    };

    // Force an initial layout
    resized();
}

void MainComponent::inversionSelectionChanged(bool isSelected, int value)
{
    // Enable/disable plus/minus buttons based on selection state
    plusButton.setEnabled(isSelected);
    minusButton.setEnabled(isSelected);
    
    std::cout << "Inversion selection changed - Selected: " << (isSelected ? "yes" : "no") 
              << ", Value: " << value << std::endl;
}

MainComponent::~MainComponent()
{
    settingsPanel.removeListener(this);
    plusButton.setLookAndFeel(nullptr);
    minusButton.setLookAndFeel(nullptr);
}

void MainComponent::paint(juce::Graphics& g)
{
    // Fill background with solid black
    g.fillAll(juce::Colours::black);
}

void MainComponent::resized()
{
    // This is called when the MainComponent is resized.
    // We need to calculate the bounds for our content area, respecting aspect ratio and constraints.

    float currentWidthPx = static_cast<float>(getWidth());
    float currentHeightPx = static_cast<float>(getHeight());

    float newContentWidth = 0;
    float newContentHeight = 0;

    // Determine the dominant dimension for scaling
    if (currentWidthPx / currentHeightPx > aspectRatio)
    {
        newContentHeight = currentHeightPx;
        newContentWidth = newContentHeight * aspectRatio;
    }
    else
    {
        newContentWidth = currentWidthPx;
        newContentHeight = newContentWidth / aspectRatio;
    }

    // Apply min/max constraints
    if (newContentWidth < minWidth)
    {
        newContentWidth = static_cast<float>(minWidth);
        newContentHeight = minWidth / aspectRatio;
    }
    // Ensure minHeight is also respected if it's proportionally larger than what minWidth implies
    if (newContentHeight < minHeight && minHeight > 0) 
    {
        newContentHeight = static_cast<float>(minHeight);
        newContentWidth = newContentHeight * aspectRatio; 
    }

    if (newContentHeight > maxHeight)
    {
        newContentHeight = static_cast<float>(maxHeight);
        newContentWidth = newContentHeight * aspectRatio;
    }
    // Ensure maxWidth is also respected
    if (newContentWidth > maxWidth && maxWidth > 0)
    {
        newContentWidth = static_cast<float>(maxWidth);
        newContentHeight = newContentWidth / aspectRatio;
    }

    // Position settings panel at the top
    float settingsPanelY = 20.0f;
    settingsPanel.setBounds(
        static_cast<int>((currentWidthPx - settingsPanel.getWidth()) / 2.0f),
        static_cast<int>(settingsPanelY),
        settingsPanel.getWidth(),
        settingsPanel.getHeight()
    );

    // Adjust offsets - move left 30px and down 20px
    float xOffset = 170.0f;  // Previous 200 - 30
    float yOffset = 145.0f;  // Previous 125 + 20

    int contentX = static_cast<int>((currentWidthPx - newContentWidth) / 2.0f + xOffset);
    int contentY = static_cast<int>((currentHeightPx - newContentHeight) / 2.0f + yOffset);
    contentBounds.setBounds(contentX, contentY, static_cast<int>(newContentWidth), static_cast<int>(newContentHeight));
    
    float scaleFactor = contentBounds.getWidth() / baseWidth;

    // Piano Container Offset (adjusted with the new offsets)
    float pianoContainerOrigX = -124.0f; // Moved left by another 40
    float pianoContainerOrigY = 78.0f;
    juce::Point<float> pianoAreaTopLeft(contentBounds.getX() + (pianoContainerOrigX * scaleFactor),
                                        contentBounds.getY() + (pianoContainerOrigY * scaleFactor));

    // --- White Keys Layout ---
    // styles.whiteKey: width: 72, height: 129, marginHorizontal: 13.5
    // styles.whiteKeysRow: paddingHorizontal: 20, transform: [{ translateY: 10 }]
    float whiteKeyOrigWidth = 72.0f;
    float whiteKeyOrigHeight = 129.0f;
    float whiteKeyOrigMarginH = 13.5f;
    float whiteKeysRowPaddingH = 20.0f; // This padding is for the row container
    float whiteKeysRowTranslateY = 10.0f; // This translation is for the row container

    float scaledKeyWidth = whiteKeyOrigWidth * scaleFactor;
    float scaledKeyHeight = whiteKeyOrigHeight * scaleFactor;
    float scaledMarginH = whiteKeyOrigMarginH * scaleFactor;
    
    // The first key's left edge starts after the row's padding and its own left margin.
    float currentWhiteKeyX = pianoAreaTopLeft.getX() + (whiteKeysRowPaddingH * scaleFactor);
    float whiteKeysY = pianoAreaTopLeft.getY() + (whiteKeysRowTranslateY * scaleFactor);

    for (size_t i = 0; i < whiteKeys.size(); ++i)
    {
        whiteKeys[i]->setBounds(static_cast<int>(currentWhiteKeyX + scaledMarginH),
                                static_cast<int>(whiteKeysY),
                                static_cast<int>(scaledKeyWidth),
                                static_cast<int>(scaledKeyHeight));
        // Advance X by key width + both margins (left and right)
        currentWhiteKeyX += scaledKeyWidth + (scaledMarginH * 2.0f);
    }

    // --- Black Keys Layout ---
    // styles.blackKey: width: 72, height: 129, marginHorizontal: 13.5
    // styles.blackKeyPlaceholder: width: 99 (this seems to be key_width + 2*margin)
    // styles.blackKeysRow: position: 'absolute', top: -128, left: -3 (relative to pianoContainer)
    
    float blackKeyOrigWidth = 72.0f;
    float blackKeyOrigHeight = 129.0f;
    float blackKeyOrigMarginH = 13.5f;
    float blackKeyPlaceholderOrigWidth = 99.0f;

    float blackKeysRowOrigTop = -128.0f;
    float blackKeysRowOrigLeft = -3.0f;
    float blackKeysExtraOffset = 50.0f; // Additional x-offset for black keys
    float blackKeysUpOffset = 18.0f;    // Reduced from 40 to move keys down by 22px

    float scaledBlackKeyWidth = blackKeyOrigWidth * scaleFactor;
    float scaledBlackKeyHeight = blackKeyOrigHeight * scaleFactor;
    float scaledBlackKeyMarginH = blackKeyOrigMarginH * scaleFactor;
    float scaledBlackKeyPlaceholderWidth = blackKeyPlaceholderOrigWidth * scaleFactor;
    float scaledBlackKeysUpOffset = blackKeysUpOffset * scaleFactor; // Scale the upward offset

    float blackKeysCurrentX = pianoAreaTopLeft.getX() + (whiteKeysRowPaddingH * scaleFactor) + 
                             (blackKeysRowOrigLeft * scaleFactor) + blackKeysExtraOffset;
    float blackKeysY = pianoAreaTopLeft.getY() + (whiteKeysRowTranslateY * scaleFactor) + 
                      (blackKeysRowOrigTop * scaleFactor) - scaledBlackKeysUpOffset; // Use scaled offset

    size_t blackKeyInstanceIdx = 0;
    for (const auto& noteName : blackKeyNotes)
    {
        if (!noteName.isEmpty())
        {
            if (blackKeyInstanceIdx < blackKeys.size())
            {
                blackKeys[blackKeyInstanceIdx]->setBounds(static_cast<int>(blackKeysCurrentX + scaledBlackKeyMarginH),
                                                       static_cast<int>(blackKeysY),
                                                       static_cast<int>(scaledBlackKeyWidth),
                                                       static_cast<int>(scaledBlackKeyHeight));
                blackKeysCurrentX += scaledBlackKeyWidth + (scaledBlackKeyMarginH * 2.0f);
                blackKeyInstanceIdx++;
        }
    }
        else
        {
            blackKeysCurrentX += scaledBlackKeyPlaceholderWidth;
        }
    }

    // --- Title Component Layout ---
    float titleOrigX = -71.0f; // Moved right by 50 to keep in frame
    float titleOrigY = -50.0f;
    float titleScaledX = titleOrigX * scaleFactor;
    float titleScaledY = titleOrigY * scaleFactor;
    float unrotatedTitleWidth = titleComponent.getOriginalUnrotatedWidth() * scaleFactor;
    float unrotatedTitleHeight = titleComponent.getOriginalUnrotatedHeight() * scaleFactor;
    
    titleComponent.setBounds(static_cast<int>(pianoAreaTopLeft.getX() + titleScaledX),
                           static_cast<int>(pianoAreaTopLeft.getY() + titleScaledY),
                           static_cast<int>(unrotatedTitleWidth),
                           static_cast<int>(unrotatedTitleHeight));
    
    // Apply -90 degree rotation to title component
    auto titleTransform = juce::AffineTransform::rotation(-juce::MathConstants<float>::pi / 2.0f,
                                                         titleComponent.getX() + titleComponent.getWidth() / 2.0f,
                                                         titleComponent.getY() + titleComponent.getHeight() / 2.0f);
    titleComponent.setTransform(titleTransform);
    
    // --- Vertical Fader Layout ---
    float faderOrigHeight = 92.65f;
    float faderOrigWidth = 20.0f;
    float faderWrapperOrigWidth = 30.0f;

    float faderScaledHeight = faderOrigHeight * scaleFactor;
    float faderScaledWidth = faderOrigWidth * scaleFactor;
    float faderWrapperScaledWidth = faderWrapperOrigWidth * scaleFactor;
    float blackKeyContentAreaStartX = pianoAreaTopLeft.getX() + (whiteKeysRowPaddingH * scaleFactor) + (blackKeysRowOrigLeft * scaleFactor);
    float blackKeyContentAreaRightAbsolute = blackKeysCurrentX;

    // Plus/Minus Buttons Layout - Updated with PianoXL.tsx specifications
    float buttonWidth = 40.0f * scaleFactor;
    float buttonHeight = 140.0f * scaleFactor;
    float buttonSpacing = 10.0f * scaleFactor;
    
    // Position calculation: -225px + 50px + 90px right - 75px left = -160px from original
    float buttonsX = contentBounds.getRight() - (buttonWidth + 20.0f) - (160.0f * scaleFactor); // Moved left by 75px

    // Position fader between A# key and plus button
    float faderWrapperLeft = buttonsX - (65.0f * scaleFactor); // Reduced space from plus button by another 25px
    float faderActualLeft = faderWrapperLeft;
    
    // Align vertically with the black keys and adjust height
    float faderActualTop = blackKeysY + (20.0f * scaleFactor);

    verticalFader.setBounds(static_cast<int>(faderActualLeft),
                           static_cast<int>(faderActualTop),
                           static_cast<int>(faderScaledWidth),
                           static_cast<int>(faderScaledHeight));
    float buttonsStartY = contentBounds.getCentreY() - (buttonHeight + buttonSpacing/2.0f) - (114.0f * scaleFactor); // Moved down by another 11px

    plusButton.setBounds(static_cast<int>(buttonsX),
                        static_cast<int>(buttonsStartY),
                        static_cast<int>(buttonWidth),
                        static_cast<int>(buttonHeight));

    minusButton.setBounds(static_cast<int>(buttonsX),
                         static_cast<int>(buttonsStartY + buttonHeight + buttonSpacing),
                         static_cast<int>(buttonWidth),
                         static_cast<int>(buttonHeight));
} 