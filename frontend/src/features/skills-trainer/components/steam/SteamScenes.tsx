import { Fragment } from 'react';
import {
  BOILING_C,
  PARTS,
  SIM_SPEED,
  type PartId,
  type SampleId,
  type SteamLab,
} from '../../hooks/useSteamDistillationLab';
import { useSteamStrings } from '../../hooks/useSteamStrings';
import {
  Balance,
  BeakerGlass,
  BenchSurface,
  Draggable,
  DropGuide,
  GLASS_FILL,
  INK,
  RoundFlask,
  SAMPLE_COLOR,
  SURFACE,
  SvgLabel,
  WATER,
  SOLVENT,
  type DragState,
  type Point,
  type StartDrag,
} from './Glassware';

export interface SceneProps {
  lab: SteamLab;
  drag: DragState | null;
  start: StartDrag;
  activate: (id: string) => void;
}

export const BALANCE_PAN: Point = { x: 700, y: 348 };
export const GRIND_BOWL: Point = { x: 450, y: 345 };
export const CHARGE_FLASK: Point = { x: 730, y: 330 };
export const SLOT: Record<PartId, Point> = {
  flask: { x: 170, y: 310 },
  thermometer: { x: 170, y: 190 },
  condenser: { x: 410, y: 255 },
  receiver: { x: 700, y: 385 },
};
const SHELF: Record<PartId, Point & { s: number }> = {
  receiver: { x: 410, y: 92, s: 0.6 },
  flask: { x: 500, y: 100, s: 0.55 },
  thermometer: { x: 590, y: 92, s: 0.5 },
  condenser: { x: 735, y: 92, s: 0.4 },
};

const JARS: SampleId[] = ['cinnamon', 'clove', 'orange', 'lemon'];

export function WeighScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  const canPick = lab.massRecorded === null;
  const heap = lab.sample && lab.sampleG > 0 ? Math.max(0.35, lab.sampleG / 8) : 0;
  return (
    <g>
      <BenchSurface />
      <Balance cx={700} baseY={420} reading={lab.sampleG.toFixed(2)}>
        {lab.sample && heap > 0 && (
          <path d="M-30 0 Q-20 -22 0 -26 Q20 -22 30 0 Z" transform={`scale(${heap + 0.3})`} fill={SAMPLE_COLOR[lab.sample]} />
        )}
      </Balance>
      {drag && canPick && <DropGuide x={BALANCE_PAN.x} y={BALANCE_PAN.y - 10} r={70} active />}
      {JARS.map((id, i) => (
        <Draggable
          key={id}
          id={`jar:${id}`}
          home={{ x: 110 + i * 130, y: 420 }}
          drag={drag}
          start={start}
          enabled={canPick}
          label={t.samples[id]}
          onActivate={() => activate(`jar:${id}`)}
        >
          <rect x={-34} y={-92} width={68} height={16} rx={4} fill={INK} />
          <rect x={-30} y={-76} width={60} height={76} rx={8} fill={SURFACE} stroke={lab.sample === id ? 'rgb(var(--color-accent))' : INK} strokeWidth={lab.sample === id ? 3 : 2} />
          <rect x={-24} y={-50} width={48} height={14} rx={3} fill={SAMPLE_COLOR[id]} />
          <text x={0} y={-12} textAnchor="middle" fontSize={11} fill="rgb(var(--color-ink))" pointerEvents="none">
            {t.samples[id]}
          </text>
        </Draggable>
      ))}
    </g>
  );
}

const CHUNKS: [number, number][] = [[-50, -8], [-30, 6], [-8, -14], [14, 2], [36, -10], [52, 4], [-40, -26], [-14, -30], [10, -24], [34, -30], [-24, -4], [2, 8], [24, -14], [44, -22]];

function Mortar({ grind, empty = false }: { grind: number; empty?: boolean }) {
  const r = 2 + 8 * (1 - grind / 100);
  return (
    <g>
      <path d="M-90 -35 H90 Q90 55 0 55 Q-90 55 -90 -35 Z" fill={SURFACE} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      <rect x={-40} y={55} width={80} height={12} rx={4} fill={SURFACE} stroke={INK} strokeWidth={2} />
      {!empty && (
        <g>
          <ellipse cx={0} cy={28} rx={70} ry={12} fill="#7c4a2d" fillOpacity={0.2 + (grind / 100) * 0.6} />
          {CHUNKS.map(([dx, dy], i) => (
            <circle key={i} cx={dx} cy={28 + dy * 0.8} r={r} fill="#7c4a2d" />
          ))}
        </g>
      )}
    </g>
  );
}

