/* 사물별 색조 (2026-09-29 시안 승인 → 전부 적용).
   카탈로그 그림은 톤(회갈색)으로 그려지고, drawObject 가 여기 적힌 색조를 'color' 블렌드로 입힌다 — 명암은 그대로, 색만 바뀐다.
   여기 없는 사물은 원래 톤/등록색으로 그려진다. 호출 때 { tint: "#…" } 로 바꾸거나 { tint: false } 로 끌 수 있다. */
export const TINT = {
  // 풍경
  "mountain-range": "#5a80b8", "hill-set": "#5aa060", "bush-tree": "#245c3a", "grass-blades": "#2f7a45", "tree": "#2f8a4f",
  // 무대
  "drum-kick": "#b0713b", "drum-snare": "#b0713b", "hat-cymbal": "#d9a441", "tone-bell": "#d9a441",
  // 먹을 것
  "cookie": "#c8944e", "chocolate": "#7a4a2a", "pizza": "#e0a24a",
  // 소품
  "gacha-machine": "#e04a3a", "capsule": "#3b6fe0", "window": "#8a6a4a", "hat": "#3a3a5a", "bag": "#b0713b",
  "lamp": "#d9a441", "genie": "#4a7fd0", "cat": "#3a3a3a"
};
/** 풍경 장면의 하늘색 (패럴랙스·비교 슬라이더가 쓴다) */
export const SKY = "#d6e6f3";
