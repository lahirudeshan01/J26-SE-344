import type { ReactNode } from 'react';
import {
  EXTRACTIONS_NEEDED,
  PARTS,
  SCOOPS_NEEDED,
  TARGET_DISTILLATE_ML,
  BOILING_C,
  SIM_SPEED,
  type FlowRate,
  type HeatSource,
  type SteamLab,
} from '../../hooks/useSteamDistillationLab';
import { useSteamStrings } from '../../hooks/useSteamStrings';

const primary =
  'rounded-full bg-accent-gradient px-4 py-2 text-sm font-medium text-white shadow-soft transition active:scale-95 disabled:opacity-40 disabled:active:scale-100';
const secondary =
  'rounded-full border border-line-strong bg-elevated px-3.5 py-1.5 text-sm transition hover:border-accent active:scale-95 disabled:opacity-40 disabled:hover:border-line-strong disabled:active:scale-100';
const chip = 'rounded-full bg-elevated px-3 py-1 text-xs tabular-nums text-ink-muted';

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="w-32 shrink-0 text-xs font-medium text-ink-muted">{label}</span>}
      {children}
    </div>
  );
}

function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      {label && <span className="text-xs text-ink-muted">{label}</span>}
      <div className="h-2 w-40 overflow-hidden rounded-full bg-elevated" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
        <div className="h-full rounded-full bg-accent-gradient transition-[width]" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function SteamControls({ lab }: { lab: SteamLab }) {
  const t = useSteamStrings();
  const u = t.ui;
  const allParts = PARTS.every((p) => lab.parts[p]);
  const boiling = lab.heating && lab.temp >= BOILING_C - 0.5;
  const heatReady = allParts && lab.waterMl > 0 && lab.inFlask;
  const rate = lab.dropsPerSec > 0 ? `1 ${u.perDrop} ${(1 / lab.dropsPerSec).toFixed(1)} s` : u.noDrops;
  const mm = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const tapControls = (
    <Row label={u.tap}>
      <button className={secondary} onClick={lab.toggleTap}>
        {lab.tap ? u.tapOn : u.tapOff}
      </button>
      {(['slow', 'medium', 'fast'] as FlowRate[]).map((f) => (
        <button
          key={f}
          className={`${secondary} ${lab.flow === f ? 'border-accent text-accent' : ''}`}
          aria-pressed={lab.flow === f}
          onClick={() => lab.setFlow(f)}
        >
          {f === 'slow' ? u.flowSlow : f === 'medium' ? u.flowMedium : u.flowFast}
        </button>
      ))}
    </Row>
  );

  if (lab.step >= 6 && lab.week === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">{u.week1Done}</p>
        <button className={primary} onClick={lab.startWeek2}>{u.continueWeek2}</button>
      </div>
    );
  }

  switch (lab.step) {
    case 0:
      return (
        <div className="space-y-3">
          <Row label={u.balance}>
            <span className={chip}>{lab.sample ? t.samples[lab.sample] : u.sampleNone}</span>
            <span className={chip}>{lab.sampleG.toFixed(2)} g</span>
          </Row>
          <Row>
            {[-1, -0.1, 0.1, 1].map((d) => (
              <button key={d} className={secondary} disabled={!lab.sample || lab.massRecorded !== null} onClick={() => lab.adjustSample(d)}>
                {d > 0 ? '+' : '−'}{Math.abs(d)} g
              </button>
            ))}
            <button className={primary} disabled={!lab.sample || lab.sampleG <= 0 || lab.massRecorded !== null} onClick={lab.recordMass}>
              {u.recordMass}
            </button>
          </Row>
        </div>
      );
    case 1:
      return <Progress value={lab.grind} label={u.grindProgress} />;
    case 2:
      return (
        <div className="space-y-3">
          <Row label={u.cylinder}>
            {[-10, -1, 1, 10].map((d) => (
              <button key={d} className={secondary} onClick={() => lab.adjustCylinder(d)}>
                {d > 0 ? '+' : '−'}{Math.abs(d)} mL
              </button>
            ))}
            <span className={chip}>{lab.cylinderMl} mL</span>
            <button className={primary} disabled={!lab.inFlask || lab.cylinderMl <= 0} onClick={lab.pourWater}>
              {u.pour}
            </button>
          </Row>
          <Row label={u.waterInFlask}>
            <span className={chip}>{lab.waterMl} mL</span>
          </Row>
        </div>
      );
    case 3:
    case 4:
    case 5:
      return (
        <div className="space-y-3">
          <Row label={u.partsPlaced}>
            {PARTS.map((p) => (
              <span key={p} className={`${chip} ${lab.parts[p] ? 'bg-accent-soft text-accent' : ''}`}>
                {t.parts[p]}
              </span>
            ))}
          </Row>
          {tapControls}
          <Row label={u.heater}>
            <button className={primary} disabled={!lab.heating && !heatReady} onClick={lab.toggleHeat}>
              {lab.heating ? u.heatOff : u.heatOn}
            </button>
            <label className="flex items-center gap-2 text-xs text-ink-muted">
              {u.power}
              <input
                type="range"
                min={0}
                max={100}
                value={lab.power}
                onChange={(e) => lab.setPower(Number(e.target.value))}
                aria-label={u.power}
                className="w-40 accent-[rgb(var(--color-accent))]"
              />
              <span className="w-10 tabular-nums">{lab.power}%</span>
            </label>
            {!heatReady && <span className="text-xs text-ink-subtle">{u.heatLocked}</span>}
          </Row>
          <Row label={u.temperature}>
            <span className={chip}>{lab.parts.thermometer ? `${(Math.round(lab.temp * 2) / 2).toFixed(1)} °C` : '—'}</span>
            <span className={chip}>{u.dropRate}: {rate}</span>
            <span className={chip}>{u.distillate}: {lab.distillateMl.toFixed(1)} mL</span>
            <span className={chip}>{u.simTime}: {mm(lab.elapsedSim)} (×{SIM_SPEED})</span>
          </Row>
          <Row>
            <button className={secondary} disabled={lab.distillateMl <= 0 || lab.firstDropTemp !== null || !lab.parts.thermometer} onClick={() => lab.recordTemp('first')}>
              {u.recordFirst}
            </button>
            <button className={secondary} disabled={lab.distillateMl < TARGET_DISTILLATE_ML || lab.endTemp !== null || !lab.parts.thermometer} onClick={() => lab.recordTemp('end')}>
              {u.recordEnd}
            </button>
          </Row>
          {boiling && !lab.tap && <p className="text-sm text-danger" role="alert">{u.escaping}</p>}
        </div>
      );
    case 6:
      return (
        <div className="space-y-3">
          <Row label={u.cycle}>
            <span className={chip}>{Math.min(lab.extractions + (lab.busy === 'drain' ? 0 : 0), EXTRACTIONS_NEEDED)}/{EXTRACTIONS_NEEDED}</span>
            {lab.funnel === 'empty' && <span className="text-xs text-ink-subtle">{u.extractHint}</span>}
          </Row>
          <Row>
            <button className={secondary} disabled={lab.funnel !== 'solvent' || !!lab.busy} onClick={lab.shake}>{u.shake}</button>
            <button className={secondary} disabled={lab.pressure === 0} onClick={lab.vent}>{u.vent}</button>
            <button className={secondary} disabled={lab.funnel !== 'shaken' || !!lab.busy} onClick={lab.settle}>{u.settle}</button>
            <button className={primary} disabled={lab.funnel !== 'settled' || !!lab.busy} onClick={lab.drain}>{u.drain}</button>
          </Row>
          {lab.busy && <Progress value={lab.busyProgress * 100} />}
          {lab.pressure >= 2 && <p className="text-sm text-danger" role="alert">{u.ventWarning}</p>}
        </div>
      );
    case 7:
      return (
        <div className="space-y-3">
          <Row label={u.scoops}>
            <span className={chip}>{lab.scoops}</span>
            {lab.scoops > 0 && <span className={chip}>{lab.scoops >= SCOOPS_NEEDED ? u.freeFlowing : u.clumped}</span>}
          </Row>
          <Row>
            <button className={secondary} disabled={lab.scoops === 0 || lab.stood} onClick={lab.swirl}>{u.swirl}</button>
            <button className={primary} disabled={lab.scoops === 0 || lab.stood || !!lab.busy} onClick={lab.stand}>{u.stand}</button>
          </Row>
          {lab.busy === 'stand' && <Progress value={lab.busyProgress * 100} label={u.standing} />}
        </div>
      );
    case 8:
      return (
        <Row>
          <button className={primary} disabled={!lab.flaskOnBalance || lab.emptyFlaskG !== null} onClick={lab.recordEmptyFlask}>
            {u.recordEmpty}
          </button>
          {lab.emptyFlaskG !== null && <span className={chip}>{u.emptyFlask}: {lab.emptyFlaskG.toFixed(2)} g</span>}
        </Row>
      );
    case 9: {
      const sources: { id: HeatSource; label: string }[] = [
        { id: 'steambath', label: u.steambath },
        { id: 'mantle', label: u.mantle },
        { id: 'bunsen', label: u.bunsen },
      ];
      return (
        <div className="space-y-3">
          <Row label={u.heatSource}>
            {sources.map((s) => (
              <button
                key={s.id}
                className={`${secondary} ${lab.heatSource === s.id ? 'border-accent text-accent' : ''}`}
                aria-pressed={lab.heatSource === s.id}
                disabled={lab.solventHeating}
                onClick={() => lab.chooseHeatSource(s.id)}
              >
                {s.label}
              </button>
            ))}
          </Row>
          {lab.bunsenBlocked && <p className="text-sm text-danger" role="alert">{u.bunsenBlocked}</p>}
          <Row>
            <button className={secondary} disabled={lab.stillArranged} onClick={lab.arrangeStill}>{u.arrange}</button>
          </Row>
          {tapControls}
          <Row>
            <button className={primary} disabled={!lab.stillArranged || !lab.heatSource || lab.solventDone} onClick={lab.toggleSolventHeat}>
              {lab.solventHeating ? u.stopHeat : u.startHeat}
            </button>
            <span className={chip}>{u.solventLeft}: {lab.solventLeftMl.toFixed(1)} mL</span>
            <span className={chip}>{u.solventCollected}: {(lab.organicMl - lab.solventLeftMl).toFixed(1)} mL</span>
          </Row>
          {lab.solventHeating && !lab.tap && <p className="text-sm text-danger" role="alert">{u.escaping}</p>}
        </div>
      );
    }
    case 10:
      return (
        <div className="space-y-3">
          <Row>
            <button className={secondary} disabled={lab.outsideDried} onClick={lab.dryOutside}>{u.dryOutside}</button>
            <button className={primary} disabled={!((lab.outsideDried && lab.mass1 === null) || (lab.steamed && lab.mass2 === null))} onClick={lab.weighFlask}>
              {u.weigh}
            </button>
            <button className={secondary} disabled={lab.mass1 === null || lab.steamed || !!lab.busy} onClick={lab.warmOnSteamBath}>
              {u.warm}
            </button>
          </Row>
          {lab.busy === 'steam' && <Progress value={lab.busyProgress * 100} label={u.warming} />}
        </div>
      );
    default:
      return <p className="text-sm font-medium text-accent">{t.allDone}</p>;
  }
}