function Pestle() {
  return (
    <g>
      <rect x={-10} y={-120} width={20} height={100} rx={9} fill={SURFACE} stroke={INK} strokeWidth={2.5} />
      <circle cx={0} cy={-8} r={22} fill={SURFACE} stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

export function GrindScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  return (
    <g>
      <BenchSurface />
      <g transform={`translate(${GRIND_BOWL.x} ${GRIND_BOWL.y})`}>
        <Mortar grind={lab.grind} />
      </g>
      <Draggable id="pestle" home={{ x: 770, y: 400 }} drag={drag} start={start} enabled={lab.grind < 100} label="Pestle" onActivate={() => activate('pestle')}>
        <Pestle />
      </Draggable>
      <SvgLabel x={GRIND_BOWL.x} y={GRIND_BOWL.y + 100} anchor="middle">
        {t.ui.grindProgress}: {Math.round(lab.grind)}%
      </SvgLabel>
    </g>
  );
}

export function ChargeScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  const level = lab.waterMl > 0 ? Math.min(0.8, 0.15 + lab.waterMl * 0.007) : 0;
  const canTransfer = lab.grind >= 100 && !lab.inFlask;
  return (
    <g>
      <BenchSurface />
      {drag && canTransfer && <DropGuide x={CHARGE_FLASK.x} y={CHARGE_FLASK.y} r={80} active />}
      <RoundFlask cx={CHARGE_FLASK.x} cy={CHARGE_FLASK.y + 40} id="charge-flask" level={level}>
        {lab.inFlask && <ellipse cx={CHARGE_FLASK.x} cy={CHARGE_FLASK.y + 82} rx={36} ry={7} fill="#7c4a2d" />}
      </RoundFlask>
      <SvgLabel x={CHARGE_FLASK.x} y={448} anchor="middle">{t.parts.flask} (250 mL)</SvgLabel>

      <g>
        <rect x={420} y={180} width={60} height={240} rx={4} fill={GLASS_FILL} stroke={INK} strokeWidth={3} />
        <rect x={423} y={420 - lab.cylinderMl * 2.2 - 3} width={54} height={lab.cylinderMl * 2.2} fill={WATER} />
        {Array.from({ length: 11 }, (_, i) => (
          <Fragment key={i}>
            <line x1={420} x2={i % 2 === 0 ? 442 : 432} y1={420 - i * 22} y2={420 - i * 22} stroke={INK} />
            {i % 2 === 0 && <text x={488} y={424 - i * 22} fontSize={11} fill={INK}>{i * 10}</text>}
          </Fragment>
        ))}
        <SvgLabel x={450} y={448} anchor="middle">{t.ui.cylinder}: {lab.cylinderMl} mL</SvgLabel>
      </g>

      <Draggable id="mortar" home={{ x: 170, y: 365 }} scale={0.8} drag={drag} start={start} enabled={canTransfer} label="Mortar" onActivate={() => activate('mortar')}>
        <Mortar grind={100} empty={lab.inFlask} />
      </Draggable>
    </g>
  );
}

interface ApparatusProps extends SceneProps {
  mode: 'distil' | 'solvent';
}

function ThermometerPart({ temp, shown }: { temp: number; shown: boolean }) {
  const mercury = Math.max(0, Math.min(150, (temp - 0) * 1.2));
  return (
    <g>
      <rect x={-16} y={0} width={32} height={14} rx={3} fill="#9a6b3f" />
      <rect x={-5} y={-90} width={10} height={160} rx={5} fill={GLASS_FILL} stroke={INK} strokeWidth={2} />
      <circle cx={0} cy={70} r={8} fill="#ef4444" />
      <rect x={-2} y={70 - mercury} width={4} height={mercury} fill="#ef4444" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={5} x2={i % 5 === 0 ? 14 : 10} y1={70 - i * 12} y2={70 - i * 12} stroke={INK} strokeWidth={1} />
      ))}
      {shown && (
        <text x={22} y={-70} fontSize={12} fill={INK} fontFamily="ui-monospace, monospace">
          {Math.round(temp)}°C
        </text>
      )}
    </g>
  );
}

