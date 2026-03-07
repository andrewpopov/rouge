(() => {
  const content = window.ROUGE_GAME_CONTENT;
  const engine = window.ROUGE_COMBAT_ENGINE;

  const els = {
    encounterBlurb: document.getElementById("encounterBlurb"),
    encounterSelect: document.getElementById("encounterSelect"),
    mercenarySelect: document.getElementById("mercenarySelect"),
    restartBtn: document.getElementById("restartBtn"),
    turnValue: document.getElementById("turnValue"),
    phaseValue: document.getElementById("phaseValue"),
    energyValue: document.getElementById("energyValue"),
    potionValue: document.getElementById("potionValue"),
    deckValue: document.getElementById("deckValue"),
    discardValue: document.getElementById("discardValue"),
    partyRow: document.getElementById("partyRow"),
    enemyRow: document.getElementById("enemyRow"),
    targetHint: document.getElementById("targetHint"),
    handRow: document.getElementById("handRow"),
    logList: document.getElementById("logList"),
    potionHeroBtn: document.getElementById("potionHeroBtn"),
    potionMercBtn: document.getElementById("potionMercBtn"),
    endTurnBtn: document.getElementById("endTurnBtn"),
  };

  let state = null;

  function populateSelect(selectEl, options) {
    selectEl.innerHTML = "";
    options.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option.id;
      optionEl.textContent = option.name;
      selectEl.appendChild(optionEl);
    });
  }

  function getSelectedEnemy() {
    return state?.enemies.find((enemy) => enemy.id === state.selectedEnemyId && enemy.alive) || null;
  }

  function restartEncounter() {
    state = engine.createCombatState({
      content,
      encounterId: els.encounterSelect.value,
      mercenaryId: els.mercenarySelect.value,
    });
    render();
  }

  function buildStat(label, value) {
    return `<div class="entity-stat"><span>${label}</span><strong>${value}</strong></div>`;
  }

  function renderStatus() {
    const phaseText =
      state.outcome === "victory"
        ? "Victory"
        : state.outcome === "defeat"
          ? "Defeat"
          : "Player Turn";
    els.turnValue.textContent = String(state.turn);
    els.phaseValue.textContent = phaseText;
    els.energyValue.textContent = `${state.hero.energy}/${state.hero.maxEnergy}`;
    els.potionValue.textContent = String(state.potions);
    els.deckValue.textContent = String(state.drawPile.length);
    els.discardValue.textContent = String(state.discardPile.length);
    els.encounterBlurb.textContent = state.encounter.description;
  }

  function renderParty() {
    const hero = state.hero;
    const mercenary = state.mercenary;
    els.partyRow.innerHTML = `
      <article class="entity-card ally ${hero.alive ? "" : "dead"}">
        <div class="entity-name-row">
          <strong class="entity-name">${hero.name}</strong>
          <span class="entity-role">${hero.className}</span>
        </div>
        <div class="entity-stat-grid">
          ${buildStat("Life", `${hero.life}/${hero.maxLife}`)}
          ${buildStat("Guard", hero.guard)}
          ${buildStat("Energy", `${hero.energy}/${hero.maxEnergy}`)}
          ${buildStat("Hand", state.hand.length)}
        </div>
        <p class="entity-passive">Deck-driven hero actions. Potions and mercenary support sit outside the hand.</p>
      </article>
      <article class="entity-card ally ${mercenary.alive ? "" : "dead"}">
        <div class="entity-name-row">
          <strong class="entity-name">${mercenary.name}</strong>
          <span class="entity-role">${mercenary.role}</span>
        </div>
        <div class="entity-stat-grid">
          ${buildStat("Life", `${mercenary.life}/${mercenary.maxLife}`)}
          ${buildStat("Guard", mercenary.guard)}
          ${buildStat("Attack", mercenary.attack)}
          ${buildStat("Bonus", mercenary.nextAttackBonus)}
        </div>
        <p class="entity-passive">${mercenary.passiveText}</p>
      </article>
    `;
  }

  function renderEnemies() {
    const selectedEnemy = getSelectedEnemy();
    els.enemyRow.innerHTML = "";
    state.enemies.forEach((enemy) => {
      const card = document.createElement("button");
      card.className = `entity-card enemy ${enemy.alive ? "" : "dead"} ${selectedEnemy?.id === enemy.id ? "selected" : ""}`;
      card.disabled = !enemy.alive || Boolean(state.outcome);
      card.innerHTML = `
        <div class="entity-name-row">
          <strong class="entity-name">${enemy.name}</strong>
          <span class="entity-role">${enemy.alive ? "Hostile" : "Downed"}</span>
        </div>
        <div class="entity-stat-grid">
          ${buildStat("Life", `${enemy.life}/${enemy.maxLife}`)}
          ${buildStat("Guard", enemy.guard)}
          ${buildStat("Burn", enemy.burn)}
          ${buildStat("Intent", enemy.intentIndex + 1)}
        </div>
        <p class="entity-intent">${engine.describeIntent(enemy.currentIntent)}</p>
      `;
      card.addEventListener("click", () => {
        state.selectedEnemyId = enemy.id;
        render();
      });
      els.enemyRow.appendChild(card);
    });

    if (selectedEnemy) {
      els.targetHint.textContent = `Selected target: ${selectedEnemy.name}`;
    } else if (state.outcome === "victory") {
      els.targetHint.textContent = "Encounter cleared. Start another fight to continue iterating on combat.";
    } else if (state.outcome === "defeat") {
      els.targetHint.textContent = "Hero defeated. Restart to test the encounter again.";
    } else {
      els.targetHint.textContent = "Select a living enemy.";
    }
  }

  function renderHand() {
    const selectedEnemy = getSelectedEnemy();
    els.handRow.innerHTML = "";

    state.hand.forEach((instance) => {
      const card = content.cardCatalog[instance.cardId];
      const requiresTarget = card.target === "enemy";
      const button = document.createElement("button");
      button.className = "card-btn";
      button.disabled =
        Boolean(state.outcome) ||
        state.phase !== "player" ||
        state.hero.energy < card.cost ||
        (requiresTarget && !selectedEnemy);
      button.innerHTML = `
        <div class="card-top">
          <strong class="card-title">${card.title}</strong>
          <span class="card-cost">${card.cost}</span>
        </div>
        <p class="card-copy">${card.text}</p>
        <p class="card-target">${card.target === "enemy" ? "Targeted Skill" : "Party Skill"}</p>
      `;
      button.addEventListener("click", () => {
        engine.playCard(state, content, instance.instanceId, requiresTarget ? state.selectedEnemyId : "");
        render();
      });
      els.handRow.appendChild(button);
    });
  }

  function renderLog() {
    els.logList.innerHTML = "";
    state.log.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      els.logList.appendChild(item);
    });
  }

  function renderButtons() {
    const canPotionHero = state.potions > 0 && state.hero.alive && state.hero.life < state.hero.maxLife && !state.outcome;
    const canPotionMerc =
      state.potions > 0 && state.mercenary.alive && state.mercenary.life < state.mercenary.maxLife && !state.outcome;
    els.potionHeroBtn.disabled = !canPotionHero;
    els.potionMercBtn.disabled = !canPotionMerc;
    els.endTurnBtn.disabled = state.phase !== "player" || Boolean(state.outcome);
  }

  function render() {
    renderStatus();
    renderParty();
    renderEnemies();
    renderHand();
    renderLog();
    renderButtons();
  }

  populateSelect(els.encounterSelect, Object.values(content.encounterCatalog));
  populateSelect(els.mercenarySelect, Object.values(content.mercenaryCatalog));

  els.restartBtn.addEventListener("click", restartEncounter);
  els.endTurnBtn.addEventListener("click", () => {
    engine.endTurn(state);
    render();
  });
  els.potionHeroBtn.addEventListener("click", () => {
    engine.usePotion(state, "hero");
    render();
  });
  els.potionMercBtn.addEventListener("click", () => {
    engine.usePotion(state, "mercenary");
    render();
  });

  restartEncounter();
})();
