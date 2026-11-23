import { Box, Coins } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { Content, Item } from "../content/schema";
import { supplyPool } from "../game/gacha";
import { crateOpeningMs } from "../game/supplyCratePresentation";
import type { Save } from "../game/state";
import { useGameParticles } from "./GameParticles";
import { useGameSound } from "./GameSound";
import { SupplyIcon } from "./SupplyIcon";
import { RpgIcon } from "./RpgIcon";
import "./SupplyLocker.css";

const itemEffects = {
  weapon: (amount: number) => `+${amount} Attack`,
  armor: (amount: number) => `+${amount} Defense`,
  healing: (amount: number) => `Restore ${amount} HP`,
  focus: (amount: number) => `Restore ${amount} Focus`,
};
const chanceFormat = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});
const SupplyCrateCanvas = lazy(() => import("../world/SupplyCrateCanvas"));

type Draw = {
  item: Item;
  sequence: number;
  before?: Save["supply"];
  openingAt?: number;
};

function ItemDetails({ item }: { item: Item }) {
  return (
    <div className="supply-item-details">
      <strong>{item.title}</strong>
      <span data-rarity={item.rarity}>{item.rarity}</span>
      <span>{itemEffects[item.kind](item.amount)}</span>
    </div>
  );
}

export function SupplyLocker({
  save,
  content,
  onDraw,
  onEquip,
}: {
  save: Save;
  content: Content;
  onDraw: () => Item | undefined;
  onEquip: (rewardId: string) => void;
}) {
  const [draw, setDraw] = useState<Draw>();
  const timer = useRef<number | undefined>(undefined);
  const stage = useRef<HTMLDivElement>(null);
  const sound = useGameSound();
  const particles = useGameParticles();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const opening = !!draw?.before;
  const reward = opening ? undefined : draw?.item;
  const { tokens, equipped } = save.supply;
  const { items } = draw?.before ?? save.supply;
  const pool = supplyPool(
    draw?.before ? { ...save, supply: draw.before } : save,
    content,
  );
  const totalWeight = pool.reduce((total, item) => total + item.weight, 0);
  const owned = content.entities.filter(
    (entity): entity is Item => entity.type === "item" && items[entity.id] > 0,
  );
  const drawAvailable = tokens > 0 && pool.length > 0;

  function startDraw() {
    if (!drawAvailable || opening || timer.current !== undefined) return;
    const item = onDraw();
    if (!item) return;

    const result = { item, sequence: (draw?.sequence ?? 0) + 1 };
    sound("blocked");
    if (
      save.settings.reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDraw(result);
      sound("clue");
      return;
    }

    setDraw({ ...result, before: save.supply, openingAt: performance.now() });
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setDraw(result);
      sound("clue");
      const bounds = stage.current?.getBoundingClientRect();
      if (bounds) {
        particles(item.rarity === "epic" ? "levelUp" : "success", {
          x: bounds.left + bounds.width / 2,
          y: bounds.top + bounds.height * 0.42,
        });
      }
    }, crateOpeningMs);
  }

  return (
    <div className="supply-locker">
      <section className="supply-draw" aria-label="Supply draw">
        <div
          className="supply-result"
          data-phase={opening ? "opening" : reward ? "revealed" : "ready"}
          data-rarity={reward?.rarity}
        >
          <div className="supply-stage" ref={stage} aria-hidden="true">
            {!reward && <Box className="supply-fallback" size={68} />}
            <Suspense fallback={null}>
              <SupplyCrateCanvas
                key={save.settings.renderer}
                renderer={save.settings.renderer}
                openingAt={draw?.openingAt}
                opened={!!reward}
                reseal={(draw?.sequence ?? 0) > 1}
                shadows={save.settings.shadows}
              />
            </Suspense>
            {reward && (
              <div className="supply-emblem" key={draw?.sequence}>
                <SupplyIcon item={reward} size={66} />
              </div>
            )}
          </div>
          <div
            className="supply-result-copy"
            role="status"
            aria-label="Draw result"
          >
            {reward ? (
              <div className="supply-reward-copy" key={draw?.sequence}>
                <ItemDetails item={reward} />
                {(reward.kind === "healing" || reward.kind === "focus") && (
                  <span className="supply-count">
                    {items[reward.id]} in locker
                  </span>
                )}
              </div>
            ) : opening ? (
              <p>Opening box…</p>
            ) : null}
          </div>
        </div>
        <div className="supply-controls">
          <p className="supply-balance">
            <Coins size={20} aria-hidden="true" />
            {tokens} Supply {tokens === 1 ? "Token" : "Tokens"}
          </p>
          <button
            type="button"
            className="primary"
            aria-disabled={!drawAvailable || opening}
            onClick={startDraw}
          >
            <RpgIcon name="items" />
            Open box · 1 token
          </button>
        </div>
        <p className="supply-token-source">
          Earn 1 token for each first clear.
        </p>
        <details className="supply-odds">
          <summary>Draw odds</summary>
          {pool.length ? (
            <ul>
              {pool.map((item) => (
                <li key={item.id}>
                  <span className="supply-icon-label">
                    <SupplyIcon item={item} size={20} />
                    {item.title}
                  </span>
                  <span>{chanceFormat.format(item.weight / totalWeight)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No supplies available to draw.</p>
          )}
        </details>
      </section>

      <section
        className="supply-loadout"
        aria-labelledby="supply-loadout-title"
      >
        <h3 id="supply-loadout-title">Loadout</h3>
        <dl className="supply-slots">
          <div>
            <dt className="supply-icon-label">
              <RpgIcon name="skills" size={20} /> Weapon
            </dt>
            <dd>
              {owned.find((item) => item.id === equipped.weapon)?.title ??
                "Unequipped"}
            </dd>
          </div>
          <div>
            <dt className="supply-icon-label">
              <RpgIcon name="brace" size={20} /> Armor
            </dt>
            <dd>
              {owned.find((item) => item.id === equipped.armor)?.title ??
                "Unequipped"}
            </dd>
          </div>
        </dl>
        {owned.length > 0 && (
          <ul className="supply-owned" aria-label="Owned supplies">
            {owned.map((item) => {
              const kind = item.kind;
              const gear = kind === "weapon" || kind === "armor";
              const worn = gear && equipped[kind] === item.id;
              const action = worn ? "Unequip" : "Equip";
              return (
                <li key={item.id} data-equipped={worn || undefined}>
                  <SupplyIcon item={item} size={30} />
                  <div className="supply-owned-detail">
                    <ItemDetails item={item} />
                    <p>{item.description}</p>
                  </div>
                  {gear ? (
                    <button
                      type="button"
                      aria-label={`${action} ${item.title}`}
                      onClick={() => onEquip(item.id)}
                    >
                      {action}
                    </button>
                  ) : (
                    <span className="supply-count">×{items[item.id]}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
