# Peek 'n Sneak reference study

Reference: [Sneak'n Peek for the Atari 2600](https://www.youtube.com/watch?v=WZsCDIfyh6A), 235 seconds.

Downloaded with yt-dlp and decoded with ffmpeg. Inspected a complete contact sheet sampled every **5 seconds**, including the opening, rooms, yard, and repeated hiding/seeking transitions. The original video and reference images stay outside the shipped application, under `/tmp/peek-n-sneak-reference`.

| Video segment | Observations carried into the recreation |
| --- | --- |
| 00:05–00:15 | Blue nighttime sky, black house, tiny window rectangles, irregular pathway and chimney smoke. |
| 00:20–01:20 | Lavender living room, darker left wall, empty olive floor, bright green block couch, two dark blue divided windows. |
| 01:25–01:45 | Orange bedroom, olive floor, white slanted bed, olive closet opening. |
| 01:50–02:20 | Purple bedroom, red floor, simple white bed and black edge doorway. |
| 02:25–02:55 | Yard exploration and bizarre edge/walkway hiding locations. |
| 03:00–03:50 | Hiding and seeking alternate; timer starts at 50; thin gray/beige player silhouettes and no-peeking pose. |

The video’s palette differs from the color names used in the original manual. The recreation follows the **video’s colors** and retains the manual’s names for the blue and pink bedrooms.

[Original U.S. Games instructions, transcribed at AtariAge](https://www.atariage.com/2600/manuals_old/sneak_n_peek.html) were used to verify room names, five hiding places per scene, entry directions, and the seeking clock running four times slower than the hiding clock.

## Intentional browser adaptations

- Phaser 3.90's actual Canvas renderer, 320 × 208 logical surface; flat programmatic geometry, nearest-neighbor scaling, optional CRT scanlines, and tiny articulated rectangular sprites.
- Hold HIDE / PEEK instead of accidental hiding for accessible phone play. Expert mode retains directional entry and smaller activation regions.
- Four-round matches with role swaps, points, and elapsed seeking time as tiebreaker. The solo bot can both hide and seek; the original computer mode only hid.
- Houston retains the original four-scene structure. Dallas moves selected hiding spots each round. Merrimac Street in Corpus Christi has two playable three-room houses, a shared street, and exactly one non-playable neighbor between the houses.
- Online matches use server-authoritative snapshots with ~120 ms polling, serialized via SQLite compare-and-swap. No peer-to-peer NAT or external signaling dependency. This is live networked play, not a local multiplayer placeholder.
- Hiding coordinates, spot IDs, and in-progress hiding targets are removed from seeker responses. The bot searches a randomized room/spot itinerary that never reads the hidden target.
