export const STAGE_DURATION_MS = 2200;
export const STAGE_COMPLETE_HOLD_MS = 500;
export const STAGE_COUNT = 4;

export function getNextNarrativeStep(conceptIndex, stageIndex, conceptCount) {
  if (stageIndex < STAGE_COUNT - 1) {
    return {
      conceptIndex,
      stageIndex: stageIndex + 1,
      conceptChanged: false,
    };
  }

  return {
    conceptIndex: (conceptIndex + 1) % conceptCount,
    stageIndex: 0,
    conceptChanged: true,
  };
}
