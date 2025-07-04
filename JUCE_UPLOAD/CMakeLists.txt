cmake_minimum_required(VERSION 3.15)
project(PIANOXL_UI_PREVIEW VERSION 1.0.0)

# Add JUCE as a subdirectory
add_subdirectory(JUCE)

# Initialize JUCE
juce_add_gui_app(PianoXLPreview
    PRODUCT_NAME "PianoXL UI Preview"
    COMPANY_NAME "PianoXL"
    VERSION "1.0.0"
)

# Create JuceHeader.h
juce_generate_juce_header(PianoXLPreview)

# Add source files
target_sources(PianoXLPreview
    PRIVATE
        Source/Main.cpp
        Source/MainComponent.cpp
        Source/MainComponent.h
        Source/PianoKeyComponent.cpp
        Source/PianoKeyComponent.h
        Source/TitleComponent.cpp
        Source/TitleComponent.h
        Source/VerticalFaderComponent.cpp
        Source/VerticalFaderComponent.h
        Source/SettingsPanelXLComponent.cpp
        Source/SettingsPanelXLComponent.h
        Source/IconButton.h
)

# Set include directories
target_include_directories(PianoXLPreview
    PRIVATE
        ${CMAKE_CURRENT_SOURCE_DIR}/Source
)

# Link with JUCE modules
target_link_libraries(PianoXLPreview
    PRIVATE
        juce::juce_core
        juce::juce_data_structures
        juce::juce_events
        juce::juce_graphics
        juce::juce_gui_basics
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
) 