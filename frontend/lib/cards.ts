export type AttackDirection = "forward" | "left-right";

export type CardKey =
  | "Hacker"
  | "Head Hunter"
  | "Manager"
  | "Vibe Coder"
  | "Twitter drama queen"
  | "The Yapper"
  | "Code purist"
  | "Degen";

export interface CardConfig {
  id: number;
  key: CardKey;
  name: string;
  cost: number;
  health: number;
  attack: number;
  attackDirection: AttackDirection;
  specialEffect?: string;
  image: string; // public path
}

export const CARDS: Record<CardKey, CardConfig> = {
  Hacker: {
    id: 1,
    key: "Hacker",
    name: "Hacker",
    cost: 3,
    health: 5,
    attack: 3,
    attackDirection: "left-right",
    specialEffect:
      "Steals 2 health from the enemy and gets +1 health if at least one Vibe Coder is on the board",
    image: "/cards/Hacker.png",
  },
  "Head Hunter": {
    id: 2,
    key: "Head Hunter",
    name: "Head Hunter",
    cost: 4,
    health: 2,
    attack: 1,
    attackDirection: "forward",
    specialEffect: "Steals random opposing unit and places it on the own side",
    image: "/cards/HeadHunter.png",
  },
  Manager: {
    id: 3,
    key: "Manager",
    name: "Manager",
    cost: 5,
    health: 5,
    attack: 5,
    attackDirection: "forward",
    image: "/cards/Manager.png",
  },
  "Vibe Coder": {
    id: 4,
    key: "Vibe Coder",
    name: "Vibe Coder",
    cost: 1,
    health: 3,
    attack: 1,
    attackDirection: "forward",
    specialEffect:
      "Reduces the health of the player playing the card by 1 when played",
    image: "/cards/VibeCoder.png",
  },
  "Twitter drama queen": {
    id: 5,
    key: "Twitter drama queen",
    name: "Twitter drama queen",
    cost: 2,
    health: 2,
    attack: 2,
    attackDirection: "forward",
    image: "/cards/TwitterDramaQueen.png",
  },
  "The Yapper": {
    id: 6,
    key: "The Yapper",
    name: "The Yapper",
    cost: 1,
    health: 1,
    attack: 1,
    attackDirection: "forward",
    specialEffect:
      "+1 Health and Attack for every Twitter drama queen on the board",
    image: "/cards/Yapper.png",
  },
  "Code purist": {
    id: 7,
    key: "Code purist",
    name: "Code purist",
    cost: 3,
    health: 3,
    attack: 3,
    attackDirection: "forward",
    image: "/cards/CodePurist.png",
  },
  Degen: {
    id: 8,
    key: "Degen",
    name: "Degen",
    cost: 0,
    health: 1,
    attack: 2,
    attackDirection: "forward",
    specialEffect: "Decreases the health by 1 of a random unit on the board",
    image: "/cards/Degen.png",
  },
};

export const CARD_LIST: CardConfig[] = Object.values(CARDS);