function CondenserPart({ tap, flow, vapour }: { tap: boolean; flow: 'slow' | 'medium' | 'fast'; vapour: boolean }) {
  const dur = flow === 'slow' ? 2 : flow === 'medium' ? 1.2 : 0.6;
  return (
    <g>
      <path d="M-227 -50 L-173 -50" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M-227 -50 L-173 -50" stroke={SURFACE} strokeWidth={5} strokeLinecap="round" />
      <path d="M173 50 L280 78 Q290 82 290 95" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      <path d="M173 50 L280 78 Q290 82 290 95" fill="none" stroke={SURFACE} strokeWidth={5} strokeLinecap="round" />
      <g transform="rotate(16)">
        <rect x={-180} y={-6} width={360} height={12} fill={SURFACE} stroke={INK} strokeWidth={2} />
        <rect x={-150} y={-17} width={300} height={34} rx={6} fill={tap ? 'rgb(10 132 255 / 0.28)' : GLASS_FILL} stroke={INK} strokeWidth={2.5} />
        <rect x={-180} y={-5} width={360} height={10} fill={vapour ? 'rgb(var(--color-ink) / 0.12)' : SURFACE} />
        <line x1={-120} y1={-17} x2={-120} y2={-34} stroke={INK} strokeWidth={5} />
        <line x1={120} y1={17} x2={120} y2={34} stroke={INK} strokeWidth={5} />
        {tap && (
          <g>
            <line x1={150} y1={11} x2={-150} y2={11} stroke="rgb(10 132 255)" strokeWidth={3} strokeDasharray="8 8">
              <animate attributeName="stroke-dashoffset" from={0} to={-32} dur={`${dur}s`} repeatCount="indefinite" />
            </line>
            <line x1={150} y1={-11} x2={-150} y2={-11} stroke="rgb(10 132 255)" strokeWidth={3} strokeDasharray="8 8">
              <animate attributeName="stroke-dashoffset" from={0} to={-32} dur={`${dur}s`} repeatCount="indefinite" />
            </line>
          </g>
        )}
      </g>
    </g>
  );
}

