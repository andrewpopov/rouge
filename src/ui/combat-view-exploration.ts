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
    "forsaken palisade": "Lantern fire flickers behind the stakes. Beyond the palisade, the covenant road disappears into mist.",
    "blighted moors": "Crimson fog clings to the moor. The stink of wet rot grows stronger with each step.",
    "black pit": "Torchlight gutters over a blasphemous sinkhole. Something hungry stirs below the chalk.",
    "pale fields": "A bitter wind sweeps the dead fields. Nothing living moves except the crows.",
    "graveyard ridge": "Broken markers lean from the ridge like snapped teeth. The dead listen from beneath the loam.",
    "cairn field": "Ancient cairns dot the field. The stones hum with a rhythm older than prayer.",
    "ashfall hamlet": "Burned roofs jut from the mist. Whatever happened here never truly ended.",
    "hollow passage": "The tunnel twists through damp stone. Water drips in a cadence that feels too deliberate.",
    "gloamwood": "Gnarled branches blot out the sky. The wood seems to breathe around the party.",
    "drowning marsh": "Black water bubbles between reeds and roots. Every step feels half a grave.",
    "ruined watchtower": "The tower still watches the marsh, though no honest sentry remains inside.",
    "monastery gate": "Iron-bound gates stand split and sagging. Beyond them, the abbey keeps its rot.",
    "outer abbey": "The outer courts lie deserted beneath cold stone arcades. Prayer died here long ago.",
    "gate barracks": "Rusting racks and broken shields crowd the corridor. The old garrison never truly left.",
    "iron cells": "Chains clink in the dark though no wind reaches this depth.",
    "inner cloister": "Candle stubs and ash stain the cloister floor. The silence feels held in place.",
    "black chapel": "The last sanctum reeks of smoke, wax, and old blasphemy.",
    "abbey vault": "The vault waits below the chapel, sealed in cold stone and feverish dread.",
    "oasis refuge": "Torchlight ripples across the oasis pools. Beyond the refuge, the sepulchers drink the sun.",
    "shale flats": "Wind scours the flats bare. Only broken shale and old bones remain.",
    "collapsed cisterns": "Dry cistern mouths yawn beneath the sand. The old water roads now breed only echoes.",
    "dust hills": "Parched ridges crumble underfoot. Vultures circle where the heat bends the horizon.",
    "buried tomb entries": "Half-choked doorways sink beneath the dunes. The dead wait just beyond the lintels.",
    "salt oasis": "The water gleams, but the air tastes wrong. Even the palms seem wary here.",
    "sunken archives": "Collapsed libraries lie under drifting sand. Names and curses rot together in the dark.",
    "worm-tunnels": "The walls pulse with old burrowing scars. The dark between chambers feels alive.",
    "serpent vaults": "Sealed idol halls coil beneath the stone. Something scaled still guards the gold.",
    "veiled court": "Curtained halls swallow sound. The palace remembers every whisper.",
    "lower court": "The lower chambers press close and airless. Servants once passed this way in fear.",
    "star archive": "Impossible lines of light and script stretch beyond reason. The vault of stars bends the mind.",
    "sandscript canyon": "The canyon walls are carved with dead script. Every turn feels like a verdict.",
    "royal vault": "The burial vault seals the road ahead. Kings sleep badly beneath this sand.",
    "royal sepulcher": "The sepulcher waits beneath layered stone and blood-oaths. Its seal was meant to hold forever.",
    "rotting dock refuge": "Rotting piers creak over black water. The river swallows light as easily as men.",
    "widowwood": "Thick webs and slick roots knot the trees together. The jungle watches from every angle.",
    "spider hollows": "Webbed hollows gape between the trunks. Bones hang where fruit should be.",
    "fever marsh": "The marsh steams with rot and insects. The air itself feels diseased.",
    "hunter village": "Lean huts and watchfires hide between the reeds. Whoever hunts here does not miss often.",
    "hunter canopy": "Ladders and platforms vanish into the green dark above. Eyes move with the leaves.",
    "drowned causeway": "Stone arches sink in black water. Old roads remain, but only just.",
    "river quarter": "Rot spreads through the river quarter. The jungle reclaims what trade abandoned.",
    "idol market": "Stalls and shrines rot together beneath staring idol faces. Offerings still smolder.",
    "flooded processional": "The old ritual road lies half submerged. Each step sends rings across the stagnant water.",
    "temple stairs": "The climb steepens toward the idol heights. Every landing feels like a warning.",
    "idol court": "The court is all stairs, firelight, and carved judgment. The city still kneels here.",
    "corrupted sanctum": "The descent grows colder with each level. The sanctum keeps its hatred close to the stone.",
    "ruined sanctuary": "Broken sanctuaries loom over a sky of cinders. Nothing holy remains here.",
    "burning causeway": "The road ahead burns in seams of living fire. Every step is paid for in heat.",
    "chained bastion": "Black chains bridge the fortress gaps. The whole bastion feels hauled together by force.",
    "demon forge": "Infernal furnaces roar beneath the walls. The very air tastes of iron and ash.",
    "black gate": "A monumental gate splits the fortress heart. Something vast waits beyond its firelit seam.",
    "ashen throne": "The throne-chamber glows like a wound. This is where the hell-road ends.",
    "frosthaven keep": "Signal fires burn above the keep walls. The last stronghold stares into the snow.",
    "siege walls": "Broken ladders and frozen blood mark the walls. The siege never truly ended.",
    "watchfire ridge": "Wind tears across the ridge and scatters sparks from the watchfires.",
    "icebound river": "The river is a sheet of groaning blue glass. Something black moves beneath it.",
    "tombs of the fallen": "Snow drifts over half-buried tombs. The dead here were not allowed peace.",
    "white drift cavern": "Snow chokes the cavern mouth. The cold inside is older than the mountain.",
    "ancient halls": "Stone halls run beneath the ice like buried memory. The mountain remembers every oath.",
    "mourning temple": "Frost clings to the old temple columns. Grief lingers here like incense.",
    "glacial tunnels": "The tunnels narrow through blue ice and black stone. Each breath burns the lungs.",
    "sorrow halls": "These halls are quiet enough to hear old regrets. The cold makes every sound brittle.",
    "frost scar": "A wind-carved scar splits the mountain. The climb turns cruel here.",
    "ruin halls": "Collapsed chambers and broken banners line the pass. The stronghold above is close now.",
    "the ascent": "The summit road rises into killing wind. There is no shelter left on this climb.",
    "oathbreaker vault": "A sealed vault lies behind shattered oaths. Whatever was hidden here was hidden for a reason.",
    "summit gate": "The final gate stands against the storm, half-buried in snow and defiance.",
    "summit citadel": "The citadel looms above the peaks. Its ruin crown hums through stone and bone.",
    "citadel core": "The core of the citadel throbs with siege heat and buried malice.",
    "crown of ruin": "The ruin crown waits in the deepest chamber, still hungry for the world beyond the mountain.",
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

  function getZoneKindLabel(zoneKind: string): string {
    if (zoneKind === ZONE_KIND.BOSS) {return "Boss Gate";}
    if (zoneKind === ZONE_KIND.MINIBOSS) {return "Hunt Pressure";}
    if (zoneKind === ZONE_KIND.QUEST) {return "Quest Fork";}
    if (zoneKind === ZONE_KIND.EVENT) {return "Aftermath";}
    return "Battle Path";
  }

  function getApproachPrompt(zoneKind: string): string {
    if (zoneKind === ZONE_KIND.BOSS) {return "Choose how the final assault begins.";}
    if (zoneKind === ZONE_KIND.MINIBOSS) {return "Choose how you breach the den before the creature strikes first.";}
    return "Choose how the first clash begins before the road answers back.";
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
    const assets = runtimeWindow.ROUGE_ASSET_MAP;
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
    const zoneKindLabel = getZoneKindLabel(zoneKind);
    const approachPrompt = getApproachPrompt(zoneKind);
    const sceneText = zoneKind === ZONE_KIND.BOSS
      ? "An oppressive darkness settles over the land. The final challenge awaits."
      : getExploreSceneText(zoneKind, zoneName);
    const heroPortraitSrc = assets?.getClassSprite(run.classId) || assets?.getClassPortrait(run.classId) || "";
    const combatBgSrc = runtimeWindow.__ROUGE_COMBAT_BG?.getCombatBackground(zoneName) || "";

    root.innerHTML = `
      ${common.renderNotice(appState, services.renderUtils)}
      <div class="explore-screen">
        <div class="explore-stage">
          <div class="explore-stage__bg" style="background-image:url('${escapeHtml(combatBgSrc)}')"></div>
          <div class="explore-stage__shade"></div>
          <div class="explore-stage__mist"></div>

          <div class="explore-stage__inner">
            <div class="explore-header">
              <div class="explore-header__title-block">
                <span class="explore-header__eyebrow">${escapeHtml(zoneKindLabel)} · Encounter ${encounterNum} of ${encounterTotal}</span>
                <h1 class="explore-header__zone">${escapeHtml(zoneName)}</h1>
                <p class="explore-header__copy">${escapeHtml(sceneText)}</p>
              </div>

              <div class="explore-header__stats">
                <div class="explore-header__stat">
                  <span class="explore-header__stat-label">Bloodline</span>
                  <strong class="explore-header__stat-value">${escapeHtml(run.className)} Lv.${run.level}</strong>
                </div>
                <div class="explore-header__stat">
                  <span class="explore-header__stat-label">Vitality</span>
                  <strong class="explore-header__stat-value">HP ${run.hero.currentLife}/${run.hero.maxLife}</strong>
                </div>
                <div class="explore-header__stat">
                  <span class="explore-header__stat-label">Treasury</span>
                  <strong class="explore-header__stat-value">${run.gold}g</strong>
                </div>
              </div>
            </div>

            <div class="explore-stage__body">
              ${heroPortraitSrc ? `
              <div class="explore-stage__figure">
                <div class="explore-stage__figure-glow"></div>
                <img class="explore-stage__portrait" src="${escapeHtml(heroPortraitSrc)}" alt="${escapeHtml(run.className)}" />
              </div>
              ` : ""}

              <div class="explore-stage__content">
                <div class="explore-decision">
                  <div class="explore-scene">
                    <div class="explore-scene__tag">Approach Selection</div>
                    <p class="explore-scene__prompt">${escapeHtml(approachPrompt)}</p>
                  </div>

                  <div class="explore-choices">
                    ${options.map((opt, i) => {
                      const bonus = runtimeWindow.__ROUGE_APPROACH_BONUS.pickBonus(opt.approach, seed * 7 + i * 13);
                      return `
                      <button class="explore-card explore-card--${opt.approach}" data-action="begin-encounter" data-bonus="${escapeHtml(bonus.id)}">
                        <div class="explore-card__head">
                          <span class="explore-card__icon">${opt.icon}</span>
                          <span class="explore-card__approach">${escapeHtml(opt.approach)}</span>
                        </div>
                        <div class="explore-card__title">${escapeHtml(opt.title)}</div>
                        <div class="explore-card__flavor">${escapeHtml(opt.flavor)}</div>
                        <div class="explore-card__footer">
                          <span class="explore-card__bonus-label">Opening Edge</span>
                          <strong class="explore-card__bonus">${escapeHtml(bonus.label)}</strong>
                        </div>
                      </button>`;
                    }).join("")}
                  </div>
                </div>
              </div>
            </div>
          </div>
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
