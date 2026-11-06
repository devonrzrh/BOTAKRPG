import { useEffect, useRef } from "react";
import { EditorState, StateEffect, StateField } from "@codemirror/state";
import {
  EditorView,
  Decoration,
  lineNumbers,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
const setLine = StateEffect.define<number>();
const lineField = StateField.define({
  create: () => Decoration.none,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const effect of tr.effects)
      if (effect.is(setLine)) {
        value =
          effect.value > 0 && effect.value <= tr.state.doc.lines
            ? Decoration.set([
                Decoration.line({ class: "execution-line" }).range(
                  tr.state.doc.line(effect.value).from,
                ),
              ])
            : Decoration.none;
      }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});
export default function CodeEditor({
  value,
  onChange,
  line,
  readOnly = false,
  onRun,
}: {
  value: string;
  onChange: (value: string) => void;
  line: number;
  readOnly?: boolean;
  onRun: () => void;
}) {
  const parent = useRef<HTMLDivElement>(null),
    view = useRef<EditorView | null>(null),
    change = useRef(onChange),
    run = useRef(onRun);
  change.current = onChange;
  run.current = onRun;
  useEffect(() => {
    const editor = (view.current = new EditorView({
      parent: parent.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(),
          history(),
          python(),
          highlightActiveLine(),
          lineField,
          EditorState.readOnly.of(readOnly),
          EditorView.contentAttributes.of({
            "aria-label": readOnly
              ? "Generated Python code"
              : "Python code editor",
          }),
          keymap.of([
            {
              key: "Mod-Enter",
              run: () => {
                run.current();
                return true;
              },
            },
            indentWithTab,
            ...defaultKeymap,
            ...historyKeymap,
          ]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) change.current(update.state.doc.toString());
          }),
          EditorView.theme({
            "&": {
              height: "100%",
              fontSize: "13px",
              backgroundColor: "#142622",
              color: "#e3e4d7",
            },
            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "Consolas, monospace",
              lineHeight: "1.8",
            },
            ".cm-gutters": {
              backgroundColor: "#142622",
              color: "#718479",
              border: "none",
            },
            ".cm-cursor": { borderLeftColor: "#e9bc74" },
            ".cm-activeLine": { backgroundColor: "#ffffff05" },
            ".cm-content": { padding: "15px 0" },
            "&.cm-focused": { outline: "none" },
            ".cm-selectionBackground": {
              backgroundColor: "#466f6066 !important",
            },
          }),
        ],
      }),
    }));
    return () => {
      editor.destroy();
      view.current = null;
    };
  }, [readOnly]);
  useEffect(() => {
    const editor = view.current;
    if (editor && editor.state.doc.toString() !== value)
      editor.dispatch({
        changes: { from: 0, to: editor.state.doc.length, insert: value },
      });
  }, [value]);
  useEffect(() => {
    view.current?.dispatch({ effects: setLine.of(line) });
  }, [line]);
  return <div ref={parent} className="code-editor" />;
}
