// src/utils/quests.js

const questModules = import.meta.glob("@/assets/data/quests/*.yaml", { eager: true });
export const QUESTS = Object.values(questModules).flatMap((m) => m.default);
