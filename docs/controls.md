# Keyboard and controller controls

Keyboard navigation works across office props, quest graph, books, dialogue,
battle choices, field puzzles, and settings. Tab / Shift+Tab traverse controls;
arrows move focus between nearby options. Enter / Space activate native controls.
F10 focuses the top menu, and Escape goes back. Disabled or removed controls no
longer strand focus. Modal views keep Tab inside their controls.

Movement keeps its own keys: WASD / arrows move in the maze and network when the
world has focus. In manual maze mode they also work after selecting Move or a
D-pad control. Text fields and code editors retain normal typing and shortcuts.
Quest graph arrows pan, +/- zoom, and Home centers. Book left/right arrows and
PageUp/PageDown turn pages; fullscreen text scrolls normally.

Controller support uses the browser's [standard Gamepad mapping](https://www.w3.org/TR/gamepad/#remapping).
Press and release a button after connecting. Unmapped controllers are ignored
rather than guessing their layout. The browser must expose the controller to
the page; no browser extension or external remapping program is required.

| Input | Action |
| --- | --- |
| D-pad / left stick | Navigate choices; move when the world or dodge arena has focus |
| South face button (A / ✕) | Confirm or activate |
| East face button (B / ○) | Back / close |
| Start | Focus menu controls; close a modal with Back first |
| LB / RB | Previous / next control; previous / next page in a book |
| West face button (X / □) | Focus world movement in exploration or manual maze mode |
| Right stick vertical | Scroll reading and activity content |

Controller focus uses the same visible outlines and projected prop highlights
as keyboard focus. Held movement releases on blur, tab hiding, disconnect,
or a change of input context. Neutral-to-arm behavior prevents a held connect
button selecting an option. Stick dead zones and bounded repeat prevent drift
and repeated confirmations. Audio still follows the browser's user-activation
rules; a real key or pointer gesture may be needed to unlock audio.

No save format changed. Existing journals retain controls, progress, and settings.
