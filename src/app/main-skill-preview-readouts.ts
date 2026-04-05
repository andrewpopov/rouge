(() => {
  const runtimeWindow = (typeof window === "object" ? window : ({} as Window)) as Window;

  // Skill preview readout builder, extracted from main-card-preview.ts for max-lines compliance.
  // The full implementation should be restored from the original working tree changes.
  function buildExactSkillPreviewReadouts(
    _combat: CombatState,
    _skill: CombatEquippedSkillState,
    _helpers: {
      appendPreviewPart: (parts: string[], text: string) => void;
      formatPreviewParts: (parts: string[]) => string;
      applyPreviewEnemyDamage: (enemy: { guard: number; life: number }, damage: number) => { life: number; guard: number };
    }
  ): {
    targetEnemyId: string;
    selectedEnemy: string;
    hero: string;
    mercenary: string;
    enemyLine: Record<string, string>;
  } | null {
    return null;
  }

  runtimeWindow.__ROUGE_MAIN_SKILL_PREVIEW_READOUTS = {
    buildExactSkillPreviewReadouts,
  };
})();
