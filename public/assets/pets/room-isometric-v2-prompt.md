# Isometric furniture

Built-in imagegen, 2026-09-18. Reference: room-atlas.png (preserved). Final file: room-isometric-v2.png, transparent 4 × 4 sheet. Runtime mapping and floor anchors: src/components/room/furnitureAtlas.ts.

Prompt: Create 16 isolated cozy pixel-art furniture sprites matching the reference's warm brown outlines, peach/sage/lavender palette and detailed textures. Redraw in 2:1 isometric projection with visible top/front/right faces. Equal square cells, transparent background, no text/grid/ground tiles. Row 1 sofa, coffee table, pet bed, floor lamp; row 2 flat round rug, bookshelf, cat tree, bird perch; row 3 terrarium, mouse tunnel, hay bale, aquarium; row 4 desk, plant on stool, padded bench, record player. Consistent upper-left light and room perspective.

Packing correction prompt: Keep all 16 designs, colors and positions. Shrink each object to the central 70% of its cell, leave at least 15% transparent padding, no pixels crossing cell boundaries. Especially shrink bookshelf, cat tree, lamp and desk. Keep transparent background and no grid or labels.
