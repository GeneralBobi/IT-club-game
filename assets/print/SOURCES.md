# Original DAU print identity

dau-primary-tr.pdf is the unmodified outlined CMYK primary Turkish lockup extracted from page 8 of the user-supplied 2020 DAU logo manual. The official emblem is placed at 33 mm in the A3 poster; all parts scale together. It is not a reconstruction.

## A3 v2 compact signature row

- `ogesim-tr-original.png` is a pixel-identical copy of `data/design-research/sources/ogesim-tr-navy.png`, the original directorate signature from the supplied event Drive kit (file `1suxLizzNw_KJVKqH6_ho2mz_PJvBujeH`). Only provenance metadata is added.
- `emu-rpg-original.png` is the complete EMU RPG mark cropped with its original transparent surrounding space from the supplied `footer-tr-light.png`, crop `(0, 0, 680, 680)`. No pixels inside the mark are redrawn or recolored. The footer source is Drive file `1GjmOEIzFfL3Oz3iF5W8fJV9SLyU5Axoe`.
- The real club mark remains `public/brand/itclub-original.png` without modification.
- A3 v2 uses one occurrence of each identity, including the complete official primary DAU signature. The previous duplicated DAU header/footer arrangement is not used.

Reproduce the revised deliverable with `python scripts/poster/build_a3_v2.py`. The previous build script and PDF are retained as the rejected historical version. The new page reconstructs the user's 584 x 748 screenshot composition from source vectors and type rather than scaling screenshot pixels. All output proofs are RGB screen previews; the actual print PDF is CMYK with FOGRA39 output intent.
