#include <JuceHeader.h>
#include "MainComponent.h"

class PianoXLPreviewApplication : public juce::JUCEApplication
{
public:
    PianoXLPreviewApplication() {}

    const juce::String getApplicationName() override       { return "PianoXL UI Preview"; }
    const juce::String getApplicationVersion() override    { return "1.0.0"; }
    bool moreThanOneInstanceAllowed() override            { return false; }

    void initialise(const juce::String& commandLine) override
    {
        // Make sure we don't have any existing windows
        if (mainWindow != nullptr)
        {
            mainWindow = nullptr;
        }
        mainWindow.reset(new MainWindow(getApplicationName()));
    }

    void shutdown() override
    {
        mainWindow = nullptr;
    }

    void systemRequestedQuit() override
    {
        quit();
    }

    class MainWindow : public juce::DocumentWindow
    {
    public:
        MainWindow(juce::String name)
            : DocumentWindow(name,
                           juce::Colours::black,
                           DocumentWindow::allButtons)
        {
            setUsingNativeTitleBar(true);
            setContentOwned(new MainComponent(), true);
            setResizable(true, true);
            
            // Set landscape size
            setSize(844, 390);
            
            // Center the window on the screen
            centreWithSize(getWidth(), getHeight());
            
            // Make visible
            setVisible(true);
            
            // Bring to front
            toFront(true);
        }

        void closeButtonPressed() override
        {
            JUCEApplication::getInstance()->systemRequestedQuit();
        }

    private:
        JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(MainWindow)
    };

private:
    std::unique_ptr<MainWindow> mainWindow;
};

START_JUCE_APPLICATION(PianoXLPreviewApplication) 