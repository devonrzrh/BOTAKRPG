import { describe, expect, it } from "vitest";
import raw from "../src/generated/content.json";
import { validateContent } from "../src/content/schema";
import { initialSave, parseSave } from "../src/game/state";

const content = validateContent(raw);
const experiment = {
  samples: [
    { x: -0.5, y: 0.25, label: 0 as const },
    { x: 0.7, y: 0.4, label: 1 as const },
  ],
  network: { weights: [0.3, -0.2] as [number, number], bias: 0.1, epochs: 20 },
  rate: 0.2,
  epochs: 10,
  label: 1 as const,
  tested: true,
};

describe("signal experiment save data", () => {
  it("defaults old saves to no saved experiment and round-trips valid state", () => {
    const initial = initialSave();
    const legacy = { ...initial } as Record<string, unknown>;
    delete legacy.signalExperiment;
    expect(parseSave(legacy, content).signalExperiment).toBeNull();

    const save = { ...initial, signalExperiment: experiment };
    expect(parseSave(JSON.parse(JSON.stringify(save)), content)).toEqual(save);
  });

  it("rejects malformed experiments without mutating the imported save", () => {
    const original = { ...initialSave(), signalExperiment: experiment };
    const cases = [
      { ...experiment, samples: [{ x: Number.NaN, y: 0, label: 0 }] },
      { ...experiment, samples: [{ x: 1.01, y: 0, label: 0 }] },
      {
        ...experiment,
        samples: Array.from({ length: 201 }, () => ({ x: 0, y: 0, label: 0 })),
      },
      { ...experiment, network: { ...experiment.network, bias: Infinity } },
      { ...experiment, network: { ...experiment.network, epochs: 1_000_001 } },
      { ...experiment, rate: 0 },
      { ...experiment, epochs: 101 },
      { ...experiment, label: 2 },
      { ...experiment, tested: "yes" },
    ];
    for (const invalid of cases)
      expect(() =>
        parseSave({ ...original, signalExperiment: invalid }, content),
      ).toThrow();
    expect(() => parseSave(original, content)).not.toThrow();
    expect(original.signalExperiment).toEqual(experiment);
  });
});
