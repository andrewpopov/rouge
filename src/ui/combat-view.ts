(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  interface ExploreOption {
    title: string;
    flavor: string;
    icon: string;
  }

  const ZONE_SCENE_TEXT: Record<string, string> = {
    "blood moor": "Crimson fog clings to the moor. The stench of decay grows stronger with each step.",
    "den of evil": "Torchlight flickers across cavern walls slick with ichor. Something skitters in the dark.",
    "cold plains": "A bitter wind sweeps across the barren fields. Distant howls echo from the tree line.",
    "burial grounds": "Crumbling headstones jut from the earth like broken teeth. The dead do not rest here.",
    "stony field": "Ancient cairns dot the rocky landscape. The ground trembles with an unnatural rhythm.",
    "underground passage": "Damp stone corridors twist deeper into the earth. Water drips in an unsettling cadence.",
    "dark wood": "Gnarled branches claw at the sky overhead. The forest itself seems to breathe.",
    "tristram": "The ruins of a once-proud village smolder. Evil has left its mark here.",
    "black marsh": "Murky water bubbles with foul gases. The path ahead is treacherous and uncertain.",
    "tamoe highland": "The mountain pass narrows. Fortified walls of the monastery loom above.",
    "monastery gate": "Iron-bound gates stand twisted and broken. Beyond them, corruption festers.",
    "catacombs": "Cracked stone pillars line the descent. An oppressive chill seeps from the walls.",
    "rocky waste": "Sun-bleached bones litter the sand. Heat shimmers distort the horizon.",
    "dry hills": "Parched earth crunches underfoot. Vultures circle lazily overhead.",
    "far oasis": "Palm fronds rustle near stagnant pools. The oasis offers no sanctuary.",
    "lost city": "Sand-choked ruins of an ancient civilization stretch before you. Shadows move within.",
    "valley of snakes": "The canyon walls narrow. Scales rasp against stone all around you.",
    "arcane sanctuary": "Reality bends and fractures. Impossible geometry extends in every direction.",
    "canyon of the magi": "Seven tombs lie buried in the canyon walls. Only one holds the true evil.",
    "kurast docks": "Rotting wooden piers creak underfoot. The jungle presses in from all sides.",
    "spider forest": "Massive webs span between the trees. Cocoons hang like grotesque fruit.",
    "great marsh": "Thick reeds and fog make every direction look the same. You are not alone here.",
    "flayer jungle": "Tiny footprints and crude totems mark this as hostile territory.",
    "lower kurast": "Crumbling temples peek through the canopy. The jungle is reclaiming this place.",
    "kurast bazaar": "Abandoned market stalls overflow with rot. The merchants fled long ago.",
    "travincal": "The great temple complex has been desecrated. Dark prayers echo from within.",
    "durance of hate": "The descent grows colder with each level. Mephisto's hatred is almost tangible.",
    "outer steppes": "An endless plain of ash stretches before the fortress. The sky burns red.",
    "plains of despair": "Tortured souls wander aimlessly across the blasted landscape.",
    "city of the damned": "Towers of bone and sinew rise from a lake of fire. This is no city for the living.",
    "river of flame": "Molten rock flows in channels cut by demonic hands. The heat is unbearable.",
    "chaos sanctuary": "Five seal stones pulse with infernal energy. The Dark Lord waits at the center.",
    "harrogath": "The last bastion of the barbarian tribes. The mountain summit looms above.",
    "bloody foothills": "Siege engines smolder on the slopes. The assault on Mount Arreat has begun.",
    "frigid highlands": "Ice and snow coat everything. The cold cuts through armor like a blade.",
    "arreat plateau": "Sacred ground of the ancients. The mountain demands respect from all who climb.",
    "crystalline passage": "Ice crystals refract light into blinding rainbows. The beauty hides danger.",
    "glacial trail": "The path narrows to a frozen ledge. One wrong step means a fatal fall.",
    "frozen tundra": "Endless white stretches to the horizon. The wind howls with fury.",
    "ancient way": "Weathered statues of barbarian heroes line the path to the summit.",
    "worldstone keep": "The final descent. Reality itself trembles around the corrupted Worldstone.",
  };

  function getExploreSceneText(zoneKind: string, zoneTitle: string): string {
    if (zoneKind === "miniboss") {
      return "The air thickens with dread. Something powerful lurks nearby.";
    }
    const key = zoneTitle.toLowerCase();
    for (const [zoneKey, text] of Object.entries(ZONE_SCENE_TEXT)) {
      if (key.includes(zoneKey)) {
        return text;
      }
    }
    return "Your party enters the area. The sounds of civilization fade behind you.";
  }

  const ZONE_EXPLORE_OPTIONS: Record<string, ExploreOption[]> = {
    battle: [
      { title: "Scout Ahead", flavor: "Move carefully through the underbrush. Something stirs in the shadows ahead.", icon: "\u{1F441}" },
      { title: "Charge Forward", flavor: "No time for caution. Draw steel and press into the clearing.", icon: "\u2694" },
      { title: "Follow the Trail", flavor: "Tracks in the mud lead deeper. Whatever made them was large.", icon: "\u{1F43E}" },
    ],
    miniboss: [
      { title: "Enter the Lair", flavor: "The air grows heavy with malice. A powerful creature guards this passage.", icon: "\u{1F480}" },
      { title: "Challenge the Guardian", flavor: "A towering figure blocks the path. It has been waiting for you.", icon: "\u2620" },
      { title: "Disturb the Nest", flavor: "Bones crunch underfoot. This is no ordinary hunting ground.", icon: "\u{1F5E1}" },
    ],
    boss: [
      { title: "Confront the Evil", flavor: "The final threshold. Beyond lies the source of corruption in this land.", icon: "\u{1F525}" },
      { title: "Begin the Assault", flavor: "Your party steels themselves. This is what the entire journey has led to.", icon: "\u26A1" },
      { title: "Open the Gate", flavor: "Ancient seals crack and groan. There is no turning back now.", icon: "\u{1F6AA}" },
    ],
  };

  const GENERIC_OPTIONS: ExploreOption[] = [
    { title: "Explore", flavor: "The path ahead is uncertain. Press on and see what fate has in store.", icon: "\u{1F9ED}" },
    { title: "Investigate", flavor: "Something catches your eye in the distance. It warrants a closer look.", icon: "\u{1F50D}" },
    { title: "Advance", flavor: "The road stretches onward. Your party moves deeper into the unknown.", icon: "\u{1F6B6}" },
  ];

  function getCardElement(card: CardDefinition): string {
    const text = card.text.toLowerCase();
    if (text.includes("fire") || text.includes("burn")) return "fire";
    if (text.includes("cold") || text.includes("ice") || text.includes("frost") || text.includes("freeze")) return "ice";
    if (text.includes("lightning")) return "lightning";
    if (text.includes("poison")) return "poison";
    if (text.includes("magic") || text.includes("arcane")) return "arcane";
    if (card.effects?.some((e) => e.kind === "damage" || e.kind === "damage_all")) return "physical";
    return "support";
  }

  const ELEMENT_LABELS: Record<string, string> = {
    fire: "Fire",
    ice: "Cold",
    lightning: "Lightning",
    poison: "Poison",
    arcane: "Arcane",
    physical: "Attack",
    support: "Skill",
  };

  function getExploreOptions(zoneKind: string, seed: number): ExploreOption[] {
    const pool = ZONE_EXPLORE_OPTIONS[zoneKind] || GENERIC_OPTIONS;
    const shuffled = [...pool].sort((a, b) => {
      const ha = (seed * 31 + a.title.length) % 100;
      const hb = (seed * 31 + b.title.length) % 100;
      return ha - hb;
    });
    return shuffled.slice(0, runtimeWindow.ROUGE_LIMITS.CARD_CHOICES);
  }

  function renderCardPickScreen(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const event = appState.ui.explorationEvent;
    const explorationEvents = runtimeWindow.ROUGE_EXPLORATION_EVENTS;
    const upgradableIds = explorationEvents?.getUpgradableCardIds(run, appState.content) || [];

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="event-screen">
        <div class="event-screen__header">
          <div class="event-screen__icon">${event.icon}</div>
          <h1 class="event-screen__title">${escapeHtml(event.title)}</h1>
          <p class="event-screen__sub">Choose a card to upgrade</p>
        </div>

        <div class="event-card-pick">
          ${upgradableIds.map((cardId) => {
            const card = appState.content.cardCatalog[cardId];
            const upgradedCard = appState.content.cardCatalog[`${cardId}_plus`];
            if (!card || !upgradedCard) {return "";}
            return `
              <button class="event-card-pick__card" data-action="pick-event-card" data-card-id="${escapeHtml(cardId)}">
                <div class="event-card-pick__current">
                  <span class="event-card-pick__cost">${card.cost}</span>
                  <span class="event-card-pick__name">${escapeHtml(card.title)}</span>
                  <span class="event-card-pick__type">${ELEMENT_LABELS[getCardElement(card)] || "Skill"}</span>
                </div>
                <div class="event-card-pick__arrow">\u2192</div>
                <div class="event-card-pick__upgraded">
                  <span class="event-card-pick__cost event-card-pick__cost--plus">${upgradedCard.cost}</span>
                  <span class="event-card-pick__name event-card-pick__name--plus">${escapeHtml(upgradedCard.title)}</span>
                  <span class="event-card-pick__desc">${escapeHtml(upgradedCard.text)}</span>
                </div>
              </button>
            `;
          }).join("")}
        </div>

        <button class="event-skip-btn" data-action="skip-event-card-pick">Never mind</button>
      </div>
    `;
  }

  function renderExplorationEvent(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const event = appState.ui.explorationEvent;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const zoneName = zone?.title || "Unknown";

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="event-screen">
        <div class="event-screen__header">
          <span class="event-screen__eyebrow">${escapeHtml(zoneName)}</span>
          <div class="event-screen__icon">${event.icon}</div>
          <h1 class="event-screen__title">${escapeHtml(event.title)}</h1>
        </div>

        <div class="event-screen__scene">
          <p class="event-screen__flavor">${escapeHtml(event.flavor)}</p>
        </div>

        <div class="event-screen__choices">
          ${event.choices.map((choice) => `
            <button class="event-choice" data-action="pick-event-choice" data-choice-id="${escapeHtml(choice.id)}">
              <div class="event-choice__title">${escapeHtml(choice.title)}</div>
              <div class="event-choice__desc">${escapeHtml(choice.description)}</div>
            </button>
          `).join("")}
        </div>

        <button class="event-skip-btn" data-action="skip-exploration-event">Leave</button>
      </div>
    `;
  }

  function renderExploration(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (appState.ui.explorationEvent?.pendingChoiceId) {
      renderCardPickScreen(root, appState, services);
      return;
    }

    if (appState.ui.explorationEvent) {
      renderExplorationEvent(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const zoneName = zone?.title || combat.encounter.name;
    const zoneKind = zone?.kind || "battle";
    const encounterNum = (zone?.encountersCleared || 0) + 1;
    const encounterTotal = zone?.encounterTotal || 1;
    const seed = zoneName.length + encounterNum;
    const options = getExploreOptions(zoneKind, seed);

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="explore-screen">
        <div class="explore-header">
          <span class="explore-header__eyebrow">Encounter ${encounterNum} of ${encounterTotal}</span>
          <h1 class="explore-header__zone">${escapeHtml(zoneName)}</h1>
          <div class="explore-header__stats">
            <span>${escapeHtml(run.className)} Lv.${run.level}</span>
            <span>\u00b7</span>
            <span>HP ${run.hero.currentLife}/${run.hero.maxLife}</span>
            <span>\u00b7</span>
            <span>${run.gold}g</span>
          </div>
        </div>

        <div class="explore-scene">
          <div class="explore-scene__ambience"></div>
          <p class="explore-scene__text">${escapeHtml(
            zoneKind === "boss"
              ? "An oppressive darkness settles over the land. The final challenge awaits."
              : getExploreSceneText(zoneKind, zoneName)
          )}</p>
        </div>

        <div class="explore-choices">
          ${options.map((opt) => `
            <button class="explore-card" data-action="begin-encounter">
              <div class="explore-card__icon">${opt.icon}</div>
              <div class="explore-card__title">${escapeHtml(opt.title)}</div>
              <div class="explore-card__flavor">${escapeHtml(opt.flavor)}</div>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function svgIcon(src: string, cls: string, alt: string): string {
    return `<img src="${src}" class="${cls}" alt="${alt}" loading="lazy" onerror="this.style.display='none'" />`;
  }

  function render(root: HTMLElement, appState: AppState, services: UiRenderServices): void {
    if (appState.ui.exploring) {
      renderExploration(root, appState, services);
      return;
    }

    const common = runtimeWindow.ROUGE_UI_COMMON;
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
    const { escapeHtml } = services.renderUtils;
    const run = appState.run;
    const combat = appState.combat;
    const zone = services.runFactory.getZoneById(run, run.activeZoneId);
    const selectedEnemy = combat.enemies.find((enemy) => enemy.id === combat.selectedEnemyId && enemy.alive) || null;

    let phaseText = "Enemy Turn";
    if (combat.outcome === "victory") {
      phaseText = "Victory";
    } else if (combat.outcome === "defeat") {
      phaseText = "Defeat";
    } else if (combat.phase === "player") {
      phaseText = "Your Turn";
    }

    const zoneName = zone?.title || combat.encounter.name;
    const zoneFlavor = runtimeWindow.__ROUGE_ZONE_FLAVOR;
    const zoneEnv = zoneFlavor?.resolveZoneEnv?.(zoneName) || "moor";
    const encounterNum = (zone?.encountersCleared || 0) + 1;
    const encounterTotal = zone?.encounterTotal || 1;
    const hpPercent = Math.round((combat.hero.life / combat.hero.maxLife) * 100);
    const mercHpPercent = Math.round((combat.mercenary.life / combat.mercenary.maxLife) * 100);
    const cardCount = combat.hand.length;
    const weaponEquip = run.loadout?.weapon;
    const weaponItem = weaponEquip ? appState.content.itemCatalog?.[weaponEquip.itemId] : null;
    const weaponRarity = weaponEquip?.rarity || "white";
    let rarityColor = "#aaa";
    if (weaponRarity === "brown") { rarityColor = "#c59a46"; }
    else if (weaponRarity === "yellow") { rarityColor = "#ddc63b"; }
    const canMelee = combat.phase === "player" && !combat.outcome && !combat.meleeUsed && (combat.weaponDamageBonus || 0) > 0;

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="combat-screen">

        <div class="combat-hud">
          <div class="combat-hud__left">
            <span class="combat-hud__hp">${assets ? svgIcon(assets.getUiIcon("hp") || "", "hud-icon", "HP") : "\u2764"} ${combat.hero.life}/${combat.hero.maxLife}</span>
            <span class="combat-hud__gold">\u{1F4B0} ${run.gold}</span>
            <span class="combat-hud__potions">\u{1F9EA} ${combat.potions}</span>
          </div>
          <div class="combat-hud__center">
            <span class="combat-hud__phase combat-hud__phase--${combat.outcome || combat.phase}">${escapeHtml(phaseText)}</span>
            <span class="combat-hud__zone">${escapeHtml(zoneName)} \u00b7 ${encounterNum}/${encounterTotal}</span>
          </div>
          <div class="combat-hud__right">
            <span class="combat-hud__floor">Wave ${encounterNum}</span>
            ${weaponItem ? `<span style="color:${rarityColor};font-weight:bold;font-size:0.8em">${escapeHtml(weaponItem.name)}</span>` : ""}
          </div>
        </div>

        <div class="stage" data-env="${zoneEnv}">
          <div class="stage__backdrop"></div>
          <div class="stage__floor"></div>

          <div class="stage__allies">
            <div class="sprite ${combat.hero.alive ? "" : "sprite--dead"}">
              <div class="sprite__figure sprite__figure--hero">${assets ? svgIcon(assets.getClassSprite(run.classId) || assets.getClassPortrait(run.classId) || "", "sprite__portrait", run.className) : escapeHtml(run.className.charAt(0))}</div>
              <div class="sprite__bars">
                <div class="sprite__hp-bar">
                  <div class="sprite__hp-fill sprite__hp-fill--hero" style="width:${hpPercent}%"></div>
                  <span class="sprite__hp-text">${combat.hero.life}/${combat.hero.maxLife}</span>
                </div>
                ${combat.hero.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${combat.hero.guard}</div>` : ""}
              </div>
              <div class="sprite__label">${escapeHtml(combat.hero.name)}</div>
              <button class="sprite__potion" data-action="use-potion-hero"
                ${combat.potions <= 0 || combat.hero.life >= combat.hero.maxLife || combat.outcome ? "disabled" : ""}>\u{1F9EA}</button>
            </div>

            <div class="sprite ${combat.mercenary.alive ? "" : "sprite--dead"}">
              <div class="sprite__figure sprite__figure--merc">${assets ? svgIcon(assets.getMercenarySprite(combat.mercenary.id) || "", "sprite__portrait", combat.mercenary.role) : escapeHtml(combat.mercenary.role.charAt(0))}</div>
              <div class="sprite__bars">
                <div class="sprite__hp-bar">
                  <div class="sprite__hp-fill sprite__hp-fill--merc" style="width:${mercHpPercent}%"></div>
                  <span class="sprite__hp-text">${combat.mercenary.life}/${combat.mercenary.maxLife}</span>
                </div>
                ${combat.mercenary.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${combat.mercenary.guard}</div>` : ""}
              </div>
              <div class="sprite__label">${escapeHtml(combat.mercenary.name)}</div>
              <button class="sprite__potion" data-action="use-potion-mercenary"
                ${combat.potions <= 0 || !combat.mercenary.alive || combat.mercenary.life >= combat.mercenary.maxLife || combat.outcome ? "disabled" : ""}>\u{1F9EA}</button>
            </div>
          </div>

          <div class="stage__enemies">
            ${combat.enemies.map((enemy) => {
              const isSelected = selectedEnemy?.id === enemy.id;
              const isDead = !enemy.alive;
              const enemyHpPct = Math.round((enemy.life / enemy.maxLife) * 100);
              const intentDesc = services.combatEngine.describeIntent(enemy.currentIntent);
              const enemyIcon = assets ? assets.getEnemyIcon(enemy.templateId || enemy.id) : "";
              const intentSvg = assets ? svgIcon(assets.getIntentIcon(intentDesc), "intent-icon", intentDesc) : "";
              return `
                <button class="sprite sprite--enemy ${isSelected ? "sprite--targeted" : ""} ${isDead ? "sprite--dead" : ""}"
                        data-action="select-enemy" data-enemy-id="${escapeHtml(enemy.id)}"
                        ${isDead || Boolean(combat.outcome) ? "disabled" : ""}>
                  ${!isDead && !combat.outcome ? `<div class="sprite__intent"><span class="sprite__intent-icon">${intentSvg || "\u2753"}</span><span class="sprite__intent-label">${escapeHtml(intentDesc)}</span></div>` : ""}
                  <div class="sprite__figure sprite__figure--enemy">${assets ? svgIcon(enemyIcon, "sprite__portrait sprite__portrait--enemy", enemy.name) : escapeHtml(enemy.name.charAt(0))}</div>
                  <div class="sprite__bars">
                    <div class="sprite__hp-bar">
                      <div class="sprite__hp-fill sprite__hp-fill--enemy" style="width:${enemyHpPct}%"></div>
                      <span class="sprite__hp-text">${enemy.life}/${enemy.maxLife}</span>
                    </div>
                    ${enemy.guard > 0 ? `<div class="sprite__status sprite__status--guard">${assets ? svgIcon(assets.getUiIcon("guard") || "", "status-icon status-icon--guard", "Guard") : "\u{1F6E1}"} ${enemy.guard}</div>` : ""}
                    ${enemy.burn > 0 ? `<div class="sprite__status sprite__status--burn">${assets ? svgIcon(assets.getUiIcon("burn") || "", "status-icon status-icon--burn", "Burn") : "\u{1F525}"} ${enemy.burn}</div>` : ""}
                  </div>
                  <div class="sprite__label">${escapeHtml(enemy.name)}</div>
                </button>
              `;
            }).join("")}
          </div>

          ${combat.outcome ? `
            <div class="stage__outcome stage__outcome--${combat.outcome}">
              <div class="stage__outcome-title">${combat.outcome === "victory" ? "\u2694 Victory!" : "\u{1F480} Defeat"}</div>
              <div class="stage__outcome-sub">${combat.outcome === "victory"
                ? "The enemies fall. Claim your reward."
                : "Your expedition ends here."}</div>
            </div>
          ` : ""}
        </div>

        <div class="combat-tray">
          <div class="energy-orb" title="Energy: play cards that cost this much or less">
            <div class="energy-orb__value">${combat.hero.energy}</div>
            <div class="energy-orb__max">/${combat.hero.maxEnergy}</div>
            <div class="energy-orb__label">Energy</div>
          </div>

          <div class="card-fan" style="--card-count:${cardCount}">
            ${combat.hand.map((instance, i) => {
              const card = appState.content.cardCatalog[instance.cardId];
              const element = getCardElement(card);
              const requiresTarget = card.target === "enemy";
              const cantPlay =
                combat.outcome ||
                combat.phase !== "player" ||
                combat.hero.energy < card.cost ||
                (requiresTarget && !selectedEnemy);
              const mid = (cardCount - 1) / 2;
              const offset = i - mid;
              const rotation = offset * 4;
              const translateY = Math.abs(offset) * 6;
              return `
                <button class="fan-card ${cantPlay ? "fan-card--disabled" : ""} fan-card--${element}"
                        data-action="play-card" data-instance-id="${escapeHtml(instance.instanceId)}"
                        style="--fan-rotate:${rotation}deg; --fan-lift:${translateY}px; --fan-index:${i}">
                  <div class="fan-card__cost">${card.cost}</div>
                  <div class="fan-card__art">${(() => { if (assets) { return svgIcon(assets.getCardIcon(instance.cardId, card.effects), `fan-card__icon fan-card__icon--${element}`, card.title); } return card.target === "enemy" ? "\u2694" : "\u{1F6E1}"; })()}</div>
                  <div class="fan-card__name">${escapeHtml(card.title)}</div>
                  <div class="fan-card__desc">${escapeHtml(card.text)}</div>
                  <div class="fan-card__type">${ELEMENT_LABELS[element] || "Skill"}</div>
                </button>
              `;
            }).join("")}
          </div>

          ${canMelee ? `<button class="end-turn-btn" data-action="melee-strike" style="background:#754;margin-bottom:4px">\u2694 Melee Strike (${combat.weaponDamageBonus})</button>` : ""}

          <button class="end-turn-btn" data-action="end-turn"
            ${combat.phase !== "player" || combat.outcome ? "disabled" : ""}>
            End Turn
          </button>
        </div>

        <details class="town-operations-details">
          <summary class="town-operations-toggle">Combat Log</summary>
          <ol class="log-list combat-log-list">
            ${combat.log.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}
          </ol>
        </details>
      </div>
    `;
  }

  runtimeWindow.ROUGE_COMBAT_VIEW = {
    render,
  };
})();
