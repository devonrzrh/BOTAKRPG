import { Box, Coins } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Content, Item } from "../content/schema";
import { supplyPool } from "../game/gacha";
import type { Save } from "../game/state";
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
const openingDuration = 820;

type Draw = {
  item: Item;
  sequence: number;
  before?: Save["supply"];
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
  const sound = useGameSound();
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
    if (
      save.settings.reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDraw(result);
      sound("clue");
      return;
    }

    setDraw({ ...result, before: save.supply });
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setDraw(result);
      sound("clue");
    }, openingDuration);
  }

  return (
    <div className="supply-locker">
      <section className="supply-draw" aria-label="Supply draw">
        <div
          className="supply-result"
          data-phase={opening ? "opening" : reward ? "revealed" : "ready"}
          data-rarity={reward?.rarity}
          style={
            {
              "--supply-opening-time": `${openingDuration}ms`,
            } as React.CSSProperties
          }
        >
          <div
            className="supply-stage"
            aria-hidden="true"
            key={draw?.sequence ?? 0}
          >
            <div className="supply-reticle" />
            {reward && <div className="supply-burst" />}
            {reward ? (
              <div className="supply-emblem">
                <SupplyIcon item={reward} size={70} />
              </div>
            ) : (
              <div className="supply-crate">
                <div className="supply-crate-door" />
                <div className="supply-crate-door" />
                <span className="supply-crate-lock">
                  <Box size={24} />
                </span>
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
            ) : (
              <p>
                {opening
                  ? "Opening crate…"
                  : "Draw a weapon, armor, or consumable."}
              </p>
            )}
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
            Draw · 1 token
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
