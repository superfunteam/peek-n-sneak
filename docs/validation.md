# Validation

Completed during implementation:

- `npm run typecheck`: TypeScript passes.
- `npm test`: 21 engine checks pass, including all 75 hiding spots across three neighborhoods, room graph connectivity, original clock speed, directional expert mode, alternating roles, bot navigation, bot independence from secret state, and per-player privacy.
- `npm run test:multiplayer`: two independent authenticated HTTP clients pass creation, joining, full-room rejection, input validation, simultaneous input updates, private hiding, finding/scoring, reconnect, and leaving against the local D1-backed API.
- `npm run build`: production Cloudflare Worker and browser client compile successfully.
- Generated SQL migration reviewed and applied to the local database.
- Supplied video decoded and inspected at five-second intervals; generated OG card inspected for correct title/copy and dimensions.

Browser UI testing was not requested, and the Sites skill does not permit unsolicited browser QA. The local preview was handed to Codex. Cross-device visual/touch behavior therefore remains an explicit validation gap.

The progressive WebMCP `start_solo_hide_and_seek` command feature-detects support, rejects invalid neighborhoods, uses the same start action as the UI, and unregisters when its lifecycle ends. A supported WebMCP validation context was not available; its runtime contract has not been verified.
