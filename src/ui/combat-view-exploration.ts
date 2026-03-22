(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { ZONE_KIND } = runtimeWindow.ROUGE_CONSTANTS;

  interface ExploreOption {
    title: string;
    flavor: string;
    icon: string;
    approach: string;
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
    if (zoneKind === ZONE_KIND.MINIBOSS) {
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
      { title: "Scout Ahead", flavor: "Move carefully through the underbrush. Something stirs in the shadows ahead.", icon: "\u{1F441}", approach: "cautious" },
      { title: "Charge Forward", flavor: "No time for caution. Draw steel and press into the clearing.", icon: "\u2694", approach: "aggressive" },
      { title: "Follow the Trail", flavor: "Tracks in the mud lead deeper. Whatever made them was large.", icon: "\u{1F43E}", approach: "tactical" },
    ],
    miniboss: [
      { title: "Enter the Lair", flavor: "The air grows heavy with malice. A powerful creature guards this passage.", icon: "\u{1F480}", approach: "cautious" },
      { title: "Challenge the Guardian", flavor: "A towering figure blocks the path. It has been waiting for you.", icon: "\u2620", approach: "aggressive" },
      { title: "Disturb the Nest", flavor: "Bones crunch underfoot. This is no ordinary hunting ground.", icon: "\u{1F5E1}", approach: "tactical" },
    ],
    boss: [
      { title: "Confront the Evil", flavor: "The final threshold. Beyond lies the source of corruption in this land.", icon: "\u{1F525}", approach: "cautious" },
      { title: "Begin the Assault", flavor: "Your party steels themselves. This is what the entire journey has led to.", icon: "\u26A1", approach: "aggressive" },
      { title: "Open the Gate", flavor: "Ancient seals crack and groan. There is no turning back now.", icon: "\u{1F6AA}", approach: "tactical" },
    ],
  };

  const GENERIC_OPTIONS: ExploreOption[] = [
    { title: "Explore", flavor: "The path ahead is uncertain. Press on and see what fate has in store.", icon: "\u{1F9ED}", approach: "cautious" },
    { title: "Investigate", flavor: "Something catches your eye in the distance. It warrants a closer look.", icon: "\u{1F50D}", approach: "tactical" },
    { title: "Advance", flavor: "The road stretches onward. Your party moves deeper into the unknown.", icon: "\u{1F6B6}", approach: "aggressive" },
  ];

  function getCardElement(card: CardDefinition): string {
    const text = card.text.toLowerCase();
    if (text.includes("fire") || text.includes("burn")) {return "fire";}
    if (text.includes("cold") || text.includes("ice") || text.includes("frost") || text.includes("freeze")) {return "ice";}
    if (text.includes("lightning")) {return "lightning";}
    if (text.includes("poison")) {return "poison";}
    if (text.includes("magic") || text.includes("arcane")) {return "arcane";}
    if (card.effects?.some((e) => e.kind === "damage" || e.kind === "damage_all")) {return "physical";}
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
    const zoneKind = zone?.kind || ZONE_KIND.BATTLE;
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
            zoneKind === ZONE_KIND.BOSS
              ? "An oppressive darkness settles over the land. The final challenge awaits."
              : getExploreSceneText(zoneKind, zoneName)
          )}</p>
        </div>

        <div class="explore-choices">
          ${options.map((opt, i) => {
            const bonus = runtimeWindow.__ROUGE_APPROACH_BONUS.pickBonus(opt.approach, seed * 7 + i * 13);
            return `
            <button class="explore-card" data-action="begin-encounter" data-bonus="${bonus.id}">
              <div class="explore-card__icon">${opt.icon}</div>
              <div class="explore-card__title">${escapeHtml(opt.title)}</div>
              <div class="explore-card__flavor">${escapeHtml(opt.flavor)}</div>
              <div class="explore-card__bonus">${escapeHtml(bonus.label)}</div>
            </button>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  runtimeWindow.__ROUGE_COMBAT_VIEW_EXPLORATION = {
    getCardElement,
    ELEMENT_LABELS,
    renderExploration,
  };
})();
