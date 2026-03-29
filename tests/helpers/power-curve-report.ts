import {
  runProgressionSimulationReport,
  type RunProgressionSimulationOptions,
} from "./run-progression-simulator";

type EncounterBandKind = "boss" | "elite" | "battle";
type PowerBandStatus = "below_target" | "on_target" | "above_target";

export interface PowerBandRange {
  min: number;
  max: number;
}

export interface PowerCurveProbeAssessment {
  kind: EncounterBandKind;
  encounterName: string;
  zoneTitle: string;
  enemyPowerScore: number;
  powerDelta: number;
  powerRatio: number;
  averageTurns: number;
  winRate: number;
  targetBand: PowerBandRange;
  status: PowerBandStatus;
}

export interface PowerCurveCheckpointReport {
  actNumber: number;
  label: string;
  heroPowerScore: number;
  probes: PowerCurveProbeAssessment[];
}

export interface PowerCurvePolicyReport {
  policyId: string;
  policyLabel: string;
  outcome: "reached_checkpoint" | "run_complete" | "run_failed";
  finalActNumber: number;
  finalLevel: number;
  checkpoints: PowerCurveCheckpointReport[];
  counts: Record<PowerBandStatus, number>;
}

export interface PowerCurveClassReport {
  classId: string;
  className: string;
  policyReports: PowerCurvePolicyReport[];
}

export interface PowerCurveReport {
  generatedAt: string;
  targetBands: Record<EncounterBandKind, PowerBandRange>;
  throughActNumber: number;
  classReports: PowerCurveClassReport[];
}

export type PowerCurveReportOptions = RunProgressionSimulationOptions;

export function getDefaultPowerBands(): Record<EncounterBandKind, PowerBandRange> {
  return {
    boss: { min: 1.1, max: 1.4 },
    elite: { min: 1.4, max: 1.8 },
    battle: { min: 2.0, max: 3.0 },
  };
}

function getBandStatus(ratio: number, band: PowerBandRange): PowerBandStatus {
  if (ratio < band.min) {
    return "below_target";
  }
  if (ratio > band.max) {
    return "above_target";
  }
  return "on_target";
}

export function runPowerCurveReport(options: PowerCurveReportOptions = {}): PowerCurveReport {
  const progressionReport = runProgressionSimulationReport(options);
  const targetBands = getDefaultPowerBands();

  const classReports = progressionReport.classReports.map((classReport) => {
    return {
      classId: classReport.classId,
      className: classReport.className,
      policyReports: classReport.policyReports.map((policyReport) => {
        const counts: Record<PowerBandStatus, number> = {
          below_target: 0,
          on_target: 0,
          above_target: 0,
        };

        const checkpoints = policyReport.checkpoints.map((checkpoint) => {
          const probes = checkpoint.probes.map((probe) => {
            const targetBand = targetBands[probe.kind];
            const status = getBandStatus(probe.powerRatio, targetBand);
            counts[status] += 1;
            return {
              kind: probe.kind,
              encounterName: probe.encounterName,
              zoneTitle: probe.zoneTitle,
              enemyPowerScore: probe.enemyPowerScore,
              powerDelta: probe.powerDelta,
              powerRatio: probe.powerRatio,
              averageTurns: probe.averageTurns,
              winRate: probe.winRate,
              targetBand,
              status,
            };
          });

          return {
            actNumber: checkpoint.actNumber,
            label: checkpoint.label,
            heroPowerScore: checkpoint.powerScore,
            probes,
          };
        });

        return {
          policyId: policyReport.policyId,
          policyLabel: policyReport.policyLabel,
          outcome: policyReport.outcome,
          finalActNumber: policyReport.finalActNumber,
          finalLevel: policyReport.finalLevel,
          checkpoints,
          counts,
        };
      }),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    targetBands,
    throughActNumber: progressionReport.throughActNumber,
    classReports,
  };
}
