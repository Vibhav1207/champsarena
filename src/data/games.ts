export interface GameInfo {
  slug: string;
  name: string;
  gameKey: string; // Database key (e.g. FREE_FIRE or POKEMON_VGC)
  description: string;
  keywords: string[];
  bannerUrl: string;
  logoUrl: string;
  genre: string;
  publisher: string;
  supportsSolo: boolean;
  supportsSquad: boolean;
  supportsDuels: boolean;
}

export const GAMES_DATA: Record<string, GameInfo> = {
  "pokemon": {
    slug: "pokemon",
    name: "Pokémon VGC & TCG",
    gameKey: "POKEMON_VGC",
    description: "Compete in official Pokémon VGC and TCG tournaments. Climb rankings, battle top trainers, earn championship points, and prove yourself in the arena.",
    keywords: ["pokemon tournaments", "pokemon online tournaments", "pokemon tcg tournaments", "pokemon vgc tournaments", "pokemon competition"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/pokemon-logo.png",
    genre: "Strategic Role-Playing / Card Game",
    publisher: "The Pokémon Company / Nintendo",
    supportsSolo: true,
    supportsSquad: false,
    supportsDuels: true
  },
  "free-fire": {
    slug: "free-fire",
    name: "Garena Free Fire",
    gameKey: "FREE_FIRE",
    description: "Join competitive Free Fire squad tournaments and custom room battles. Register with your squad, fight for survival, and win rewards.",
    keywords: ["free fire tournament", "free fire tournaments india", "free fire championship", "free fire esports", "free fire squad tournaments", "free fire custom room tournaments"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGW7-vBXzV5KsC7LXIfK2ot_cPNs1BvRxQf0sHBj6v53DPscGlH_j8DDNJLsA49-gvQHaA7Sr_3zqaf7h27ApQXPUfQhU38Z5Wgp8B6OIkcIyguC5WUEhA0a5rnCc0XF5yuKBjroVnBtoQwra4ilXJNqFl7no6UIkGdSF_x9iXqkY-P-NZUNF_qeyoU9Jrz7gEgBQ2WqVsf4QIVRkLK4P83cCEEs4dzFuPIqZLyKxMy1n8Ym93FtsPqsTpOWKPWZuHCbegLshT6V8",
    logoUrl: "/games/free-fire-logo.png",
    genre: "Battle Royale / Tactical Shooter",
    publisher: "Garena",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "bgmi": {
    slug: "bgmi",
    name: "Battlegrounds Mobile India",
    gameKey: "BGMI",
    description: "Compete in BGMI mobile tournaments and championship series. Play with your squad, drop into Erangel, and claim the Chicken Dinner.",
    keywords: ["bgmi tournaments", "battlegrounds mobile india tournaments", "bgmi custom rooms", "bgmi mobile esports"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGW7-vBXzV5KsC7LXIfK2ot_cPNs1BvRxQf0sHBj6v53DPscGlH_j8DDNJLsA49-gvQHaA7Sr_3zqaf7h27ApQXPUfQhU38Z5Wgp8B6OIkcIyguC5WUEhA0a5rnCc0XF5yuKBjroVnBtoQwra4ilXJNqFl7no6UIkGdSF_x9iXqkY-P-NZUNF_qeyoU9Jrz7gEgBQ2WqVsf4QIVRkLK4P83cCEEs4dzFuPIqZLyKxMy1n8Ym93FtsPqsTpOWKPWZuHCbegLshT6V8",
    logoUrl: "/games/bgmi-logo.png",
    genre: "Battle Royale",
    publisher: "Krafton",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "valorant": {
    slug: "valorant",
    name: "Valorant",
    gameKey: "VALORANT",
    description: "Compete in tactical 5v5 Valorant community tournaments. Register your team, coordinate agent compositions, plant the Spike, and dominate the ranking leaderboards.",
    keywords: ["valorant tournaments", "valorant community cup", "valorant online tournaments", "valorant team registration"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/valorant-logo.png",
    genre: "Tactical Hero Shooter",
    publisher: "Riot Games",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "clash-royale": {
    slug: "clash-royale",
    name: "Clash Royale",
    gameKey: "CLASH_ROYALE",
    description: "Compete in Clash Royale 1v1 and clan tournaments. Battle in real-time card matchups, deploy your deck strategy, and knock down enemy towers.",
    keywords: ["clash royale tournaments", "clash royale online tournaments", "clash royale tournaments free"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/clash-royale-logo.png",
    genre: "Real-Time Strategy / Deck Builder",
    publisher: "Supercell",
    supportsSolo: true,
    supportsSquad: false,
    supportsDuels: true
  },
  "clash-of-clans": {
    slug: "clash-of-clans",
    name: "Clash of Clans",
    gameKey: "CLASH_OF_CLANS",
    description: "Join Clash of Clans Clan War tournaments. Plan strategic base layouts, coordinate three-star attack runs, and win competitive cups.",
    keywords: ["clash of clans tournaments", "coc esports tournaments", "clash of clans competitive"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/coc-logo.png",
    genre: "Combat Strategy",
    publisher: "Supercell",
    supportsSolo: false,
    supportsSquad: true,
    supportsDuels: false
  },
  "brawl-stars": {
    slug: "brawl-stars",
    name: "Brawl Stars",
    gameKey: "BRAWL_STARS",
    description: "Register for fast-paced 3v3 Brawl Stars tournaments. Choose your brawler, coordinate team tactics in Gem Grab or Brawl Ball, and become a champion.",
    keywords: ["brawl stars tournaments", "brawl stars esports", "brawl stars custom cups"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/brawl-stars-logo.png",
    genre: "MOBA / Hero Shooter",
    publisher: "Supercell",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "ea-fc": {
    slug: "ea-fc",
    name: "EA Sports FC",
    gameKey: "EA_FC",
    description: "Compete in EA Sports FC virtual football tournaments. Control your ultimate team, display tactical skills on the pitch, and score your way to the top.",
    keywords: ["ea fc tournaments", "fifa tournaments online", "ea fc competitive leagues"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/ea-fc-logo.png",
    genre: "Sports / Football Simulation",
    publisher: "Electronic Arts",
    supportsSolo: true,
    supportsSquad: false,
    supportsDuels: true
  },
  "fortnite": {
    slug: "fortnite",
    name: "Fortnite",
    gameKey: "FORTNITE",
    description: "Compete in Fortnite battle royale and creative tournaments. Build base defenses, optimize loadouts, survive storm circles, and claim Victory Royale.",
    keywords: ["fortnite tournaments", "fortnite custom matchmaking tournaments", "fortnite online cups"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/fortnite-logo.png",
    genre: "Battle Royale / Sand-box",
    publisher: "Epic Games",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "pubg": {
    slug: "pubg",
    name: "PUBG: Battlegrounds",
    gameKey: "PUBG",
    description: "Compete in PUBG PC and Console custom tournaments. Plan strategic drop points, position inside survival circles, and eliminate opponents to survive.",
    keywords: ["pubg tournaments", "pubg battlegrounds championship", "pubg custom rooms"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGW7-vBXzV5KsC7LXIfK2ot_cPNs1BvRxQf0sHBj6v53DPscGlH_j8DDNJLsA49-gvQHaA7Sr_3zqaf7h27ApQXPUfQhU38Z5Wgp8B6OIkcIyguC5WUEhA0a5rnCc0XF5yuKBjroVnBtoQwra4ilXJNqFl7no6UIkGdSF_x9iXqkY-P-NZUNF_qeyoU9Jrz7gEgBQ2WqVsf4QIVRkLK4P83cCEEs4dzFuPIqZLyKxMy1n8Ym93FtsPqsTpOWKPWZuHCbegLshT6V8",
    logoUrl: "/games/pubg-logo.png",
    genre: "Battle Royale",
    publisher: "Krafton",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "mobile-legends": {
    slug: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    gameKey: "MOBILE_LEGENDS",
    description: "Register for competitive Mobile Legends tournaments. Play with your team, pick meta heroes, destroy defensive turrets, and claim victory.",
    keywords: ["mobile legends tournaments", "mlbb online tournaments", "mobile legends championships"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/mlbb-logo.png",
    genre: "MOBA",
    publisher: "Moonton",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  },
  "apex-legends": {
    slug: "apex-legends",
    name: "Apex Legends",
    gameKey: "APEX_LEGENDS",
    description: "Compete in Apex Legends custom lobbies and championship tournaments. Pick your Legend, synchronize tactical abilities, and claim victory.",
    keywords: ["apex legends tournaments", "apex legends custom tourney", "apex competitive"],
    bannerUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIKxLGbKi9AFU6kDvRhPMdZ_gJBwFV86yr70Mjr49MK56QHhQOlrhO2_x-ozbLR-DOiT5jF7wbElOr20jF4xJJ_DQ2DSALh6jUWg3q__3vUjLdahhrdMY_QfxaittO9lpwpkfWAzwjtS-JWvZf9rtIwIadQe0B6pkiSERH_S1-EDIzPvkIFFVg-uF8aRtUFsgjWk0pa4sdBSZs0bl1CF12eAmRjfoAmNxNaYNtLuvMP7JmW8R2x25zkhTuniFtQrSEkk7ycr74JTo",
    logoUrl: "/games/apex-logo.png",
    genre: "Battle Royale / Hero Shooter",
    publisher: "Electronic Arts / Respawn Entertainment",
    supportsSolo: true,
    supportsSquad: true,
    supportsDuels: true
  }
};
