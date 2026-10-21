# Color Cascade source

Original game by Boran, retrieved from GeneralBobi/color-cascade-game, branch feat/color-cascade-game, commit d96df68a2846e7648a10148e2fcf082aa99ef886 on 21 October 2026 at the owner's request.

The three frontend files here are unmodified source references. The integrated game uses src/games/color-cascade/engine.ts and src/ui/ColorCascade.tsx. It retains the original color order, three lives, 10 × combo scoring, life recovery at combo multiples of five, and lane growth after three and seven completed sequences. Movement now uses elapsed time, duplicate touch/click activation is avoided, and the stand supplies bilingual instructions, pause, shared-player reset and persistent scores.
