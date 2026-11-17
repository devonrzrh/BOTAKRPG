export function enemyArchetype(id: string) {
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
    sentinel: "Gateway Sentinel",
  })[enemyArchetype(id)];
