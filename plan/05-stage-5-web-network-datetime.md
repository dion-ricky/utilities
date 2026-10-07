# Stage 5 — Web/HTTP, Network & Date-Time (19 tools)

## Goal

Reference data, browser introspection, pure-math network tools (no lookups), and time utilities.

| # | Tool | Slug | Implementation |
|---|---|---|---|
| 1 | HTTP status codes | `http-status-codes` | static dataset (~60 codes); search; RFC links |
| 2 | MIME type lookup | `mime-types` | static dataset; search by extension or type |
| 3 | User agent parser | `user-agent-parser` | `ua-parser-js`; browser/OS/device tree |
| 4 | Keycode inspector | `keycode-inspector` | live `keydown` → `event.code/key/keyCode/modifiers`; capture notes |
| 5 | HTML previewer | `html-previewer` | sandboxed iframe (`sandbox="allow-scripts"`, srcdoc); optional console capture |
| 6 | URL query editor | `url-query-editor` | `URLSearchParams` grid; add/edit/delete; encoded toggle |
| 7 | cURL builder ⇄ parser | `curl-builder` | build from form; parse pasted curl → method/headers/body table (**no network request**) |
| 8 | IPv4 subnet calculator | `ipv4-subnet-calculator` | uint32 math: CIDR, mask, network/broadcast, hosts, wildcard |
| 9 | IPv4 range expander | `ipv4-range-expander` | range → minimal CIDR list |
| 10 | IPv4 ⇄ dec/hex/bin | `ipv4-converter` | all four octet-based representations at once |
| 11 | MAC address generator | `mac-generator` | `crypto.getRandomValues`; optional OUI prefix; separators case |
| 12 | IPv6 ULA generator | `ipv6-ula-generator` | RFC 4193 fd00::/8 random prefix |
| 13 | Random port generator | `random-port-generator` | avoid well-known/registered; custom ranges |
| 14 | Device information | `device-info` | navigator/screen/locale/battery/connection snapshot; copyable |
| 15 | Docker run → compose | `docker-run-to-compose` | `composerize-ts`; YAML preview |
| 16 | Date difference calculator | `date-difference` | y/m/d + total days/weekdays; inclusive/exclusive |
| 17 | Date add/subtract | `date-calculator` | add/sub y/m/w/d; timezone-safe |
| 18 | Timezone converter | `timezone-converter` | `Intl` + static zone list; meeting-time column grid |
| 19 | Chronometer/countdown | `chronometer` | native timers; laps; share-friendly |

## Acceptance criteria

- [ ] 19 tools deployed; all network math matches `ipcalc`-style references on a test matrix.
- [ ] No tool performs any network request (verified by an e2e "no requests" smoke test).
- [ ] Static datasets live in `src/data/` with source attribution.
- [ ] Release tagged.
