# Library reader

Open a shelf volume, then choose **Book** or **Fullscreen** in the reader toolbar. The top game menu stays visible. Room turning and cursor camera movement stop while reading.

- **Book:** a large paper spread with room visible around it. Previous / Next, arrow keys, or Page Up / Page Down turn spreads. Enter a page number and choose Go to jump. The last spread can include a blank facing page.
- **Fullscreen:** a continuous, centered reading column below the game bar. Back to top returns to the chapter beginning. Switching layouts keeps the current content block in view where possible.
- **Contents:** jump to a section or search all chapter titles and text. Selecting another chapter starts it at the beginning.
- **Tools:** choose 20, 22, or 24px text; bookmark the chapter; edit saved notes; open prerequisites or its encounter. Code and oversized tables keep their own scroll area in book mode, with full content available in fullscreen.
- **Diagrams:** click or focus an illustration and press Enter to enlarge it. Zoom up to 200%; scroll to inspect large diagrams. SVGs use the paper background without an extra image background. Escape closes the diagram, then a reading panel, then the book.

The opening and closing book animation remains in the 3D room. Page-turn accents and animated source diagrams respect reduced motion. Markdown remains sanitized before rendering. CSS columns paginate the original HTML without dropping content; image loads, text-size changes, and viewport resizing refresh page counts.
