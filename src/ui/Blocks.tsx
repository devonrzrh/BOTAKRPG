import { useEffect, useRef, useState } from "react";
import * as Blockly from "blockly/core";
import "blockly/blocks";
import * as En from "blockly/msg/en";
import { pythonGenerator, Order } from "blockly/python";
Blockly.setLocale(
  Object.fromEntries(
    Object.entries(En).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  ),
);
if (!Blockly.Blocks["academy_move"]) {
  Blockly.defineBlocksWithJsonArray([
    {
      type: "academy_move",
      message0: "move %1",
      args0: [
        {
          type: "field_dropdown",
          name: "DIRECTION",
          options: [
            ["north", "north"],
            ["east", "east"],
            ["south", "south"],
            ["west", "west"],
          ],
        },
      ],
      previousStatement: null,
      nextStatement: null,
      style: "explore_blocks",
    },
    {
      type: "academy_can_move",
      message0: "can move %1 ?",
      args0: [
        {
          type: "field_dropdown",
          name: "DIRECTION",
          options: [
            ["north", "north"],
            ["east", "east"],
            ["south", "south"],
            ["west", "west"],
          ],
        },
      ],
      output: "Boolean",
      style: "explore_blocks",
    },
    {
      type: "academy_at_goal",
      message0: "at the exit?",
      output: "Boolean",
      style: "explore_blocks",
    },
    {
      type: "academy_position",
      message0: "current cell",
      output: "Array",
      style: "explore_blocks",
    },
    {
      type: "academy_goal",
      message0: "exit cell",
      output: "Array",
      style: "explore_blocks",
    },
    {
      type: "academy_neighbors",
      message0: "neighbors of %1",
      args0: [{ type: "input_value", name: "CELL" }],
      output: "Array",
      style: "explore_blocks",
    },
  ]);
  pythonGenerator.forBlock["academy_move"] = (block) =>
    `move('${block.getFieldValue("DIRECTION")}')\n`;
  pythonGenerator.forBlock["academy_can_move"] = (block) => [
    `can_move('${block.getFieldValue("DIRECTION")}')`,
    Order.FUNCTION_CALL,
  ];
  pythonGenerator.forBlock["academy_at_goal"] = () => [
    "at_goal()",
    Order.FUNCTION_CALL,
  ];
  pythonGenerator.forBlock["academy_position"] = () => [
    "position()",
    Order.FUNCTION_CALL,
  ];
  pythonGenerator.forBlock["academy_goal"] = () => [
    "goal()",
    Order.FUNCTION_CALL,
  ];
  pythonGenerator.forBlock["academy_neighbors"] = (block, generator) => [
    `neighbors(${generator.valueToCode(block, "CELL", Order.NONE) || "position()"})`,
    Order.FUNCTION_CALL,
  ];
}
const toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Explore",
      colour: "160",
      contents: [
        "academy_move",
        "academy_can_move",
        "academy_at_goal",
        "academy_position",
        "academy_goal",
        "academy_neighbors",
      ].map((type) => ({ kind: "block", type })),
    },
    {
      kind: "category",
      name: "Logic",
      colour: "210",
      contents: [
        "controls_if",
        "logic_compare",
        "logic_operation",
        "logic_negate",
        "logic_boolean",
      ].map((type) => ({ kind: "block", type })),
    },
    {
      kind: "category",
      name: "Loops",
      colour: "120",
      contents: [
        "controls_repeat_ext",
        "controls_whileUntil",
        "controls_for",
        "controls_forEach",
        "controls_flow_statements",
      ].map((type) => ({ kind: "block", type })),
    },
    {
      kind: "category",
      name: "Numbers",
      colour: "230",
      contents: ["math_number", "math_arithmetic"].map((type) => ({
        kind: "block",
        type,
      })),
    },
    {
      kind: "category",
      name: "Lists",
      colour: "260",
      contents: [
        "lists_create_with",
        "lists_getIndex",
        "lists_setIndex",
        "lists_length",
        "lists_isEmpty",
        "lists_indexOf",
      ].map((type) => ({ kind: "block", type })),
    },
    {
      kind: "category",
      name: "Text",
      colour: "160",
      contents: ["text", "text_print"].map((type) => ({ kind: "block", type })),
    },
    { kind: "category", name: "Variables", colour: "330", custom: "VARIABLE" },
    { kind: "category", name: "Functions", colour: "290", custom: "PROCEDURE" },
  ],
};
const editorTheme = Blockly.Theme.defineTheme("academy-readable", {
  base: Blockly.Themes.Classic,
  name: "academy-readable",
  fontStyle: { family: "Arial, sans-serif", size: 18, weight: "normal" },
  blockStyles: {
    explore_blocks: {
      colourPrimary: "#275d50",
      colourSecondary: "#204d42",
      colourTertiary: "#173d34",
    },
    logic_blocks: { colourPrimary: "#2a4f75" },
    loop_blocks: { colourPrimary: "#365e30" },
    math_blocks: { colourPrimary: "#414b79" },
    text_blocks: { colourPrimary: "#2b5d55" },
    list_blocks: { colourPrimary: "#5a3f76" },
    variable_blocks: { colourPrimary: "#713b60" },
    variable_dynamic_blocks: { colourPrimary: "#713b60" },
    procedure_blocks: { colourPrimary: "#643e70" },
  },
});
export default function Blocks({
  initial,
  onChange,
  onCode,
}: {
  initial: unknown;
  onChange: (value: unknown) => void;
  onCode: (value: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null),
    workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null),
    change = useRef(onChange),
    code = useRef(onCode);
  change.current = onChange;
  code.current = onCode;
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(115);
  useEffect(() => {
    const workspace = Blockly.inject(host.current!, {
      toolbox,
      media: "/blockly-media/",
      theme: editorTheme,
      trashcan: true,
      scrollbars: true,
      zoom: {
        controls: false,
        wheel: true,
        startScale: 1.15,
        minScale: 1,
        maxScale: 2.5,
        scaleSpeed: 1.1,
      },
      grid: { spacing: 24, length: 2, colour: "#ccd5ca", snap: true },
      renderer: "zelos",
    });
    workspaceRef.current = workspace;
    try {
      if (initial) Blockly.serialization.workspaces.load(initial, workspace);
      else {
        const block = workspace.newBlock("academy_move");
        block.setFieldValue("east", "DIRECTION");
        block.initSvg();
        block.render();
        block.moveBy(40, 40);
      }
    } catch {
      workspace.clear();
      setError(
        "The saved block workspace could not be restored. Your Python code is still available.",
      );
    }
    const update = () => {
      try {
        code.current(pythonGenerator.workspaceToCode(workspace));
        change.current(Blockly.serialization.workspaces.save(workspace));
      } catch (e) {
        setError(String(e));
      }
    };
    workspace.addChangeListener((event) => {
      if (event.type === Blockly.Events.VIEWPORT_CHANGE)
        setZoom(Math.round(workspace.scale * 100));
      if (!event.isUiEvent) update();
    });
    update();
    const resize = new ResizeObserver(() => {
      Blockly.svgResize(workspace);
      workspace.scrollCenter();
    });
    resize.observe(host.current!);
    return () => {
      resize.disconnect();
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);
  const changeScale = (delta: number) => {
    const workspace = workspaceRef.current;
    if (workspace)
      workspace.setScale(Math.max(1, Math.min(2.5, workspace.scale + delta)));
  };
  return (
    <div className="blocks-editor">
      {error && <p role="alert">{error}</p>}
      <div
        className="blocks-toolbar"
        role="group"
        aria-label="Workspace controls"
      >
        <button
          type="button"
          onClick={() => changeScale(-0.15)}
          aria-label="Zoom out"
          disabled={zoom <= 100}
        >
          Zoom out
        </button>
        <button
          type="button"
          onClick={() => changeScale(0.15)}
          aria-label="Zoom in"
          disabled={zoom >= 250}
        >
          Zoom in
        </button>
        <output aria-label="Workspace zoom">{zoom}%</output>
        <button
          type="button"
          onClick={() => workspaceRef.current?.scrollCenter()}
          aria-label="Center blocks"
        >
          Center blocks
        </button>
        <button
          type="button"
          onClick={() => {
            const workspace = workspaceRef.current;
            if (workspace) {
              workspace.setScale(1.15);
              workspace.scrollCenter();
            }
          }}
          aria-label="Reset zoom to 115 percent"
        >
          Reset zoom (115%)
        </button>
      </div>
      <div
        ref={host}
        className="blocklyDiv"
        aria-label="Visual programming workspace"
      />
    </div>
  );
}
