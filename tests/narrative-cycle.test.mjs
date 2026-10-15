import assert from "node:assert/strict";
import test from "node:test";
import { getNextNarrativeStep } from "../src/components/narrative-home/narrativeCycle.mjs";

test("advances through the four stages without changing narrative early", () => {
  assert.deepEqual(getNextNarrativeStep(0, 0, 3), {
    conceptIndex: 0,
    stageIndex: 1,
    conceptChanged: false,
  });
  assert.deepEqual(getNextNarrativeStep(1, 2, 3), {
    conceptIndex: 1,
    stageIndex: 3,
    conceptChanged: false,
  });
});

test("moves to the next narrative only after stage four", () => {
  assert.deepEqual(getNextNarrativeStep(0, 3, 3), {
    conceptIndex: 1,
    stageIndex: 0,
    conceptChanged: true,
  });
});

test("loops Entertainment AI back to Agentic AI", () => {
  assert.deepEqual(getNextNarrativeStep(2, 3, 3), {
    conceptIndex: 0,
    stageIndex: 0,
    conceptChanged: true,
  });
});
