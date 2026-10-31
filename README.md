# WhatsApp Privacy Shield 1.0.4

## Downloads

Manual-install v1.0.4 packages: [Chrome](https://github.com/irahulsaini/whatsapp-privacy-shield/raw/refs/tags/v1.0.4/packages/whatsapp-privacy-shield-chrome-v1.0.4.zip), [Edge](https://github.com/irahulsaini/whatsapp-privacy-shield/raw/refs/tags/v1.0.4/packages/whatsapp-privacy-shield-edge-v1.0.4.zip), [Firefox](https://github.com/irahulsaini/whatsapp-privacy-shield/raw/refs/tags/v1.0.4/packages/whatsapp-privacy-shield-firefox-v1.0.4.zip). [SHA-256 checksums](https://github.com/irahulsaini/whatsapp-privacy-shield/raw/refs/tags/v1.0.4/packages/SHA256SUMS-1.0.4.txt).

These ZIPs are unchanged copies of the previous website downloads. Extract before installation. Firefox 140+ uses temporary installation and requires Mozilla signing for permanent distribution. These are not approved browser-store listings.

The [website tool and console guide](https://www.irahulsaini.com/tools/whatsapp-privacy-shield) links here. `packages/` contains published artifacts; `dist/` contains local build output and source archives. Obfuscated local-only builds are ignored by Git and are not store candidates.

## Maintain and rebuild
Original supplied script is unchanged in `original/privacy.js`. Edit `src/privacy.js`, never the generated files. Use Node 22+ and npm. From this folder: `npm ci`, `npm run build`, `npm test`. The lockfile pins the build dependencies. Version changes belong in package.json, its lockfile and the runtime shield tooltip. build.mjs reads the package version. Run the tests again after any selector or build-setting change. Obfuscation is not encryption or copy prevention.

This repository builds independently with `npm ci`, `npm run build` and `npm test`. The website maintains a separate console source and build; it does not need an extension checkout. Coordinate changes explicitly when both methods need an update. The website imports only its generated console string into its client bundle.

## Install locally
Chrome: unzip the chrome package, open chrome://extensions, enable Developer mode, Load unpacked, select the folder containing manifest.json.
Edge: use edge://extensions and the same Load unpacked workflow with the edge folder.
Firefox: unzip the firefox package, open about:debugging#/runtime/this-firefox, Load Temporary Add-on, select manifest.json. Temporary installations are removed when Firefox closes. Signed distribution needs a Mozilla submission.
Refresh existing WhatsApp Web tabs after installation. Enable the extension's access to web.whatsapp.com if the browser asks. Use one installation method per tab; running both console and extension versions concurrently is not supported.

## Behavior and implementation differences
Runs only on https://web.whatsapp.com and injects local styles/UI. Starts ON at medium blur on every page load. Hover/focus reveals matching rows. Settings exist only in memory. The privacy shield is visually positioned beside data-testid=drawer-title-body using a fixed overlay outside WhatsApp’s layout; a top-right fallback is used if it is absent. This version is not the earlier draggable prototype. × closes settings; OFF clears blur. Disable/remove the extension and refresh to remove its controls. Console users refresh to remove the tool.

Hardening: static SVG uses DOM creation instead of innerHTML; drawing is batched per animation frame; MutationObserver, ResizeObserver and interaction listeners are cleaned up on reinjection; popup follows page scroll; a domain guard prevents running elsewhere; icon is green when privacy is ON and gray when OFF.

## Review and limitations
This is visual privacy, not encryption, authorization, or guaranteed screen-share protection. Content can appear before the script starts, when hovered/focused, or where selectors do not match. Search, group-info, notifications, media and changed WhatsApp markup may remain visible. No hidden-data access or internal WhatsApp APIs. Not affiliated with WhatsApp or Meta.

Before public release, manually test an authorized WhatsApp account in Chrome, Edge and Firefox, light/dark themes, mouse and keyboard reveal, header remount, login/logout, refresh, disable/uninstall, and narrow windows. Verify both console and installed extension behavior separately. Synthetic tests do not verify current live WhatsApp compatibility. No store upload, signing or website deployment has been performed.

Store references:
- https://developer.chrome.com/docs/webstore/program-policies/code-readability
- https://extensionworkshop.com/documentation/publish/source-code-submission/
- https://learn.microsoft.com/legal/microsoft-edge/extensions/developer-policies
- https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/

Store listing draft: “Blur matching WhatsApp Web conversations. Reveal rows on hover or keyboard focus. Use a compact privacy shield to toggle privacy and choose blur strength. Works locally with no analytics, account, or data collection.” Provide PRIVACY.md at a public URL when submitting. Reviewers must test with their own authorized WhatsApp account; never supply personal credentials.

## Scroll-stability change in 1.0.1
Previous builds applied CSS filter directly to WhatsApp message rows, potentially changing positioned descendants and virtualized-list measurements. Hover blur(0px) alone did not address initial filter application. This version uses pointer-transparent, fixed backdrop-filter masks outside WhatsApp's DOM layout. The shield is also positioned outside the header layout. Rows are only queried for geometry and interaction state; the script never sets their styles, attributes, children or scroll position.

Masks are clipped to viewport and scrolling ancestors, skip header/footer and nested row containers, and are hidden for hover/focus according to the selected mode. Updates follow scroll, resize, interaction, loading and DOM mutations. Overlaid unrelated content at the mask's center causes that mask to be hidden. Partial overlapping dialogs, animations and asynchronous rendering can still briefly leave content uncovered; this remains a convenience effect, not a security boundary. Use a current browser with backdrop-filter support.

Chat modes: Entire chat (default) reveals all matching message rows while #main is hovered/focused. Messages reveals only a hovered/focused row. Sidebar rows reveal independently. Header and composer stay visible. Modes reset on reload.

## Verification
16 Node synthetic-DOM and manifest checks passed against source and all generated variants. Tests cover mask cleanup, header exclusion, focus without scrolling, mode switching, no row styling, and absence of scroll writes/network/storage calls.

The in-app browser ran 30 geometry/scroll/archive regression checks on both the minified Chrome runtime and obfuscated console runtime. ScrollTop, scrollHeight, row offsets and positioned descendant containing blocks remained unchanged; ten toggle cycles and five synthetic chat replacements preserved scroll. Both focus reveal modes and cleanup passed. This is browser rendering verification of synthetic content, not confirmation of live WhatsApp behavior or Firefox/Edge engine compatibility.

Repeat browser checks: `node tests/browser-fixture.mjs`, open http://localhost:3019/?variant=chrome (or obfuscated), click Run checks. The fixture wraps the exact runtime with a local hostname binding solely to exercise it on synthetic content; production keeps the WhatsApp-only guard.

To test the fix, replace the installed extension files with the 1.0.3 package, reload the extension and refresh WhatsApp. For console mode, disable other privacy extensions, refresh WhatsApp, then paste the newly copied script. Never run old/new extensions and console versions together. No public deployment or store upload is included.

## Header placement in 1.0.2
The shield uses rendered title-text rectangles rather than the full header flex container. Candidate positions are checked against existing interactive controls. If neither side of the title fits, a free corner is used; if all candidates collide the shield is hidden rather than covering an existing action. The shield remains outside WhatsApp layout. No message row styling or forced scrolling is introduced.

## Archived chat coverage in 1.0.3
Chat rows are now also discovered in semantic grids, #pane-side and chat-list containers outside #side, covering archived drawers mounted separately. Archived rows retain individual hover/focus reveal in either message mode. No WhatsApp layout or scroll position is modified. Live archived-list compatibility still requires an authorized WhatsApp check.

## Menu and shield fixes in 1.0.4
Blur masks cut out visible menu/dialog bounds, including partial overlaps that miss a row center. Negative-tabindex layout wrappers no longer count as shield obstacles. Heading selectors and additional free positions in the top area provide fallbacks when the original title selector is absent. Original source remains preserved. Validate live WhatsApp menus and icon placement after refreshing the extension or replacing the console script.

## Repository migration and maintenance

The v1.0.4 Chrome, Edge and Firefox packages are preserved byte-for-byte in `packages/`, with their original checksums and `release.json` metadata. Node regression tests verify each package, its manifest and hashes, and compare its files with the freshly generated build. The dependency lock was corrected to the pinned canvas 1.0.2 version used by existing builds.

Rebuild candidates under `dist/`, verify them and complete live browser checks before promoting a future release into `packages/`. Update `release.json` and checksums, commit the tested artifacts and push `v{version}`. Then update the website release metadata to the version-tagged download and checksum URLs. Build output ZIP metadata can differ from published archives; tests compare packaged file contents and separately verify published archive checksums.

No real account or messages were accessed during this migration. Existing synthetic test results do not establish current live WhatsApp compatibility.
