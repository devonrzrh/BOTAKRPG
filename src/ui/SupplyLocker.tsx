import { Coins, Crosshair, Package, Plus, Shield, Zap } from "lucide-react";
import type { Content, Item } from "../content/schema";
import { supplyPool } from "../game/gacha";
import type { Save } from "../game/state";
import "./SupplyLocker.css";

const itemIcons = {
  weapon: Crosshair,
  armor: Shield,
  healing: Plus,
  focus: Zap,
};
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
  reward,
  onDraw,
  onEquip,
}: {
  save: Save;
  content: Content;
  reward?: Item | null;
  onDraw: () => void;
  onEquip: (rewardId: string) => void;
}) {
  const { tokens, items, equipped } = save.supply;
  const pool = supplyPool(save, content);
  const totalWeight = pool.reduce((total, item) => total + item.weight, 0);
  const owned = content.entities.filter(
    (entity): entity is Item => entity.type === "item" && items[entity.id] > 0,
  );
  const RewardIcon = reward ? itemIcons[reward.kind] : Package;
  const drawAvailable = tokens > 0 && pool.length > 0;

  return (
    <div className="supply-locker">
      <section className="supply-draw" aria-label="Supply draw">
        <div className="supply-result" role="status" aria-label="Draw result">
          <div className="supply-emblem" data-rarity={reward?.rarity}>
            <RewardIcon size={32} aria-hidden="true" />
          </div>
          {reward ? (
            <>
              <ItemDetails item={reward} />
              {(reward.kind === "healing" || reward.kind === "focus") && (
                <span className="supply-count">
                  {items[reward.id]} in locker
                </span>
              )}
            </>
          ) : (
            <p>Draw a weapon, armor, or consumable.</p>
          )}
        </div>
        <div className="supply-controls">
          <p className="supply-balance">
            <Coins size={20} aria-hidden="true" />
            {tokens} Supply {tokens === 1 ? "Token" : "Tokens"}
          </p>
          <button
            type="button"
            className="primary"
            aria-disabled={!drawAvailable}
            onClick={() => {
              if (drawAvailable) onDraw();
            }}
          >
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
                  <span>{item.title}</span>
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
            <dt>Weapon</dt>
            <dd>
              {owned.find((item) => item.id === equipped.weapon)?.title ??
                "Unequipped"}
            </dd>
          </div>
          <div>
            <dt>Armor</dt>
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
              const Icon = itemIcons[kind];
              const gear = kind === "weapon" || kind === "armor";
              const worn = gear && equipped[kind] === item.id;
              const action = worn ? "Unequip" : "Equip";
              return (
                <li key={item.id} data-equipped={worn || undefined}>
                  <Icon size={22} aria-hidden="true" />
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