export function ApparatusScene({ lab, drag, start, activate, mode }: ApparatusProps) {
  const t = useSteamStrings();
  const solvent = mode === 'solvent';
  const placed = (p: PartId) => (solvent ? p === 'flask' || lab.stillArranged : lab.parts[p]);
  const heating = solvent ? lab.solventHeating : lab.heating;
  const boiling = solvent ? lab.solventHeating : lab.heating && lab.temp >= BOILING_C - 0.5;
  const vapour = boiling;
  const escaping = !solvent && lab.heating && lab.temp >= BOILING_C - 0.5 && !lab.tap;

  const flaskLevel = solvent
    ? lab.solventDone
      ? 0.04
      : 0.15 + 0.45 * (lab.solventLeftMl / Math.max(1, lab.organicMl))
    : lab.waterMl > 0
      ? Math.min(0.8, 0.15 + (lab.waterMl - lab.distillateMl) * 0.007)
      : 0;
  const collected = solvent ? lab.organicMl - lab.solventLeftMl : lab.distillateMl;
  const receiverLevel = Math.min(1, collected / 50);
  const surfaceY = 418 - receiverLevel * 64;
  const dropping = solvent ? lab.solventHeating && lab.tap : lab.dropsPerSec > 0;
  const dropDur = solvent ? 0.5 : Math.min(2, Math.max(0.4, 0.5 / (lab.dropsPerSec * 3 || 1)));
  const heater = solvent ? lab.heatSource : 'mantle';
  const unplaced = solvent ? [] : PARTS.filter((p) => !lab.parts[p]);

  const partTransform = (p: PartId) => {
    if (drag?.id === `part:${p}`) return `translate(${drag.x} ${drag.y})`;
    if (placed(p)) return `translate(${SLOT[p].x} ${SLOT[p].y})`;
    const s = SHELF[p];
    return `translate(${s.x} ${s.y}) scale(${s.s})`;
  };
  const partProps = (p: PartId) => {
    const isPlaced = placed(p);
    return {
      transform: partTransform(p),
      role: isPlaced ? undefined : 'button',
      tabIndex: isPlaced ? undefined : 0,
      'aria-label': isPlaced ? undefined : t.parts[p],
      onPointerDown: isPlaced ? undefined : start(`part:${p}`),
      onKeyDown: isPlaced
        ? undefined
        : (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activate(`part:${p}`);
            }
          },
      style: { cursor: isPlaced ? 'default' : drag?.id === `part:${p}` ? 'grabbing' : 'grab', touchAction: 'none' as const },
    };
  };

  return (
    <g>
      <BenchSurface />

      {unplaced.length > 0 && (
        <rect x={372} y={22} width={510} height={118} rx={14} fill="none" stroke={INK} strokeOpacity={0.35} strokeDasharray="5 5" pointerEvents="none" />
      )}
      {unplaced.map((p) => (
        <DropGuide key={p} x={SLOT[p].x} y={SLOT[p].y} r={p === 'condenser' ? 60 : 46} active={drag?.id === `part:${p}`} />
      ))}

      {heater === 'mantle' && (
        <g pointerEvents="none">
          <rect x={100} y={345} width={140} height={78} rx={20} fill={SURFACE} stroke={INK} strokeWidth={2.5} />
          <rect x={112} y={355} width={116} height={14} rx={7} fill="rgb(249 115 22)" fillOpacity={heating ? 0.25 + (solvent ? 0.5 : lab.power / 140) : 0.08} />
        </g>
      )}
      {heater === 'steambath' && (
        <g pointerEvents="none">
          <path d="M100 350 H240 Q240 420 170 420 Q100 420 100 350 Z" fill={WATER} stroke={INK} strokeWidth={2.5} />
          {heating &&
            [140, 170, 200].map((x, i) => (
              <path key={x} d={`M${x} 345 q-6 -14 0 -26 q6 -12 0 -24`} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={2}>
                <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur={`${1.6 + i * 0.3}s`} repeatCount="indefinite" />
              </path>
            ))}
        </g>
      )}

      <g {...partProps('flask')}>
        <RoundFlask cx={0} cy={0} id={solvent ? 'still-flask' : 'bench-flask'} level={flaskLevel} liquid={solvent ? SOLVENT : WATER} boiling={boiling}>
          {!solvent && lab.inFlask && <ellipse cx={0} cy={44} rx={32} ry={7} fill="#7c4a2d" />}
        </RoundFlask>
      </g>

      <g {...partProps('thermometer')}>
        <ThermometerPart temp={solvent ? 40 : lab.temp} shown={placed('thermometer') && !solvent} />
      </g>

      <g {...partProps('condenser')}>
        <CondenserPart tap={lab.tap && placed('condenser')} flow={lab.flow} vapour={vapour && placed('condenser') && lab.tap} />
      </g>

      <g {...partProps('receiver')}>
        <BeakerGlass cx={0} baseY={35} w={80} h={70} level={placed('receiver') ? receiverLevel : 0} liquid={solvent ? SOLVENT : WATER} />
      </g>

      {dropping && placed('receiver') && placed('condenser') && (
        <circle cx={700} cy={352} r={3.5} fill="rgb(10 132 255)" pointerEvents="none">
          <animate attributeName="cy" from={352} to={surfaceY} dur={`${dropDur}s`} repeatCount="indefinite" />
        </circle>
      )}

      {escaping && placed('condenser') && (
        <g pointerEvents="none">
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={500 + i * 30} cy={225} r={6} fill="rgb(var(--color-ink) / 0.25)">
              <animate attributeName="cy" from={225} to={170} dur={`${1.4 + i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from={0.7} to={0} dur={`${1.4 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </g>
      )}

      {placed('thermometer') && !solvent && <SvgLabel x={104} y={27}>{t.parts.thermometer}</SvgLabel>}
      {placed('condenser') && <SvgLabel x={330} y={170}>{t.parts.condenser}</SvgLabel>}
      {placed('condenser') && <SvgLabel x={285} y={186} fill="rgb(10 132 255)">{t.parts.waterOut}</SvgLabel>}
      {placed('condenser') && <SvgLabel x={500} y={352} fill="rgb(10 132 255)">{t.parts.waterIn}</SvgLabel>}
      <SvgLabel x={170} y={445} anchor="middle">{t.parts.flask}</SvgLabel>
      {placed('receiver') && <SvgLabel x={700} y={445} anchor="middle">{t.parts.receiver}</SvgLabel>}
      {!solvent && lab.heating && (
        <SvgLabel x={SLOT.flask.x} y={SLOT.flask.y + 78} anchor="middle" fill="rgb(var(--color-ink-muted))">
          ×{SIM_SPEED}
        </SvgLabel>
      )}
    </g>
  );
}
