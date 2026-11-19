const specialistGuards: Record<string, "mantis" | "ram" | "weaver" | "array"> =
  {
    "guard-source-alg-02": "mantis",
    "guard-source-alg-04": "mantis",
    "guard-source-alg-06": "mantis",
    "guard-source-alg-08": "mantis",
    "guard-source-alg-10": "mantis",
    "guard-source-ds-02": "ram",
    "guard-source-ds-03": "ram",
    "guard-source-ds-04": "ram",
    "guard-source-ds-06": "ram",
    "guard-source-ds-07": "weaver",
    "guard-source-ds-08": "weaver",
    "guard-source-ds-09": "weaver",
    "guard-source-ds-10": "weaver",
    "guard-source-ai-02": "array",
    "guard-source-ai-04": "array",
    "guard-source-ai-06": "array",
    "guard-source-ai-08": "array",
    "guard-source-ai-09": "array",
  };

export function enemyArchetype(id: string) {
  if (Object.hasOwn(specialistGuards, id)) return specialistGuards[id];
  if (id.startsWith("echo")) return "echo";
  if (id.includes("checkpoint-echo")) return "echo";
  if (id.includes("quartermaster")) return "drone";
  if (id.includes("warden")) return "warden";
  if (id.includes("keeper")) return "keeper";
  if (id.includes("mimic")) return "mimic";
  if (id.startsWith("guard-source-alg")) return "interceptor";
  if (id.startsWith("guard-source-ds")) return "drone";
  if (id.startsWith("guard-source-ai")) return "decoy";
  if (id.includes("reward-seeker")) return "decoy";
  return "sentinel";
}

export const enemyThreatName = (id: string) =>
  ({
    echo: "Reconstructed Chassis",
    warden: "Firewall Warden",
    keeper: "Cache Vault Keeper",
    mimic: "Phishing Mimic",
    interceptor: "Packet Sniffer",
    drone: "Tracking Cookie",
    decoy: "Spam Decoy",
    mantis: "Relay Mantis",
    ram: "Buffer Ram",
    weaver: "Graph Weaver",
    array: "Inference Array",
    sentinel: "Gateway Sentinel",
  })[enemyArchetype(id)];
