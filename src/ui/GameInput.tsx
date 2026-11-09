import { useEffect, useState, type ReactNode } from "react";
import {
  createPadRepeater,
  gamepadActions,
  type PadAction,
} from "../game/gamepad";
import { directionalIndex, type FocusDirection } from "../game/focusNavigation";
import "./GameInput.css";

const controls =
  'button,a[href],input:not([type="hidden"]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
const editing =
  'input,textarea,select,[contenteditable="true"],.cm-editor,.blocklyDiv';
const arrowKeys: Record<string, FocusDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};
const padKeys: Partial<Record<PadAction, string>> = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

export function GameInput({ children }: { children: ReactNode }) {
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    let modality = "pointer",
      virtual = false,
      frame = 0,
      repairFrame = 0;
    let padId = "",
      scopeBefore: HTMLElement | null = null;
    let lastFocused: HTMLElement | null = null;
    let scopeLabelBefore = "";
    const returns = new WeakMap<HTMLElement, HTMLElement>();
    const heldKeys = new Map<string, Element>();
    const repeater = createPadRepeater();
    const app = () => document.querySelector<HTMLElement>(".app");
    const available = (element: HTMLElement) =>
      !element.matches(':disabled,[aria-disabled="true"],[hidden]') &&
      !element.closest('[inert],[hidden],[aria-hidden="true"]') &&
      getComputedStyle(element).display !== "none" &&
      getComputedStyle(element).visibility !== "hidden" &&
      element.getClientRects().length > 0;
    const topModal = () =>
      [
        ...document.querySelectorAll<HTMLElement>(
          '[role="dialog"],.book-reader,.evade',
        ),
      ]
        .filter(available)
        .at(-1);
    const scope = () =>
      topModal() ??
      [
        ...document.querySelectorAll<HTMLElement>(
          ".activity-panel,.world-keyboard-ui",
        ),
      ]
        .filter(available)
        .at(-1) ??
      app();
    const focusables = (root = scope()) =>
      root
        ? [...root.querySelectorAll<HTMLElement>(controls)].filter(available)
        : [];
    const focus = (element?: HTMLElement) => {
      element?.focus({ preventScroll: true });
      if (element && !element.closest(".world-keyboard-ui"))
        element.scrollIntoView({ block: "nearest", inline: "nearest" });
    };
    const primary = () => {
      const list = focusables();
      return (
        list.find((el) =>
          el.matches(
            ".dialogue-choices button,.primary,.puzzle-primary,.battle-skill-options button",
          ),
        ) ?? list[0]
      );
    };
    const setMode = (mode: string) => {
      modality = mode;
      const root = app();
      if (root) root.dataset.inputMode = mode;
    };
    const isWorld = (target: Element | null) =>
      !topModal() &&
      Boolean(
        app()?.matches(
          ".maze-manual.gameplay-maze,.network-view.gameplay-explore",
        ),
      ) &&
      (!target ||
        target === document.body ||
        target.matches("canvas") ||
        Boolean(
          target.closest(".dpad,.maze-content > .segmented > button.selected"),
        ));
    const moveFocus = (direction: FocusDirection) => {
      const list = focusables(
        document.activeElement?.closest<HTMLElement>(".topbar") ?? scope(),
      );
      const index = directionalIndex(
        list.map((el) => el.getBoundingClientRect()),
        list.indexOf(document.activeElement as HTMLElement),
        direction,
      );
      if (index >= 0) focus(list[index]);
    };
    const cycleFocus = (delta: number) => {
      const list = focusables();
      if (!list.length) return;
      const current = list.indexOf(document.activeElement as HTMLElement);
      focus(
        list[
          current < 0
            ? delta < 0
              ? list.length - 1
              : 0
            : (current + delta + list.length) % list.length
        ],
      );
    };
    const openMenu = () => {
      if (!topModal())
        focus(app()?.querySelector<HTMLElement>(".menu-trigger") ?? undefined);
      else focus(primary());
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!virtual) setMode("keyboard");
      if (
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.defaultPrevented
      )
        return;
      const target = event.target instanceof Element ? event.target : null;
      if (event.key === "F10") {
        event.preventDefault();
        event.stopPropagation();
        openMenu();
        return;
      }
      if (target?.closest(".cm-editor,.blocklyDiv")) return;
      if (event.key === "Tab" && topModal()) {
        const list = focusables();
        const index = list.indexOf(document.activeElement as HTMLElement);
        if (
          list.length &&
          (index < 0 ||
            (!event.shiftKey && index === list.length - 1) ||
            (event.shiftKey && index === 0))
        ) {
          event.preventDefault();
          event.stopPropagation();
          focus(event.shiftKey ? list.at(-1) : list[0]);
        }
        return;
      }
      const direction = arrowKeys[event.key];
      if (
        !direction ||
        target?.closest(editing) ||
        isWorld(target) ||
        (target?.matches("canvas") && app()?.classList.contains("home-view")) ||
        target?.closest('.menu-bar,[data-game-navigation="native"],.evade svg')
      )
        return;
      if (
        target?.closest(".book-reader") &&
        (["ArrowLeft", "ArrowRight"].includes(event.key) ||
          target.matches("article,pre"))
      )
        return;
      if (target?.closest(".tutorial-card")) return;
      if (target?.closest(".prologue") && event.key === "ArrowRight") return;
      event.preventDefault();
      event.stopPropagation();
      moveFocus(direction);
    };
    const pointer = () => setMode("pointer");
    const rememberFocus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) lastFocused = event.target;
    };
    const emitKey = (
      key: string,
      target: Element = document.activeElement ?? document.body,
      type = "keydown",
    ) => {
      const event = new KeyboardEvent(type, {
        key,
        bubbles: true,
        cancelable: true,
      });
      virtual = true;
      try {
        target.dispatchEvent(event);
      } finally {
        virtual = false;
      }
      return event.defaultPrevented;
    };
    const releaseKeys = () => {
      for (const [key, target] of heldKeys)
        emitKey(key, target.isConnected ? target : document.body, "keyup");
      heldKeys.clear();
    };
    const scroll = (amount: number) => {
      const root = scope();
      if (!root) return;
      const active = document.activeElement;
      const candidates = [
        active,
        ...root.querySelectorAll(
          ".reader-viewport,.battle-decision,.puzzle-main",
        ),
        root,
      ];
      const viewport = candidates.find(
        (el): el is HTMLElement =>
          el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 2,
      );
      viewport?.scrollBy({ top: amount, behavior: "instant" });
    };
    const confirm = () => {
      const active = document.activeElement as HTMLElement | null;
      if (emitKey("Enter")) return;
      if (
        active?.matches(
          "button,a[href],summary,input[type=checkbox],input[type=radio]",
        )
      )
        active.click();
      else if (!active?.closest(editing)) {
        const target = primary();
        if (target instanceof HTMLElement) target.click();
      }
    };
    const adjust = (action: PadAction) => {
      const active = document.activeElement;
      const delta = action === "right" || action === "up" ? 1 : -1;
      if (
        active instanceof HTMLInputElement &&
        ["range", "number"].includes(active.type)
      ) {
        try {
          if (delta > 0) active.stepUp();
          else active.stepDown();
          active.dispatchEvent(new Event("input", { bubbles: true }));
          active.dispatchEvent(new Event("change", { bubbles: true }));
        } catch {
          /* invalid number is left for keyboard editing */
        }
        return true;
      }
      if (active instanceof HTMLSelectElement) {
        const next = Math.max(
          0,
          Math.min(active.options.length - 1, active.selectedIndex + delta),
        );
        active.selectedIndex = next;
        active.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    };
    const action = (command: PadAction) => {
      if (command === "confirm") confirm();
      else if (command === "back") {
        if (document.querySelector(".onboarding"))
          focusables()
            .find((el) => el.textContent?.trim() === "Back")
            ?.click();
        else emitKey("Escape");
      } else if (command === "menu") openMenu();
      else if (command === "world") {
        const canvas = app()?.querySelector<HTMLElement>("canvas");
        if (
          canvas &&
          !topModal() &&
          app()?.matches(".maze-manual.gameplay-maze,.gameplay-explore")
        )
          focus(canvas);
      } else if (command === "previous" || command === "next") {
        if (document.querySelector(".book-reader")) {
          if (!emitKey(command === "next" ? "PageDown" : "PageUp"))
            scroll(command === "next" ? 300 : -300);
        } else cycleFocus(command === "next" ? 1 : -1);
      } else if (command === "scrollUp" || command === "scrollDown")
        scroll(command === "scrollDown" ? 150 : -150);
      else if (padKeys[command]) {
        if (adjust(command)) return;
        const target = document.activeElement;
        if (
          target?.matches(".reader-fullscreen article") &&
          (command === "up" || command === "down")
        )
          scroll(command === "down" ? 100 : -100);
        else emitKey(padKeys[command]!);
      }
    };
    const repair = () => {
      repairFrame = 0;
      const root = scope(),
        active = document.activeElement as HTMLElement | null;
      const label = root?.getAttribute("aria-label") ?? "";
      if (modality === "pointer") {
        scopeBefore = root;
        scopeLabelBefore = label;
        return;
      }
      if (isWorld(active)) {
        scopeBefore = root;
        scopeLabelBefore = label;
        if (active === document.body)
          focus(app()?.querySelector<HTMLElement>("canvas") ?? undefined);
        return;
      }
      if (root !== scopeBefore || label !== scopeLabelBefore) {
        if (scopeBefore && active && available(active))
          returns.set(scopeBefore, active);
        scopeBefore = root;
        scopeLabelBefore = label;
        if (root && active && !root.contains(active))
          focus(
            returns.get(root) && available(returns.get(root)!)
              ? returns.get(root)
              : primary(),
          );
      }
      if (
        !active ||
        active === document.body ||
        !active.isConnected ||
        active.matches(":disabled") ||
        active.closest("[inert]")
      ) {
        const group = lastFocused?.closest<HTMLElement>(
          ".puzzle-board,.battle-answer-options,.battle-skill-options,.learning-options",
        );
        const nearby =
          group?.isConnected && root?.contains(group) ? focusables(group) : [];
        if (nearby.length && lastFocused) {
          const previous = lastFocused.getBoundingClientRect();
          nearby.sort((a, b) => {
            const distance = (element: HTMLElement) => {
              const rect = element.getBoundingClientRect();
              return (
                Math.abs(rect.left - previous.left) +
                Math.abs(rect.top - previous.top)
              );
            };
            return distance(a) - distance(b);
          });
          focus(nearby[0]);
        } else focus(primary());
      }
    };
    const observer = new MutationObserver(() => {
      if (!repairFrame) repairFrame = requestAnimationFrame(repair);
    });
    scopeBefore = scope();
    scopeLabelBefore = scopeBefore?.getAttribute("aria-label") ?? "";
    if (app())
      observer.observe(app()!, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["disabled", "inert", "hidden"],
      });
    const reset = () => {
      releaseKeys();
      repeater.reset();
    };
    const poll = (now: number) => {
      if (!document.hidden && document.hasFocus()) {
        let pad: Gamepad | undefined;
        try {
          pad = [...(navigator.getGamepads?.() ?? [])].find(
            (item): item is Gamepad =>
              Boolean(item?.connected && item.mapping === "standard"),
          );
        } catch {
          /* unsupported or disallowed Gamepad API */
        }
        const id = pad ? `${pad.index}:${pad.id}` : "";
        if (id !== padId) {
          reset();
          padId = id;
          setAnnouncement(
            pad
              ? "Controller connected. A confirms, B goes back, Start opens menu controls."
              : "Controller disconnected. Keyboard controls remain available.",
          );
        }
        if (!pad) {
          releaseKeys();
          frame = requestAnimationFrame(poll);
          return;
        }
        const input = repeater.sample(
          pad ? gamepadActions(pad) : new Set(),
          now,
        );
        const active = document.activeElement;
        const moving =
          isWorld(active) || Boolean(active?.matches(".evade svg"));
        const desired = new Set(
          moving
            ? [...input.held].flatMap((item) =>
                padKeys[item] ? [padKeys[item]!] : [],
              )
            : [],
        );
        for (const [key, target] of heldKeys)
          if (!desired.has(key) || target !== active) {
            emitKey(key, target.isConnected ? target : document.body, "keyup");
            heldKeys.delete(key);
          }
        for (const key of desired)
          if (!heldKeys.has(key)) {
            setMode("controller");
            const target = active ?? document.body;
            emitKey(key, target);
            heldKeys.set(key, target);
          }
        for (const command of input.fired) {
          if (moving && padKeys[command]) continue;
          setMode("controller");
          action(command);
        }
      } else reset();
      frame = requestAnimationFrame(poll);
    };
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("focusin", rememberFocus, true);
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("blur", reset);
    frame = requestAnimationFrame(poll);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(repairFrame);
      observer.disconnect();
      reset();
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("focusin", rememberFocus, true);
      document.removeEventListener("visibilitychange", reset);
      window.removeEventListener("blur", reset);
    };
  }, []);
  return (
    <>
      {children}
      <span className="input-announcement" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
