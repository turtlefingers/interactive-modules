/* 검사 페이지(/objects.html)에서 고른 타입 (2026-09-29 확정). 비어 있으면 첫 번째 타입을 쓴다.
   재작업 중: cat, fish, rabbit (10종 새로), cookie, drum-kick (디테일하게). house 는 세 타입 모두 승인 — 골고루 쓴다. */
export const PICKS = {
  "sprout": "B", "carrot": "A", "weed": "B", "radish": "A", "flower": "B", "tree": "C", "bush-tree": "B", "seed": "B",
  "potted-plant": "C", "cloud": "A", "moon": "C", "bird": "A", "owl": "A",
  "balloon": "A", "lamp": "A", "genie": "A", "window": "B", "target": "A", "turret": "A", "flag": "A", "dice": "A",
  "capsule": "A", "gacha-machine": "A", "pizza": "A", "chocolate": "B", "blob": "A", "pot": "A", "hat": "A", "glasses": "A",
  "scarf": "C", "bag": "C", "lightning": "A", "element-water": "A", "element-fire": "B", "element-earth": "B", "element-wind": "B",
  "photo-placeholder": "C",
  "hill-set": "B", "mountain-range": "A", "pond": "C", "sun-disc": "A", "grass-blades": "B", "fence": "C", "planet": "B",
  "drum-snare": "A", "hat-cymbal": "B", "tone-bell": "A", "stage-card": "C", "pool-table": "B", "knob": "A", "joystick-base": "A",
  "cursor-arrow": "A", "sticker-sheet": "C", "exclamation": "B",
  "house": "A"
};
/** 여러 타입을 골고루 써도 되는 사물 */
export const APPROVED_ALL = { house: ["A", "B", "C"] };
