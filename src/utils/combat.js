export async function handleCombatAction({ player, enemy, state, utils, itemEffects = {} }) {
  const {
    playerHP,
    playerClass,
    specialUsesLeft,
    weaponBonus,
    shieldBonus,
    playerName,
    action: playerAction,
    effectiveMaxHP,
    totalSpecialsUsed,
    specialTier,
    playerGold,
    weaponAugment,
    defenseAugment,
    equippedWeapon,
    ironWillUsed,
    bloodpactActive,
    playerEnrageCharges,
    focusPips,
    guardCharges,
    allyCompanion,
    warriors,
  } = player;

  const {
    enemyHP,
    encounter,
    nextEnemyAttack,
    enemyNextAction,
    enemyIsStunned,
    enemyStatusEffects,
    enrageBonus,
    confusedAction,
    confusedTurnsLeft,
  } = enemy;

  const {
    serratedDaggerActive,
    luckyFleeActive,
    wardingShieldHitsRemaining,
    luckyStoneRollsLeft,
    coolerStickBonus = 0,
  } = itemEffects;

  const {
    log,
    formattedTitle,
    combatWinsSinceLastCapIncrease,
    hpCapBonus,
    enemiesKilled,
  } = state;

  const {
    clearTimer,
    setDefeated,
    gotoEnemyTurn,
  } = utils;

  const isBossFromState = state.isBoss;

  // Process all non-target enemies' intents (attack, flee, enrage, confuse, steal, etc.)
  // Returns true if the player was defeated.
  function runSidekickAttacks() {
    const enc = encounter.value;
    if (!enc?.enemies || enc.enemies.length <= 1) return false;
    const targetIdx = enc.targetIndex ?? 0;
    // Use snapshot captured before intents were cleared for the "loading" UI
    const intents = utils.enemyIntentsSnapshot ?? utils.enemyIntents?.value ?? [];

    for (let i = 0; i < enc.enemies.length; i++) {
      if (i === targetIdx) continue;
      const intent = intents[i];
      if (!intent || intent.action === "idle" || intent.action === "dead") continue;
      const other = enc.enemies[i];
      if (!other || other.currentHP <= 0 || other.turned) continue;

      if (intent.action === "attack") {
        const rawDmg = intent.damage ?? Math.floor(Math.random() * (other.maxDamage - other.minDamage + 1)) + other.minDamage;
        let reduced = Math.max(0, rawDmg - Math.floor(shieldBonus.value / 2.333));
        if (playerDefendedThisTurn) reduced = Math.max(0, Math.floor(reduced * 0.5));
        playerHP.value = Math.max(playerHP.value - reduced, 0);
        if (reduced > 0) {
          utils.onCombatResult?.({ type: "taken", amount: reduced });
          if (playerEnrageCharges) {
            playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
          }
        }
        log(`<i class="ra ra-explosion"></i> ${other.name} also strikes <span class="player-name">${playerName.value}</span> for ${reduced} damage.`);
        if (playerHP.value <= 0) {
          log(`<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> was defeated.`);
          encounter.value = null;
          clearTimer();
          setDefeated();
          return true;
        }

      } else if (intent.action === "flee") {
        log(`<i class="ra ra-player-dodge"></i> ${other.name} flees from the fight!`);
        other.currentHP = 0;
        other.fled = true;

      } else if (intent.action === "enrage") {
        if (enrageBonus) enrageBonus.value += 2;
        log(`<i class="ra ra-burning-eye"></i> ${other.name} enrages! Their attacks will hit harder.`);

      } else if (intent.action === "confuse") {
        const actions = ["attack_steady", "attack_power", "attack_enraged", "defend", "special", "flee"];
        const blocked = actions.sort(() => Math.random() - 0.5).slice(0, 2);
        if (confusedAction) {
          confusedAction.value = blocked;
          confusedTurnsLeft.value = 1;
        }
        const labels = { attack_steady: "Steady", attack_power: "Power", attack_enraged: "Enraged", defend: "Defend", special: "Special", flee: "Flee" };
        const lockedNames = blocked.map(a => `<strong>${labels[a]}</strong>`).join(" and ");
        log(`<i class="ra ra-cycle"></i> ${other.name} clouds <span class="player-name">${playerName.value}</span>'s mind! ${lockedNames} locked for 1 turn.`);

      } else if (intent.action === "steal") {
        const stealAmount = Math.min(playerGold?.value ?? 0, Math.floor(Math.random() * 6) + 3);
        if (stealAmount > 0 && playerGold) {
          playerGold.value -= stealAmount;
          log(`<i class="ra ra-gold-bar"></i> ${other.name} snatches ${stealAmount} gold from <span class="player-name">${playerName.value}</span>!`);
        } else {
          log(`<i class="ra ra-gold-bar"></i> ${other.name} reaches for your gold — but finds nothing.`);
        }

      } else if (intent.action === "summon") {
        const healAmount = 12;
        other.currentHP = Math.min((other.currentHP ?? 0) + healAmount, other.maxHP ?? other.hp ?? 999);
        log(`<i class="ra ra-health"></i> ${other.name} heals for ${healAmount} HP!`);

      } else if (intent.action === "trip") {
        log(`🤾 ${other.name} trips <span class="player-name">${playerName.value}</span>!`);
      }
    }
    return false;
  }

  function tickConfusion() {
    if ((confusedTurnsLeft?.value ?? 0) > 0) {
      confusedTurnsLeft.value--;
      if (confusedTurnsLeft.value <= 0 && confusedAction) {
        confusedAction.value = [];
        log(`<i class="ra ra-cycle"></i> The confusion fades.`);
      }
    }
  }
  tickConfusion();

  // Tick fire/status effects on non-target enemies (from Librarian's Staff, etc.)
  function tickNonTargetStatusEffects() {
    const enc = encounter.value;
    if (!enc?.enemies) return;
    const tidx = enc.targetIndex ?? 0;
    for (let i = 0; i < enc.enemies.length; i++) {
      if (i === tidx) continue;
      const e = enc.enemies[i];
      if (!e || e.currentHP <= 0 || e.turned || !e.statusEffects?.length) continue;
      const remaining = [];
      for (const eff of e.statusEffects) {
        if (eff.type === "fire") {
          e.currentHP = Math.max(0, e.currentHP - eff.damage);
          log(`<i class="ra ra-fire"></i> ${e.name} burns for ${eff.damage} damage!`);
        }
        eff.duration--;
        if (eff.duration > 0) remaining.push(eff);
      }
      e.statusEffects = remaining;
    }
  }
  tickNonTargetStatusEffects();

  let currentEnemyDamage = nextEnemyAttack.value;
  if (typeof currentEnemyDamage !== "number" || isNaN(currentEnemyDamage)) {
    console.warn(
      "nextEnemyAttack.value is not a number, defaulting to 1.",
      currentEnemyDamage
    );
    currentEnemyDamage = 1;
  }

  let damageToPlayer = 0;
  let damageToEnemy = 0;
  let skipEnemyCurrentTurn = false;
  let playerDefendedThisTurn = false;
  let bracedSuccessfully = false;
  let bracedPartially = false;
  let enemyActionCountered = false;
  let enemyAttemptedAttack = false;
  let enemyStaggeredThisTurn = false;
  const isExploit = playerAction === "exploit";
  // Snapshot enrage charges before any reset (used for damage scaling below)
  const savedEnrageCharges = playerEnrageCharges?.value ?? 0;
  // Snapshot guard charges before any reset (consumed by Power Attack)
  const savedGuardCharges = guardCharges?.value ?? 0;
  // Non-defend actions break the guard streak — reset charges
  if (playerAction !== "defend") {
    if (guardCharges) guardCharges.value = 0;
  }

  if (playerAction === "attack_steady" || playerAction === "attack_power" || playerAction === "attack_enraged" || isExploit) {
    // Consume all focus pips for bonus damage (built by previous Steady hits)
    const focusPipBonus = (focusPips?.value ?? 0) * 2;
    if (focusPips && focusPips.value > 0) focusPips.value = 0;

    let randomDamage = Math.floor(Math.random() * 5) + 2;
    if (playerClass.value.name === "Fighter") randomDamage += 1;
    if (playerClass.value.name === "Rogue" && Math.random() < 0.25) {
      randomDamage += 3;
      log(
        `<span class="player-name">${playerName.value}</span> lands a critical strike.`
      );
    }
    if (weaponBonus.value > 0) {
      randomDamage += weaponBonus.value;
    }

    let damageMultiplier = 1.0;
    let attackName = "strikes";
    let hitThreshold = null;

    if (playerAction === "attack_power") {
      damageMultiplier = 1.5;
      attackName = "lands a power strike";
      hitThreshold = 10;
    } else if (playerAction === "attack_enraged") {
      // 3 charges = full 2× multiplier; 1–2 charges = flat bonus (handled after hit)
      damageMultiplier = savedEnrageCharges >= 3 ? 2.0 : 1.0;
      attackName = "unleashes an enraged strike";
      if (playerEnrageCharges) playerEnrageCharges.value = 0;
      // 2 flat recoil damage on use
      playerHP.value = Math.max(0, playerHP.value - 2);
      utils.onCombatResult?.({ type: "taken", amount: 2 });
      log(`<i class="ra ra-fire"></i> Enrage recoil — <span class="player-name">${playerName.value}</span> takes 2 damage!`);
    } else if (isExploit) {
      damageMultiplier = 1.5;
      attackName = "exploits the opening";
      hitThreshold = 9;
    }

    let didHit = true;
    if (hitThreshold !== null) {
      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const luckyBonus = (luckyStoneRollsLeft?.value ?? 0) > 0 ? 1 : 0;
      if (luckyBonus > 0) { luckyStoneRollsLeft.value--; }
      const roll = rawRoll + coolerStickBonus + luckyBonus;
      didHit = roll >= hitThreshold;
      const dieClass = didHit ? "hit" : "miss";
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      const bonusNote = (coolerStickBonus + luckyBonus) > 0 ? ` (+${coolerStickBonus + luckyBonus})` : "";
      utils.onDiceRoll?.({ roll, rawRoll, bonus: coolerStickBonus + luckyBonus, threshold: hitThreshold, didHit });
      await utils.waitForDice?.();
      log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace}${bonusNote} (need ${hitThreshold}+) — ${didHit ? "Hit!" : "Miss!"}`);
    }

    if (didHit) {
      damageToEnemy = Math.floor(randomDamage * damageMultiplier);

      // Focus pip bonus
      if (focusPipBonus > 0) {
        damageToEnemy += focusPipBonus;
        log(`<i class="ra ra-sword"></i> Focus released — +${focusPipBonus} bonus damage!`);
      }

      // Enrage: flat charge bonus for 1–2 charges (3 charges already gets 2× multiplier)
      if (playerAction === "attack_enraged" && savedEnrageCharges > 0 && savedEnrageCharges < 3) {
        const chargeDmgBonus = savedEnrageCharges * 2;
        damageToEnemy += chargeDmgBonus;
        log(`<i class="ra ra-fire"></i> ${savedEnrageCharges} Enrage charge${savedEnrageCharges > 1 ? "s" : ""} — +${chargeDmgBonus} bonus damage!`);
      }

      // Exploit: bonus damage = enemy's queued attack value + apply Weakened
      if (isExploit) {
        const exploitBonus = currentEnemyDamage ?? 0;
        if (exploitBonus > 0) {
          damageToEnemy += exploitBonus;
          log(`<i class="ra ra-lightning-bolt"></i> Reading their attack — +${exploitBonus} bonus damage!`);
        }
        enemyStatusEffects.value.push({ type: "weaken", damageReduction: 2, duration: 2 });
        log(`<i class="ra ra-aura"></i> ${formattedTitle} is Weakened! (-2 dmg for 2 turns)`);
      }

      log(
        `<i class="ra ra-plain-dagger"></i> <span class="player-name">${playerName.value}</span> ${attackName} and hits ${formattedTitle} for ${damageToEnemy} damage.`
      );

      // Steady: build a focus pip after the hit
      if (playerAction === "attack_steady" && focusPips) {
        focusPips.value = Math.min(3, focusPips.value + 1);
      }

      // Power: consume guard charges as bonus damage, then stagger
      if (playerAction === "attack_power") {
        if (savedGuardCharges > 0) {
          damageToEnemy += savedGuardCharges;
          log(`<i class="ra ra-shield"></i> ${savedGuardCharges} Guard charge${savedGuardCharges > 1 ? "s" : ""} released — +${savedGuardCharges} bonus damage!`);
        }
        enemyStaggeredThisTurn = true;
        log(`<i class="ra ra-explosion"></i> ${formattedTitle} is staggered!`);
        utils.onProcEvent?.({ label: "Staggered", icon: '<i class="ra ra-explosion"></i>', color: "#ff9900" });
      }

      if (serratedDaggerActive?.value && enemyStatusEffects) {
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 2 });
        serratedDaggerActive.value = false;
        log(`<i class="ra ra-dripping-blade"></i> The serrated edge opens a wound — ${formattedTitle} begins to Bleed.`);
      }

      // Persistent ally attacks alongside the player on every hit
      if (allyCompanion?.value && allyCompanion.value.currentHP > 0) {
        const allyDmg = Math.floor(Math.random() * 6) + 5; // 5–10 damage
        enemyHP.value = Math.max(0, enemyHP.value - allyDmg);
        utils.onCombatResult?.({ type: "dealt", amount: allyDmg });
        log(`<i class="ra ra-chain"></i> ${allyCompanion.value.name} strikes alongside you for ${allyDmg} damage!`);
      }

      // ── Barracks warriors attack ─────────────────────────────────────────
      if (warriors?.value?.length > 0) {
        const tacticianBonus = warriors.value.some(w => w.spec === "tactician" && w.currentHP > 0) ? 2 : 0;
        for (const warrior of warriors.value) {
          if (warrior.currentHP <= 0) continue;
          warrior.roundsInCombat = (warrior.roundsInCombat ?? 0) + 1;
          const spec = warrior.spec;

          // Destroyer winds up every other turn
          if (spec === "destroyer") {
            if (!warrior.windingUp) {
              warrior.windingUp = true;
              log(`<i class="ra ra-axe"></i> ${warrior.label} winds up for a devastating blow...`);
              continue;
            }
            warrior.windingUp = false;
          }

          const baseDmg = Math.floor(Math.random() * (warrior.damageMax - warrior.damageMin + 1)) + warrior.damageMin;
          let wDmg = baseDmg + tacticianBonus;

          if (spec === "assassin")      wDmg = Math.floor(wDmg * 1.5);
          if (spec === "destroyer")     wDmg = wDmg * 2;
          if (spec === "duelist")       wDmg += (warrior.hitsPlayerReceivedInCombat ?? 0);
          if (spec === "beastmaster")   wDmg = Math.floor(Math.random() * 20) + 1;
          if (spec === "cursed_knight") {
            wDmg = Math.floor(wDmg * 1.5);
            playerHP.value = Math.max(0, playerHP.value - 2);
            log(`<i class="ra ra-knight-helmet"></i> The curse bites back — you take 2 recoil damage.`);
          }

          wDmg = Math.max(1, wDmg);
          enemyHP.value = Math.max(0, enemyHP.value - wDmg);
          utils.onCombatResult?.({ type: "dealt", amount: wDmg });
          log(`<i class="ra ra-sword"></i> ${warrior.label} strikes for ${wDmg} damage!`);

          // Hexblade: 35% status effect on hit
          if (spec === "hexblade" && Math.random() < 0.35) {
            const r = Math.random();
            if (r < 0.33) {
              enemyIsStunned.value = true;
              log(`<i class="ra ra-crystal-wand"></i> Hexblade curse — enemy stunned!`);
            } else if (r < 0.66) {
              enemyStatusEffects.value.push({ type: "poison", damage: 3, duration: 3 });
              log(`<i class="ra ra-crystal-wand"></i> Hexblade curse — enemy poisoned!`);
            } else {
              enemyStatusEffects.value.push({ type: "weaken", damageReduction: 2, duration: 2 });
              log(`<i class="ra ra-crystal-wand"></i> Hexblade curse — enemy weakened!`);
            }
          }

          // Trickster: random debuff
          if (spec === "trickster") {
            const r = Math.random();
            if (r < 0.5) {
              enemyIsStunned.value = true;
              log(`<i class="ra ra-perspective-dice-random"></i> Trickster trips the enemy — stunned!`);
            } else {
              enemyStatusEffects.value.push({ type: "weaken", damageReduction: 2, duration: 2 });
              log(`<i class="ra ra-perspective-dice-random"></i> Trickster distracts the enemy — weakened!`);
            }
          }
        }
      }
    } else {
      damageToEnemy = 0;
      if (playerAction === "attack_power") {
        // Miss: enemy gets a free power attack instead of self-damage
        skipEnemyCurrentTurn = true;
        let bonusDmg = Math.floor(currentEnemyDamage * 1.5);
        for (const eff of (enemyStatusEffects.value ?? [])) {
          if ((eff.type === "weaken" || eff.type === "chill") && eff.damageReduction > 0) {
            bonusDmg = Math.max(0, bonusDmg - eff.damageReduction);
          }
        }
        bonusDmg = Math.max(0, bonusDmg - Math.floor(shieldBonus.value / 2.333));
        log(`<i class="ra ra-explosion"></i> <span class="player-name">${playerName.value}</span> ${attackName} but misses — ${formattedTitle} retaliates with a crushing blow for ${bonusDmg} damage!`);
        playerHP.value = Math.max(0, playerHP.value - bonusDmg);
        if (bonusDmg > 0) {
          utils.onCombatResult?.({ type: "taken", amount: bonusDmg });
          if (playerEnrageCharges) playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
        }
        if (playerHP.value <= 0) {
          log(`<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> was defeated.`);
          encounter.value = null;
          clearTimer();
          setDefeated();
          return;
        }
      } else {
        // Steady misses deal 1 self-damage; Exploit misses deal none
        const missPenalty = isExploit ? 0 : 1;
        if (missPenalty > 0) {
          playerHP.value = Math.max(playerHP.value - missPenalty, 0);
          if (playerEnrageCharges) playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
          utils.onCombatResult?.({ type: "miss_penalty", amount: missPenalty });
        }
        log(
          `<i class="ra ra-poison-cloud"></i> <span class="player-name">${playerName.value}</span> ${attackName} but misses${missPenalty > 0 ? ` — ${formattedTitle} deals ${missPenalty} damage` : ""}.`
        );
      }
    }
  } else if (playerAction === "special") {
    if (specialUsesLeft.value <= 0) {
      log(
        `<span class="player-name">${playerName.value}</span> is out of ${playerClass.value.special} charges.`
      );
      return;
    }
    specialUsesLeft.value--;
    if (totalSpecialsUsed) {
      totalSpecialsUsed.value++;
    }
    const cls = playerClass.value.name;
    const tier = specialTier?.value ?? 1;
    const tierData = playerClass.value.specialTiers?.[tier - 1];
    const specialName = tierData?.name ?? playerClass.value.special;

    let baseSpecialDamage = 0;

    if (cls === "Fighter") {
      if (tier === 1) {
        baseSpecialDamage = 8;
        damageToEnemy = baseSpecialDamage;
        log(`<i class="ra ra-sword"></i> <span class="player-name">${playerName.value}</span> unleashes ${specialName} for ${baseSpecialDamage} damage.`);
      } else if (tier === 2) {
        baseSpecialDamage = 12;
        damageToEnemy = baseSpecialDamage;
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 1 });
        log(`<i class="ra ra-sword"></i> <span class="player-name">${playerName.value}</span> cleaves for ${baseSpecialDamage} damage! The wound bleeds.`);
      } else {
        baseSpecialDamage = 18;
        damageToEnemy = baseSpecialDamage;
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
        log(`<i class="ra ra-sword"></i> <span class="player-name">${playerName.value}</span> delivers a Warlord's Strike for ${baseSpecialDamage} damage! The enemy is stunned.`);
      }
    } else if (cls === "Wizard") {
      let minDmg, maxDmg, stunChance;
      if (tier === 1) { minDmg = 5; maxDmg = 15; stunChance = 0.3; }
      else if (tier === 2) { minDmg = 8; maxDmg = 18; stunChance = 0.5; }
      else { minDmg = 15; maxDmg = 25; stunChance = 1.0; }

      baseSpecialDamage = Math.floor(Math.random() * (maxDmg - minDmg + 1)) + minDmg;
      damageToEnemy = baseSpecialDamage;
      const stunned = Math.random() < stunChance;
      log(`<i class="ra ra-fire"></i> <span class="player-name">${playerName.value}</span> casts ${specialName}, dealing ${baseSpecialDamage} damage.${stunned ? ` The enemy is stunned.` : ""}`);
      if (stunned) {
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
      }
    } else if (cls === "Rogue") {
      if (tier === 1) {
        baseSpecialDamage = 6;
      } else if (tier === 2) {
        baseSpecialDamage = 10;
      } else {
        baseSpecialDamage = 15;
        enemyStatusEffects.value.push({ type: "bleed", damage: 1, duration: 2 });
        log(`<i class="ra ra-dripping-blade"></i> The shadows cut deep — the enemy begins to bleed.`);
      }
      damageToEnemy = baseSpecialDamage;
      skipEnemyCurrentTurn = true;
      log(`<i class="ra ra-plain-dagger"></i> <span class="player-name">${playerName.value}</span> disappears and executes ${specialName} for ${baseSpecialDamage} damage.`);
    } else if (cls === "Paladin") {
      let dmg, heal;
      if (tier === 1) { dmg = 5; heal = 3; }
      else if (tier === 2) { dmg = 8; heal = 7; }
      else { dmg = 12; heal = effectiveMaxHP.value; }
      baseSpecialDamage = dmg;
      damageToEnemy = baseSpecialDamage;
      const newHP = tier === 3
        ? effectiveMaxHP.value
        : Math.min(playerHP.value + heal, effectiveMaxHP.value);
      playerHP.value = newHP;
      const healMsg = tier === 3 ? "fully restores HP" : `heals ${heal} HP`;
      log(`<i class="ra ra-aura"></i> <span class="player-name">${playerName.value}</span> calls upon ${specialName}, dealing ${baseSpecialDamage} damage and ${healMsg}.`);
    } else if (cls === "Mundane") {
      if (tier === 1) {
        baseSpecialDamage = 5;
        damageToEnemy = baseSpecialDamage;
        log(`<i class="ra ra-mountains"></i> <span class="player-name">${playerName.value}</span> hurls a rock for ${baseSpecialDamage} damage. The enemy looks almost offended.`);
      } else if (tier === 2) {
        baseSpecialDamage = 0;
        damageToEnemy = 0;
        skipEnemyCurrentTurn = true;
        log(`<i class="ra ra-shield"></i> <span class="player-name">${playerName.value}</span> grits their teeth and braces — the enemy's attack glances off.`);
      } else {
        baseSpecialDamage = Math.max(5, (effectiveMaxHP.value - playerHP.value) + 5);
        damageToEnemy = baseSpecialDamage;
        log(`<i class="ra ra-burning-eye"></i> <span class="player-name">${playerName.value}</span> channels pure desperation into a Grit Surge — ${baseSpecialDamage} damage!`);
      }
    } else {
      log(`<span class="player-name">${playerName.value}</span> uses ${specialName}.`);
      if (playerClass.value.specialEffect) {
        const effect = playerClass.value.specialEffect(
          enemyHP.value,
          playerHP.value,
          effectiveMaxHP.value
        );
        if (typeof effect === "object" && effect !== null) {
          if (effect.playerHP !== undefined) {
            playerHP.value = Math.min(effect.playerHP, effectiveMaxHP.value);
          }
          if (effect.enemyDamage !== undefined) {
            damageToEnemy = effect.enemyDamage;
          }
          if (effect.stunned) {
            enemyIsStunned.value = true;
            enemyNextAction.value = "stunned";
            skipEnemyCurrentTurn = true;
          }
          if (effect.skipEnemyTurn) {
            skipEnemyCurrentTurn = true;
          }
        }
      }
    }
  } else if (playerAction === "defend") {
    const counterableActions = ["steal", "enrage", "confuse", "summon"];
    const isAttacking = enemyNextAction.value === "attack" || enemyNextAction.value === "attack_power";
    // Mirror the UI's isWindUp: sum all attacking intents so multi-enemy total matches what the player sees
    const braceIntents = utils.enemyIntents?.value ?? [];
    const totalIncoming = braceIntents.length > 0
      ? braceIntents.reduce((sum, intent) => {
          if (intent && (intent.action === "attack" || intent.action === "attack_power")) {
            return sum + (intent.damage ?? 0);
          }
          return sum;
        }, 0)
      : (isAttacking ? (currentEnemyDamage ?? 0) : 0);
    const braceThreshold = Math.max(10, Math.floor((effectiveMaxHP.value ?? 50) * 0.15));
    const isBrace = totalIncoming >= braceThreshold;

    if (isBrace) {
      // BRACE: high incoming hit — three-tier outcome; shieldBonus adds to the roll
      const braceRollThreshold = 8;
      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const luckyBonus = (luckyStoneRollsLeft?.value ?? 0) > 0 ? 1 : 0;
      if (luckyBonus > 0) { luckyStoneRollsLeft.value--; }
      const shieldBraceBonus = Math.floor((shieldBonus?.value ?? 0) / 3);
      const totalBonus = coolerStickBonus + luckyBonus + shieldBraceBonus;
      const roll = rawRoll + totalBonus;
      const dieClass = roll >= braceRollThreshold ? "hit" : (roll >= 5 ? "hit" : "miss");
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      const bonusNote = totalBonus > 0 ? ` (+${totalBonus})` : "";
      utils.onDiceRoll?.({ roll, rawRoll, bonus: totalBonus, threshold: braceRollThreshold, didHit: roll >= braceRollThreshold });
      await utils.waitForDice?.();
      playerDefendedThisTurn = true;
      if (roll >= braceRollThreshold) {
        bracedSuccessfully = true;
        log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace}${bonusNote} (need ${braceRollThreshold}+) — <i class="ra ra-shield"></i> Braced!`);
      } else if (roll >= 5) {
        bracedPartially = true;
        log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace}${bonusNote} (need ${braceRollThreshold}+) — Partial brace! Taking half damage.`);
      } else {
        playerDefendedThisTurn = false;
        log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace}${bonusNote} (need ${braceRollThreshold}+) — Failed to brace! Taking full damage.`);
      }
    } else if (counterableActions.includes(enemyNextAction.value)) {
      // Counter attempt — dice roll at 11+
      const rawRoll = Math.floor(Math.random() * 20) + 1;
      const luckyBonus = (luckyStoneRollsLeft?.value ?? 0) > 0 ? 1 : 0;
      if (luckyBonus > 0) { luckyStoneRollsLeft.value--; }
      const roll = rawRoll + coolerStickBonus + luckyBonus;
      const threshold = 11;
      const succeeded = roll >= threshold;
      const dieClass = succeeded ? "hit" : "miss";
      const dieFace = `<span class="dice-face ${dieClass}">${roll}</span>`;
      const bonusNote = (coolerStickBonus + luckyBonus) > 0 ? ` (+${coolerStickBonus + luckyBonus})` : "";
      utils.onDiceRoll?.({ roll, rawRoll, bonus: coolerStickBonus + luckyBonus, threshold, didHit: succeeded });
      await utils.waitForDice?.();
      log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace}${bonusNote} (need ${threshold}+) — ${succeeded ? "Countered!" : "Failed to counter!"}`);
      enemyActionCountered = succeeded;
      utils.onCounterResult?.({ succeeded, delay: 0 });
      playerDefendedThisTurn = true;
    } else {
      // Regular defend — halves damage; builds a guard charge (consecutive blocks stack)
      playerDefendedThisTurn = true;
      if (guardCharges) guardCharges.value = (guardCharges.value ?? 0) + 1;
      if (guardCharges && guardCharges.value > 0) {
        log(`<i class="ra ra-shield"></i> Guard charge built — ×${guardCharges.value} (release with Power Attack).`);
      }
    }
  } else if (playerAction === "flee") {
    if (isBossFromState(encounter.value?.enemy)) {
      log(`You cannot flee from ${encounter.value?.enemy?.name}.`);
    } else {
      const guaranteedFlee = luckyFleeActive?.value;
      if (guaranteedFlee) {
        luckyFleeActive.value = false;
        log(`<i class="ra ra-gold-bar"></i> The Lucky Coin shines! <span class="player-name">${playerName.value}</span> escapes without fail.`);
        encounter.value = null;
        return;
      } else {
        const scoutBonus = warriors?.value?.some(w => w.spec === "scout" && w.currentHP > 0) ? 3 : 0;
        const fleeRoll = Math.floor(Math.random() * 20) + 1 + scoutBonus;
        const fleeThreshold = 7;
        const fleeSucceeded = fleeRoll >= fleeThreshold;
        const dieClass = fleeSucceeded ? "hit" : "miss";
        const dieFace = `<span class="dice-face ${dieClass}">${fleeRoll}</span>`;
        utils.onDiceRoll?.({ roll: fleeRoll, rawRoll: fleeRoll, bonus: 0, threshold: fleeThreshold, didHit: fleeSucceeded });
        await utils.waitForDice?.();
        log(`<i class="ra ra-perspective-dice-random"></i> ${dieFace} (need ${fleeThreshold}+) — ${fleeSucceeded ? "Escaped!" : "Caught!"}`);
        if (fleeSucceeded) {
          log(`<i class="ra ra-player-dodge"></i> <span class="player-name">${playerName.value}</span> fled successfully.`);
          if (utils.onFleeSuccess) {
            utils.onFleeSuccess();
          } else {
            encounter.value = null;
          }
          return;
        } else {
          // Failed flee: enemy gets a free power attack
          skipEnemyCurrentTurn = true;
          let fleePenaltyDmg = Math.floor(currentEnemyDamage * 1.5);
          for (const eff of (enemyStatusEffects.value ?? [])) {
            if ((eff.type === "weaken" || eff.type === "chill") && eff.damageReduction > 0) {
              fleePenaltyDmg = Math.max(0, fleePenaltyDmg - eff.damageReduction);
            }
          }
          fleePenaltyDmg = Math.max(0, fleePenaltyDmg - Math.floor(shieldBonus.value / 2.333));
          log(`<i class="ra ra-explosion"></i> <span class="player-name">${playerName.value}</span> failed to flee — ${formattedTitle} delivers a crushing blow for ${fleePenaltyDmg} damage!`);
          playerHP.value = Math.max(0, playerHP.value - fleePenaltyDmg);
          if (fleePenaltyDmg > 0) {
            utils.onCombatResult?.({ type: "taken", amount: fleePenaltyDmg });
            if (playerEnrageCharges) playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
          }
          if (playerHP.value <= 0) {
            log(`<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> was defeated.`);
            encounter.value = null;
            clearTimer();
            setDefeated();
            return;
          }
        }
      }
    }
  }

  if (player.dogName?.value && damageToEnemy > 0) {
    damageToEnemy += 2;
    log(`<i class="ra ra-pawprint"></i> ${player.dogName.value} bites for 2 extra damage!`);
  }

  // Bloodpact Rune: once active, add +3 to attack damage
  if (bloodpactActive?.value && damageToEnemy > 0) {
    damageToEnemy += 3;
  }

  if (damageToEnemy > 0) {
    let finalDamageToEnemy = damageToEnemy;

    if (
      enemyNextAction.value === "defend" &&
      !isExploit &&
      playerAction !== "attack_power" &&
      !(playerAction === "special" && playerClass.value.name === "Rogue")
    ) {
      finalDamageToEnemy = Math.floor(finalDamageToEnemy * 0.5);
      log(
        `<i class="ra ra-shield"></i> ${formattedTitle} defends, reducing incoming damage to ${finalDamageToEnemy}HP.`
      );
    } else if (enemyNextAction.value === "defend" && (isExploit || playerAction === "attack_power")) {
      log(`<i class="ra ra-lightning-bolt"></i> ${formattedTitle}'s guard is broken — full damage lands!`);
    }
    enemyHP.value -= finalDamageToEnemy;
    utils.onCombatResult?.({ type: "dealt", amount: finalDamageToEnemy });

    // Weapon augment proc (only on actual hits)
    const wAug = weaponAugment?.value;
    if (wAug && finalDamageToEnemy > 0) {
      const roll = Math.random();
      if (wAug === "bleedEdge" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "bleed", damage: 2, duration: 4 });
        log(`<i class="ra ra-dripping-blade"></i> Serrated Edge bites deep — enemy Bleeds (2 dmg × 4 turns)!`);
        utils.onProcEvent?.({ label: "Serrated Edge", icon: '<i class="ra ra-dripping-blade"></i>', color: "#cc2233" });
      } else if (wAug === "venomCoat" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "poison", damage: 3, duration: 3 });
        log(`<i class="ra ra-skull"></i> Venom Coat seeps in — enemy Poisoned (3 dmg × 3 turns)!`);
        utils.onProcEvent?.({ label: "Venom Coat", icon: '<i class="ra ra-skull"></i>', color: "#44bb55" });
      } else if (wAug === "thunderstrike" && roll < 0.25) {
        enemyIsStunned.value = true;
        enemyNextAction.value = "stunned";
        skipEnemyCurrentTurn = true;
        log(`<i class="ra ra-lightning-bolt"></i> Thunderstrike Rune fires — enemy stunned!`);
        utils.onProcEvent?.({ label: "Thunderstrike", icon: '<i class="ra ra-lightning-bolt"></i>', color: "#aa66ff" });
      } else if (wAug === "emberTemper" && roll < 0.30) {
        enemyStatusEffects.value.push({ type: "fire", damage: 5, duration: 2 });
        log(`<i class="ra ra-fire"></i> Ember Temper ignites the wound — enemy on Fire (5 dmg × 2 turns)!`);
        utils.onProcEvent?.({ label: "Ember Temper", icon: '<i class="ra ra-fire"></i>', color: "#ff6622" });
      } else if (wAug === "cursedRune" && roll < 0.20) {
        enemyStatusEffects.value.push({ type: "weaken", damageReduction: 2, duration: 3 });
        log(`<i class="ra ra-aura"></i> Cursed Rune drains their strength — enemy Weakened (-2 dmg × 3 turns)!`);
        utils.onProcEvent?.({ label: "Cursed Rune", icon: '<i class="ra ra-aura"></i>', color: "#8899cc" });
      }
    }

    // (Conscriptor's Chain allies now attack immediately on conscript — no deferred turned-ally state)
  }

  // === Equipped Weapon Effects ===
  const wepId = equippedWeapon?.value;

  // Crossbow "Marksman": on enraged attack, fire a bolt at a random non-target for 10 damage
  if (wepId === "crossbow" && playerAction === "attack_enraged" && damageToEnemy > 0) {
    const enc = encounter.value;
    if (enc?.enemies?.length > 1) {
      const tidx = enc.targetIndex ?? 0;
      const alive = enc.enemies.map((e, i) => ({ e, i })).filter(({ e, i }) => i !== tidx && e.currentHP > 0 && !e.turned);
      if (alive.length > 0) {
        const { e } = alive[Math.floor(Math.random() * alive.length)];
        e.currentHP = Math.max(0, e.currentHP - 10);
        log(`<i class="ra ra-broadhead-arrow"></i> <span class="player-name">${playerName.value}</span>'s Crossbow fires — ${e.name} takes 10 damage!`);
        utils.onProcEvent?.({ label: "Marksman", icon: '<i class="ra ra-broadhead-arrow"></i>', color: "#ffcc44" });
      }
    }
  }

  // Flail "Sweep": power attack also hits all non-target enemies for half damage
  if (wepId === "flail" && playerAction === "attack_power" && damageToEnemy > 0) {
    const enc = encounter.value;
    if (enc?.enemies?.length > 1) {
      const tidx = enc.targetIndex ?? 0;
      const sweepDmg = Math.max(1, Math.floor(damageToEnemy * 0.5));
      for (let i = 0; i < enc.enemies.length; i++) {
        if (i === tidx) continue;
        const e = enc.enemies[i];
        if (!e || e.currentHP <= 0) continue;
        e.currentHP = Math.max(0, e.currentHP - sweepDmg);
        log(`<i class="ra ra-hammer"></i> Flail sweeps ${e.name} for ${sweepDmg} damage!`);
      }
      utils.onProcEvent?.({ label: "Flail Sweep", icon: '<i class="ra ra-hammer"></i>', color: "#ffcc44" });
    }
  }

  // Shouting Halberd "Give Me Blood": 25% on attack_enraged to force non-targets to flee or trip
  // Shouting Halberd "Give Me Blood": dice 10+ to force non-targets to flee or trip
  if (wepId === "shouting_halberd" && playerAction === "attack_enraged" && damageToEnemy > 0) {
    const halberdRoll = Math.floor(Math.random() * 20) + 1;
    const halberdHit = halberdRoll >= 10;
    utils.onDiceRoll?.({ roll: halberdRoll, rawRoll: halberdRoll, bonus: 0, threshold: 10, didHit: halberdHit });
    await utils.waitForDice?.();
    if (halberdHit) {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face hit">${halberdRoll}</span> — <em>Give Me Blood!</em> The Halberd screams!`);
      utils.onProcEvent?.({ label: "Give Me Blood!", icon: '<i class="ra ra-plain-dagger"></i>', color: "#cc2233" });
      const enc = encounter.value;
      if (enc?.enemies?.length > 1) {
        const tidx = enc.targetIndex ?? 0;
        for (let i = 0; i < enc.enemies.length; i++) {
          if (i === tidx) continue;
          const e = enc.enemies[i];
          if (!e || e.currentHP <= 0) continue;
          if (Math.random() < 0.5) {
            e.currentHP = 0;
            e.fled = true;
            log(`<i class="ra ra-player-dodge"></i> ${e.name} flees in terror!`);
          } else {
            e.forcedNextAction = 'trip';
            log(`🤾 ${e.name} trips and falls — loses their next action!`);
          }
        }
      }
    } else {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face miss">${halberdRoll}</span> — Give Me Blood: the Halberd's shout falls silent.`);
    }
  }

  // Rogue's Rapier "Greed is Good": dice 10+ to steal gold on attack_enraged
  if (wepId === "rogues_rapier" && playerAction === "attack_enraged" && damageToEnemy > 0) {
    const rapierRoll = Math.floor(Math.random() * 20) + 1;
    const rapierHit = rapierRoll >= 10;
    utils.onDiceRoll?.({ roll: rapierRoll, rawRoll: rapierRoll, bonus: 0, threshold: 10, didHit: rapierHit });
    await utils.waitForDice?.();
    if (rapierHit) {
      const stealAmt = Math.floor(Math.random() * 16) + 10;
      if (playerGold) playerGold.value = (playerGold.value ?? 0) + stealAmt;
      utils.onGoldStolen?.(stealAmt);
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face hit">${rapierRoll}</span> — <em>Greed is Good!</em> Pilfered ${stealAmt} gold from ${formattedTitle}!`);
    } else {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face miss">${rapierRoll}</span> — Greed is Good: nothing to steal.`);
    }
  }

  // Librarian's Staff "Burn enemies, not books": dice 10+ to set all non-targets on fire for 3 rounds
  if (wepId === "librarians_staff" && playerAction === "attack_enraged" && damageToEnemy > 0) {
    const staffRoll = Math.floor(Math.random() * 20) + 1;
    const staffHit = staffRoll >= 10;
    utils.onDiceRoll?.({ roll: staffRoll, rawRoll: staffRoll, bonus: 0, threshold: 10, didHit: staffHit });
    await utils.waitForDice?.();
    if (staffHit) {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face hit">${staffRoll}</span> — <em>Burn enemies, not books!</em>`);
      const enc = encounter.value;
      if (enc?.enemies?.length > 1) {
        const tidx = enc.targetIndex ?? 0;
        for (let i = 0; i < enc.enemies.length; i++) {
          if (i === tidx) continue;
          const e = enc.enemies[i];
          if (!e || e.currentHP <= 0) continue;
          e.statusEffects = e.statusEffects ?? [];
          e.statusEffects.push({ type: "fire", damage: 5, duration: 3 });
          log(`<i class="ra ra-fire"></i> ${e.name} is set ablaze!`);
        }
      } else {
        enemyStatusEffects.value.push({ type: "fire", damage: 5, duration: 3 });
        log(`<i class="ra ra-fire"></i> ${formattedTitle} is set ablaze!`);
      }
    } else {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face miss">${staffRoll}</span> — The staff's flames fizzle.`);
    }
  }

  // Conscriptor's Chain "Conscript": dice 10+ to turn a non-target enemy to the player's side
  if (wepId === "conscriptors_chain" && playerAction === "attack_enraged" && damageToEnemy > 0) {
    const conscriptRoll = Math.floor(Math.random() * 20) + 1;
    const conscriptHit = conscriptRoll >= 10;
    utils.onDiceRoll?.({ roll: conscriptRoll, rawRoll: conscriptRoll, bonus: 0, threshold: 10, didHit: conscriptHit });
    await utils.waitForDice?.();
    if (conscriptHit) {
      const enc = encounter.value;
      const tidx = enc?.targetIndex ?? 0;
      const candidates = enc?.enemies?.map((e, i) => ({ e, i }))
        .filter(({ e, i }) => i !== tidx && e.currentHP > 0 && !e.turned) ?? [];
      if (candidates.length > 0) {
        const { e: victim } = candidates[Math.floor(Math.random() * candidates.length)];
        // Remove from the enemy group
        victim.currentHP = 0;
        victim.fled = true;
        // Create persistent ally with 10 HP
        allyCompanion.value = { name: victim.name, currentHP: 35, maxHP: 35 };
        log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face hit">${conscriptRoll}</span> — <em>Conscripted!</em> ${victim.name} breaks rank and joins your side! (35 HP)`);
      } else {
        log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face hit">${conscriptRoll}</span> — Conscript: no enemy left to turn.`);
      }
    } else {
      log(`<i class="ra ra-perspective-dice-random"></i> <span class="dice-face miss">${conscriptRoll}</span> — Conscript: they resist the pull.`);
    }
  }

  if (enemyHP.value <= 0) {
    log(
      `<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> defeated ${formattedTitle}`
    );
    // Soul Shard: 15% chance on kill to restore 8 HP
    if (weaponAugment?.value === "soulShard" && Math.random() < 0.15) {
      const soulHeal = 8;
      playerHP.value = Math.min(playerHP.value + soulHeal, effectiveMaxHP.value);
      log(`<i class="ra ra-crystal-cluster"></i> Soul Shard pulses — you recover ${soulHeal} HP from the fallen.`);
      utils.onProcEvent?.({ label: "Soul Shard", icon: '<i class="ra ra-crystal-cluster"></i>', color: "#dd88ff", onEnemy: false });
    }
    // Other attacking enemies still deal damage when you kill this one,
    // but only at end of a full player turn — not mid-queue.
    if (!utils.skipEnemyTurn) {
      if (runSidekickAttacks()) return;
    }

    const defeatedEnemyData = encounter.value?.enemy;
    utils.onEnemyKilled?.(defeatedEnemyData, { skipGotoEnemyTurn: utils.skipEnemyTurn });

    if (enemiesKilled) enemiesKilled.value++;
    combatWinsSinceLastCapIncrease.value++;
    if (combatWinsSinceLastCapIncrease.value >= 10) {
      hpCapBonus.value += 10;
      log(
        `<i class="ra ra-trophy"></i> You have gained experience from defeating the evil in this land and your maximum HP increased by <strong>10</strong>. New max HP: ${effectiveMaxHP.value}`
      );
      utils.onHpCapIncrease?.();
      combatWinsSinceLastCapIncrease.value = 0;
      playerHP.value = Math.min(playerHP.value, effectiveMaxHP.value);
    }
    return;
  }

  // For multi-action turns: skip enemy response on intermediate actions
  if (utils.skipEnemyTurn) return;

  if (!skipEnemyCurrentTurn) {
    if (enemyIsStunned.value) {
      log(`<i class="ra ra-campfire"></i> ${formattedTitle} is stunned and skips their turn.`);
      enemyIsStunned.value = false;
      damageToPlayer = 0;
    } else {
      if (enemyNextAction.value === "attack") {
        enemyAttemptedAttack = true;
        damageToPlayer = currentEnemyDamage;

        // 20% chance for enemy to land a brutal hit (1.5x damage)
        if (Math.random() < 0.20) {
          damageToPlayer = Math.floor(damageToPlayer * 1.5);
          log(`<i class="ra ra-explosion"></i> ${formattedTitle} lands a <strong>brutal hit</strong>!`);
        }

        // Apply weaken/chill/stagger status debuffs on the enemy
        for (const eff of (enemyStatusEffects.value ?? [])) {
          if ((eff.type === "weaken" || eff.type === "chill") && eff.damageReduction > 0) {
            damageToPlayer = Math.max(0, damageToPlayer - eff.damageReduction);
          }
        }
        // Power stagger: reduces the counterattack in the same turn by 25%
        if (enemyStaggeredThisTurn) {
          damageToPlayer = Math.floor(damageToPlayer * 0.75);
        }

        // Iron Will: block first hit of combat entirely
        if (defenseAugment?.value === "ironWill" && !ironWillUsed?.value) {
          ironWillUsed.value = true;
          damageToPlayer = 0;
          log(`<i class="ra ra-barrier"></i> Iron Will absorbs the first blow entirely!`);
          utils.onProcEvent?.({ label: "Iron Will", icon: '<i class="ra ra-barrier"></i>', color: "#aaaaff", onEnemy: false });
        }

        // Stoneskin: 20% chance to fully block
        if (damageToPlayer > 0 && defenseAugment?.value === "stoneskin" && Math.random() < 0.20) {
          damageToPlayer = 0;
          log(`<i class="ra ra-mountains"></i> Stoneskin activates — attack fully blocked!`);
          utils.onProcEvent?.({ label: "Stoneskin", icon: '<i class="ra ra-mountains"></i>', color: "#999999", onEnemy: false });
        }

        // Warden's Ward: 25% chance to halve damage
        if (damageToPlayer > 0 && defenseAugment?.value === "wardensWard" && Math.random() < 0.25) {
          damageToPlayer = Math.floor(damageToPlayer * 0.5);
          log(`<i class="ra ra-aura"></i> Warden's Ward pulses — damage halved to ${damageToPlayer}!`);
          utils.onProcEvent?.({ label: "Warden's Ward", icon: '<i class="ra ra-aura"></i>', color: "#66aacc", onEnemy: false });
        }

        damageToPlayer = Math.max(
          0,
          damageToPlayer - Math.floor(shieldBonus.value / 2.333)
        );

        if (bracedSuccessfully) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.2));
          log(`<i class="ra ra-shield"></i> <em>BRACE!</em> <span class="player-name">${playerName.value}</span> absorbs the blow — only ${damageToPlayer} damage gets through!`);
        } else if (bracedPartially) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.5));
          log(`<i class="ra ra-shield"></i> <em>Partial Brace!</em> <span class="player-name">${playerName.value}</span> partially blocks the blow — ${damageToPlayer} damage gets through!`);
        } else if (playerDefendedThisTurn) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.5));
          log(`<i class="ra ra-shield"></i> <span class="player-name">${playerName.value}</span> defended the attack, taking ${damageToPlayer} damage.`);
        } else {
          log(
            `<i class="ra ra-explosion"></i> ${formattedTitle} attacks back and <span class="player-name">${playerName.value}</span> takes ${damageToPlayer} damage.`
          );
        }

        if (wardingShieldHitsRemaining?.value > 0) {
          damageToPlayer = Math.max(0, Math.floor(damageToPlayer * 0.5));
          wardingShieldHitsRemaining.value--;
          log(`<i class="ra ra-shield"></i> Warding Shield absorbs half the blow! Reduced to ${damageToPlayer} damage. (${wardingShieldHitsRemaining.value} hits remaining)`);
          if (wardingShieldHitsRemaining.value <= 0) {
            log(`<i class="ra ra-shield"></i> The Warding Shield shatters.`);
          }
        }
      } else if (enemyNextAction.value === "trip") {
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "flee") {
        log(`<i class="ra ra-player-dodge"></i> ${formattedTitle} flees.`);
        encounter.value = null;
        return;
      } else if (enemyNextAction.value === "defend") {
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "steal") {
        if (enemyActionCountered) {
          log(`<i class="ra ra-shield"></i> <span class="player-name">${playerName.value}</span> guards their coin pouch — the theft fails!`);
        } else {
          const stealAmount = Math.min(
            playerGold?.value ?? 0,
            Math.floor(Math.random() * 6) + 3
          );
          if (stealAmount > 0 && playerGold) {
            playerGold.value -= stealAmount;
            log(`<i class="ra ra-gold-bar"></i> ${formattedTitle} snatches ${stealAmount} gold from <span class="player-name">${playerName.value}</span>!`);
          } else {
            log(`<i class="ra ra-gold-bar"></i> ${formattedTitle} reaches for your gold — but finds nothing.`);
          }
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "enrage") {
        if (enemyActionCountered) {
          log(`<i class="ra ra-shield"></i> ${formattedTitle}'s enrage is disrupted!`);
        } else {
          if (enrageBonus) enrageBonus.value += 2;
          log(`<i class="ra ra-burning-eye"></i> ${formattedTitle} enrages! Future attacks will hit harder.`);
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "confuse") {
        if (enemyActionCountered) {
          log(`<i class="ra ra-shield"></i> <span class="player-name">${playerName.value}</span> resists the confusion!`);
        } else {
          const actions = ["attack_steady", "attack_power", "attack_enraged", "defend", "special", "flee"];
          const shuffled = actions.sort(() => Math.random() - 0.5);
          const blocked = shuffled.slice(0, 2);
          if (confusedAction) {
            confusedAction.value = blocked;
            confusedTurnsLeft.value = 1;
          }
          const labels = { attack_steady: "Steady", attack_power: "Power", attack_enraged: "Enraged", defend: "Defend", special: "Special", flee: "Flee" };
          const lockedNames = blocked.map(a => `<strong>${labels[a]}</strong>`).join(" and ");
          log(`<i class="ra ra-cycle"></i> ${formattedTitle} clouds <span class="player-name">${playerName.value}</span>'s mind! ${lockedNames} locked for 1 turn.`);
        }
        damageToPlayer = 0;
      } else if (enemyNextAction.value === "summon") {
        if (enemyActionCountered) {
          log(`<i class="ra ra-shield"></i> ${formattedTitle}'s healing is interrupted!`);
        } else {
          const summonAmount = 12;
          enemyHP.value += summonAmount;
          log(`<i class="ra ra-health"></i> ${formattedTitle} heals for ${summonAmount} HP!`);
        }
        damageToPlayer = 0;
      }
    }
  } else {
    damageToPlayer = 0;
  }

  // ── Warrior defensive effects (modify damageToPlayer before it's applied) ──
  if (warriors?.value?.length > 0 && typeof damageToPlayer === "number" && damageToPlayer > 0) {
    for (const warrior of warriors.value) {
      if (warrior.currentHP <= 0) continue;
      const spec = warrior.spec;

      // Sentinel: 25% chance to intercept the hit entirely
      if (spec === "sentinel" && Math.random() < 0.25) {
        log(`<i class="ra ra-shield"></i> ${warrior.label} steps in front of the blow!`);
        warrior.currentHP = Math.max(0, warrior.currentHP - damageToPlayer);
        if (warrior.currentHP <= 0) {
          log(`<i class="ra ra-skull"></i> ${warrior.label} has fallen protecting you!`);
        }
        damageToPlayer = 0;
        break;
      }

      // Iron Monk: flat -2 damage reduction
      if (spec === "iron_monk") {
        damageToPlayer = Math.max(0, damageToPlayer - 2);
      }

      // Bulwark: -1 per round, up to -5
      if (spec === "bulwark") {
        const reduction = Math.min(warrior.roundsInCombat ?? 0, 5);
        damageToPlayer = Math.max(0, damageToPlayer - reduction);
      }
    }
  }

  if (typeof damageToPlayer === "number" && !isNaN(damageToPlayer)) {
    playerHP.value = Math.max(playerHP.value - damageToPlayer, 0);
    if (damageToPlayer > 0) {
      utils.onCombatResult?.({ type: "taken", amount: damageToPlayer });
      if (playerEnrageCharges) {
        playerEnrageCharges.value = Math.min(3, playerEnrageCharges.value + 1);
      }
      // Persistent ally takes the same damage as the player
      if (allyCompanion?.value && allyCompanion.value.currentHP > 0) {
        allyCompanion.value.currentHP = Math.max(0, allyCompanion.value.currentHP - damageToPlayer);
        if (allyCompanion.value.currentHP <= 0) {
          log(`<i class="ra ra-skull"></i> ${allyCompanion.value.name} has fallen!`);
          allyCompanion.value = null;
        } else {
          log(`<i class="ra ra-chain"></i> ${allyCompanion.value.name} takes ${damageToPlayer} damage! (${allyCompanion.value.currentHP} HP remaining)`);
        }
      }
      // Barracks warriors take shared damage; track hits for Duelist
      if (warriors?.value?.length > 0) {
        for (const warrior of warriors.value) {
          if (warrior.currentHP <= 0) continue;
          warrior.hitsPlayerReceivedInCombat = (warrior.hitsPlayerReceivedInCombat ?? 0) + 1;
          // Sentinel already took the damage above (if it intercepted, damageToPlayer was 0 so we skip)
          if (warrior.spec === "sentinel") continue;
          warrior.currentHP = Math.max(0, warrior.currentHP - damageToPlayer);
          if (warrior.currentHP <= 0) {
            log(`<i class="ra ra-skull"></i> ${warrior.label} has fallen!`);
          } else {
            log(`<i class="ra ra-sword"></i> ${warrior.label} takes ${damageToPlayer} damage! (${warrior.currentHP}/${warrior.maxHP} HP)`);
          }
        }
      }
    }

    // Apothecary heals each round regardless of hit/miss
    if (warriors?.value?.length > 0) {
      for (const warrior of warriors.value) {
        if (warrior.currentHP <= 0 || warrior.spec !== "apothecary") continue;
        const heal = Math.floor(Math.random() * 3) + 3; // 3–5
        playerHP.value = Math.min(effectiveMaxHP?.value ?? playerHP.value, playerHP.value + heal);
        log(`<i class="ra ra-flask"></i> ${warrior.label} tends your wounds for ${heal} HP.`);
      }
    }
  } else {
    console.error(
      "ERROR: damageToPlayer is not a valid number, defaulting to 0 damage.",
      damageToPlayer
    );
    playerHP.value = Math.max(playerHP.value - 0, 0);
  }

  // Defense augment procs that fire after enemy attack
  if (enemyAttemptedAttack && defenseAugment?.value) {
    const daug = defenseAugment.value;

    // Thornplate: reflect 2 damage back on any hit attempt
    if (daug === "thornplate") {
      const thornDmg = 2;
      enemyHP.value = Math.max(0, enemyHP.value - thornDmg);
      utils.onCombatResult?.({ type: "dealt", amount: thornDmg });
      log(`<i class="ra ra-thorny-vine"></i> Thornplate reflects ${thornDmg} damage back at ${formattedTitle}!`);
      utils.onProcEvent?.({ label: "Thornplate", icon: '<i class="ra ra-thorny-vine"></i>', color: "#44aa44", onEnemy: false });
      if (enemyHP.value <= 0) {
        log(`<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> defeated ${formattedTitle} with Thornplate!`);
        const defeatedEnemyData = encounter.value?.enemy;
        utils.onEnemyKilled?.(defeatedEnemyData, { skipGotoEnemyTurn: utils.skipEnemyTurn });
        if (enemiesKilled) enemiesKilled.value++;
        combatWinsSinceLastCapIncrease.value++;
        if (combatWinsSinceLastCapIncrease.value >= 10) {
          hpCapBonus.value += 10;
          log(`<i class="ra ra-trophy"></i> Your maximum HP increased by <strong>10</strong>. New max HP: ${effectiveMaxHP.value}`);
          utils.onHpCapIncrease?.();
          combatWinsSinceLastCapIncrease.value = 0;
          playerHP.value = Math.min(playerHP.value, effectiveMaxHP.value);
        }
        return;
      }
    }

    // Frostbound: 20% chance to Chill enemy (-1 dmg next hit) when damage landed
    if (daug === "frostbound" && damageToPlayer > 0 && Math.random() < 0.20) {
      enemyStatusEffects.value.push({ type: "chill", damageReduction: 1, duration: 1 });
      log(`<i class="ra ra-snowflake"></i> Frostbound retaliates — ${formattedTitle} is Chilled (-1 dmg next hit)!`);
      utils.onProcEvent?.({ label: "Frostbound", icon: '<i class="ra ra-snowflake"></i>', color: "#66ccff", onEnemy: false });
    }
  }

  // Bloodpact Rune: activate when HP drops below 25% for first time
  if (
    defenseAugment?.value === "bloodpactRune" &&
    !bloodpactActive?.value &&
    playerHP.value > 0 &&
    playerHP.value < effectiveMaxHP.value * 0.25
  ) {
    bloodpactActive.value = true;
    log(`<i class="ra ra-dripping-blade"></i> Bloodpact Rune awakens — rage fills the wound! +3 damage for the rest of this combat.`);
    utils.onProcEvent?.({ label: "Blood Pact", icon: '<i class="ra ra-dripping-blade"></i>', color: "#dd3344", onEnemy: false });
  }

  if (playerHP.value <= 0) {
    log(
      `<i class="ra ra-skull"></i> <span class="player-name">${playerName.value}</span> was defeated.`
    );
    encounter.value = null;
    clearTimer();
    setDefeated();
    return;
  }

  // Execute intents for all non-target enemies that were assigned to attack
  if (runSidekickAttacks()) return;

  const counterableActions = ["steal", "enrage", "confuse", "summon"];
  if (counterableActions.includes(enemyNextAction.value) && !enemyActionCountered) {
    utils.onCounterResult?.({ succeeded: false, delay: 0 });
  }

  gotoEnemyTurn();
}