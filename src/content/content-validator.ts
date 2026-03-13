(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;
  const { validateRuntimeContent } = runtimeWindow.ROUGE_CONTENT_VALIDATOR_RUNTIME_CONTENT;
  const { validateWorldNodeCatalog } = runtimeWindow.__ROUGE_CV_WORLD_CATALOG;

  function pushError(errors, message) { errors.push(message); }

  function hasAtLeastOneEnemy(poolEntry) {
    return [
      ...(Array.isArray(poolEntry?.enemies) ? poolEntry.enemies : []),
      ...(Array.isArray(poolEntry?.nativeEnemies) ? poolEntry.nativeEnemies : []),
      ...(Array.isArray(poolEntry?.guestEnemiesNightmareHell) ? poolEntry.guestEnemiesNightmareHell : []),
    ].length > 0;
  }

  function validateSeedBundle(seedBundle) {
    const errors = [];
    const classEntries = Array.isArray(seedBundle?.classes?.classes) ? seedBundle.classes.classes : [];
    const skillClasses = Array.isArray(seedBundle?.skills?.classes) ? seedBundle.skills.classes : [];
    const acts = Array.isArray(seedBundle?.zones?.acts) ? seedBundle.zones.acts : [];
    const bossEntries = Array.isArray(seedBundle?.bosses?.entries) ? seedBundle.bosses.entries : [];
    const enemyPools = Array.isArray(seedBundle?.enemyPools?.enemyPools) ? seedBundle.enemyPools.enemyPools : [];

    if (classEntries.length === 0) {
      pushError(errors, "Seed bundle is missing playable classes.");
    }

    if (skillClasses.length === 0) {
      pushError(errors, "Seed bundle is missing skills.json class progression content.");
    }

    const knownClassIds = new Set(classEntries.map((entry) => entry?.id).filter(Boolean));
    const seenSkillClassIds = new Set();
    skillClasses.forEach((entry, index) => {
      if (!entry?.classId) {
        pushError(errors, `skills.classes[${index}] is missing a classId.`);
        return;
      }
      if (!knownClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes[${index}] references unknown class "${entry.classId}".`);
      }
      if (seenSkillClassIds.has(entry.classId)) {
        pushError(errors, `skills.classes contains duplicate classId "${entry.classId}".`);
      }
      seenSkillClassIds.add(entry.classId);

      const trees = Array.isArray(entry.trees) ? entry.trees : [];
      if (trees.length === 0) {
        pushError(errors, `skills.classes[${index}] is missing skill trees.`);
        return;
      }

      trees.forEach((tree, treeIndex) => {
        if (!tree?.id) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing an id.`);
        }
        if (!tree?.name) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing a name.`);
        }
        const skills = Array.isArray(tree?.skills) ? tree.skills : [];
        if (skills.length === 0) {
          pushError(errors, `skills.classes[${index}].trees[${treeIndex}] is missing skills.`);
          return;
        }
        skills.forEach((skill, skillIndex) => {
          if (!skill?.id || !skill?.name) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing identity fields.`);
          }
          if (!Number.isFinite(Number(skill?.requiredLevel))) {
            pushError(errors, `skills.classes[${index}].trees[${treeIndex}].skills[${skillIndex}] is missing a numeric requiredLevel.`);
          }
        });
      });
    });

    classEntries.forEach((entry) => {
      if (entry?.id && !seenSkillClassIds.has(entry.id)) {
        pushError(errors, `Playable class "${entry.id}" is missing skills.json progression data.`);
      }
    });

    if (acts.length === 0) {
      pushError(errors, "Seed bundle is missing zone acts.");
    }

    const seenActs = new Set();
    acts.forEach((actSeed, index) => {
      if (!Number.isInteger(actSeed?.act)) {
        pushError(errors, `zones.acts[${index}] is missing a valid act number.`);
        return;
      }
      if (seenActs.has(actSeed.act)) {
        pushError(errors, `zones.acts contains duplicate act number ${actSeed.act}.`);
      }
      seenActs.add(actSeed.act);

      if (!actSeed?.boss?.id) {
        pushError(errors, `Act ${actSeed.act} is missing a boss id.`);
      } else if (!bossEntries.some((entry) => entry.id === actSeed.boss.id)) {
        pushError(errors, `Act ${actSeed.act} boss "${actSeed.boss.id}" has no matching bosses entry.`);
      }

      const poolEntry = enemyPools.find((entry) => entry.act === actSeed.act) || null;
      if (!poolEntry) {
        pushError(errors, `Act ${actSeed.act} is missing an enemy pool entry.`);
      } else if (!hasAtLeastOneEnemy(poolEntry)) {
        pushError(errors, `Act ${actSeed.act} enemy pool does not contain any enemies.`);
      }
    });

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  function assertValid(report) {
    if (report.ok) {
      return;
    }
    throw new Error(`Content validation failed:\n- ${report.errors.join("\n- ")}`);
  }

  runtimeWindow.ROUGE_CONTENT_VALIDATOR = {
    validateSeedBundle,
    assertValidSeedBundle(seedBundle) {
      assertValid(validateSeedBundle(seedBundle));
    },
    validateRuntimeContent,
    assertValidRuntimeContent(content) {
      assertValid(validateRuntimeContent(content));
    },
    validateWorldNodeCatalog,
    assertValidWorldNodeCatalog(worldNodeCatalog) {
      assertValid(validateWorldNodeCatalog(worldNodeCatalog));
    },
  };
})();
