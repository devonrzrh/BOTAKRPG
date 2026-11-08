import { expect, it } from "vitest";
import { enemyArchetype, enemyThreatName } from "../src/game/enemyIdentity";

it.each([
  ["echo-7", "echo", "Network Worm ECHO-7"],
  ["route-warden", "warden", "Firewall Warden"],
  ["archive-keeper", "keeper", "Cache Vault Keeper"],
  ["signal-mimic", "mimic", "Phishing Mimic"],
  ["guard-source-alg-00", "interceptor", "Packet Sniffer"],
  ["guard-source-ds-05", "drone", "Tracking Cookie"],
  ["guard-source-ai-10", "decoy", "Spam Decoy"],
  ["sentinel-a-03", "sentinel", "Gateway Sentinel"],
  ["future-unknown-id", "sentinel", "Gateway Sentinel"],
])("identifies %s without loading rendering code", (id, kind, label) => {
  expect(enemyArchetype(id)).toBe(kind);
  expect(enemyThreatName(id)).toBe(label);
});
