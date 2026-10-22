import {
  EXTRACT_ML,
  EXTRACTIONS_NEEDED,
  SCOOPS_NEEDED,
  balanceReading,
} from '../../hooks/useSteamDistillationLab';
import { useSteamStrings } from '../../hooks/useSteamStrings';
import {
  Balance,
  BeakerGlass,
  BenchSurface,
  Draggable,
  DropGuide,
  ErlenmeyerFlask,
  GLASS_FILL,
  INK,
  RoundFlask,
  SOLVENT,
  SURFACE,
  SvgLabel,
  WATER,
} from './Glassware';
import type { SceneProps } from './SteamScenes';

export const FUNNEL_TOP = { x: 450, y: 110 };
export const DRY_FLASK = { x: 450, y: 330 };
export const DECANT_FLASK = { x: 700, y: 330 };
const FUNNEL_BODY = 'M438 120 C 365 150 365 255 440 285 L 440 298 L 460 298 L 460 285 C 535 255 535 150 462 120 Z';

function Bottle({ label, color }: { label: string; color: string }) {
  return (
    <g>
      <rect x={-12} y={-104} width={24} height={20} rx={4} fill={INK} />
      <rect x={-28} y={-86} width={56} height={86} rx={9} fill={SURFACE} stroke={INK} strokeWidth={2} />
      <rect x={-22} y={-50} width={44} height={36} rx={3} fill={color} fillOpacity={0.35} />
      <text x={0} y={-28} textAnchor="middle" fontSize={11} fill="rgb(var(--color-ink))" pointerEvents="none">
        {label}
      </text>
    </g>
  );
}

export function ExtractScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  const { funnel, busy, busyProgress: p } = lab;
  const shaking = busy === 'shake';
  const draining = busy === 'drain';
  const dcmH = EXTRACT_ML * 3.6 * (draining ? 1 - p : 1);
  const bottom = 298;
  const aqueousH = 100;
  const hasDcm = funnel === 'solvent' || funnel === 'settled';
  const mixed = funnel === 'shaken';
  const canPourDistillate = funnel === 'empty' && lab.distillateMl > 0;
  const canAddSolvent = funnel === 'loaded' && lab.extractions < EXTRACTIONS_NEEDED && !busy;
  const collected = lab.organicMl + (draining ? EXTRACT_ML * p : 0);
  const showDrop = funnel !== 'empty' && drag;

  return (
    <g>
      <BenchSurface />
      {showDrop && (canPourDistillate || canAddSolvent) && <DropGuide x={FUNNEL_TOP.x} y={FUNNEL_TOP.y + 20} r={90} active />}

      <g>
        {shaking && (
          <animateTransform attributeName="transform" type="rotate" values="0 450 200;-8 450 200;8 450 200;0 450 200" dur="0.35s" repeatCount="indefinite" />
        )}
        <clipPath id="funnel-clip">
          <path d={FUNNEL_BODY} />
        </clipPath>
        <path d={FUNNEL_BODY} fill={GLASS_FILL} />
        {funnel !== 'empty' && (
          <g clipPath="url(#funnel-clip)">
            {!mixed && !hasDcm && <rect x={330} y={bottom - aqueousH} width={240} height={aqueousH} fill={WATER} />}
            {hasDcm && (
              <g>
                <rect x={330} y={bottom - dcmH - aqueousH} width={240} height={aqueousH} fill={WATER} />
                <rect x={330} y={bottom - dcmH} width={240} height={dcmH} fill={SOLVENT} />
              </g>
            )}
            {mixed && (
              <g>
                <rect x={330} y={bottom - aqueousH - 36} width={240} height={aqueousH + 36} fill="rgb(180 190 255 / 0.5)" />
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <circle key={i} cx={410 + i * 16} cy={200 + (i % 3) * 25} r={3} fill="white" fillOpacity={0.8} />
                ))}
              </g>
            )}
          </g>
        )}
        <path d={FUNNEL_BODY} fill="none" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        <rect x={438} y={84} width={24} height={36} fill={GLASS_FILL} stroke={INK} strokeWidth={3} />
        <rect x={440} y={68} width={20} height={16} rx={3} fill="#9a6b3f" />
        <rect x={447} y={309} width={6} height={26} fill={GLASS_FILL} stroke={INK} strokeWidth={2} />
      </g>

      <g
        role="button"
        tabIndex={funnel === 'settled' && !busy ? 0 : -1}
        aria-label={t.ui.drain}
        onClick={() => activate('stopcock')}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            activate('stopcock');
          }
        }}
        style={{ cursor: funnel === 'settled' && !busy ? 'pointer' : 'default' }}
        transform={`translate(450 303) rotate(${draining ? 90 : 0})`}
      >
        <rect x={-24} y={-7} width={48} height={14} rx={7} fill={funnel === 'settled' && !busy ? 'rgb(var(--color-accent))' : SURFACE} stroke={INK} strokeWidth={2} />
      </g>
      {draining && <line x1={450} y1={335} x2={450} y2={420 - collected * 2} stroke={SOLVENT} strokeWidth={3} />}

      <ErlenmeyerFlask cx={450} baseY={420} id="extract-receiver" level={Math.min(0.6, (collected / 30) * 0.5)} />
      <SvgLabel x={450} y={448} anchor="middle">{t.ui.erlenmeyer}</SvgLabel>

      {canPourDistillate ? (
        <Draggable id="beaker" home={{ x: 170, y: 420 }} drag={drag} start={start} label={t.ui.distillate} onActivate={() => activate('beaker')}>
          <BeakerGlass cx={0} baseY={0} w={90} h={80} level={Math.min(0.9, lab.distillateMl / 40)} />
        </Draggable>
      ) : (
        <g transform="translate(170 420)">
          <BeakerGlass cx={0} baseY={0} w={90} h={80} level={0} />
        </g>
      )}
      <SvgLabel x={170} y={448} anchor="middle">{t.ui.distillate}</SvgLabel>

      <Draggable id="dcm" home={{ x: 790, y: 420 }} drag={drag} start={start} enabled={canAddSolvent}       label={t.ui.dcm} onActivate={() => activate('dcm')}>
        <Bottle label="DCM" color="rgb(94 92 230)" />
      </Draggable>
            <SvgLabel x={790} y={448} anchor="middle">{t.ui.dcm}</SvgLabel>
    </g>
  );
}

export function DryScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  const free = lab.scoops >= SCOOPS_NEEDED;
  const canAdd = lab.extractions >= EXTRACTIONS_NEEDED && !lab.stood && !lab.busy;
  const clumps = Math.min(lab.scoops, SCOOPS_NEEDED - 1);
  return (
    <g>
      <BenchSurface />
      {drag && canAdd && <DropGuide x={DRY_FLASK.x} y={DRY_FLASK.y - 20} r={100} active />}
      <g transform={`translate(${DRY_FLASK.x} 428) scale(1.7)`}>
        <g key={lab.stirred}>
          {lab.stirred > 0 && (
            <animateTransform attributeName="transform" type="rotate" values="0 0 0;5 0 0;-5 0 0;0 0 0" dur="0.7s" repeatCount="1" />
          )}
          <ErlenmeyerFlask cx={0} baseY={0} id="dry-flask" level={0.48} liquid={free ? SOLVENT : 'rgb(120 140 255 / 0.35)'}>
            {!free &&
              Array.from({ length: clumps }, (_, i) => (
                <ellipse key={i} cx={-24 + i * 24} cy={-5} rx={14} ry={5} fill="white" fillOpacity={0.85} />
              ))}
            {free &&
              Array.from({ length: 22 }, (_, i) => (
                <circle key={i} cx={-38 + (i % 11) * 7.6} cy={-3 - Math.floor(i / 11) * 5} r={1.8} fill="white" fillOpacity={0.9}>
                  {lab.busy === 'stand' ? null : <animate attributeName="cy" values={`${-3 - Math.floor(i / 11) * 5};${-8 - (i % 4) * 6};${-3 - Math.floor(i / 11) * 5}`} dur={`${1.6 + (i % 5) * 0.2}s`} repeatCount="indefinite" />}
                </circle>
              ))}
          </ErlenmeyerFlask>
        </g>
      </g>
      <SvgLabel x={DRY_FLASK.x} y={448} anchor="middle">
        {lab.scoops === 0 ? '' : free ? t.ui.freeFlowing : t.ui.clumped}
      </SvgLabel>
      <Draggable id="sulfate" home={{ x: 780, y: 420 }} drag={drag} start={start} enabled={canAdd}       label={t.ui.sulfate} onActivate={() => activate('sulfate')}>
        <Bottle label="Na₂SO₄" color="rgb(200 200 200)" />
      </Draggable>
            <SvgLabel x={780} y={448} anchor="middle">{t.ui.sulfate}</SvgLabel>
    </g>
  );
}

export function DecantScene({ lab, drag, start, activate }: SceneProps) {
  const t = useSteamStrings();
  const canPlace = lab.stood && !lab.flaskOnBalance;
  const canDecant = lab.emptyFlaskG !== null && !lab.decanted;
  return (
    <g>
      <BenchSurface />
      <Balance cx={700} baseY={420} reading={balanceReading(lab).toFixed(2)}>
        {lab.flaskOnBalance && (
          <g transform="translate(0 -40) scale(0.8)">
            <RoundFlask cx={0} cy={0} id="decant-flask" level={lab.decanted ? 0.55 : 0} liquid={SOLVENT} />
          </g>
        )}
      </Balance>
      {drag && canPlace && <DropGuide x={700} y={330} r={80} active />}
      {drag && canDecant && <DropGuide x={700} y={310} r={90} active />}

      {!lab.flaskOnBalance && (
        <Draggable id="rbf" home={{ x: 540, y: 380 }} scale={0.8} drag={drag} start={start} enabled={canPlace} label={t.parts.flask} onActivate={() => activate('rbf')}>
          <RoundFlask cx={0} cy={0} id="rbf-shelf" />
        </Draggable>
      )}

      <Draggable id="extract" home={{ x: 200, y: 420 }} drag={drag} start={start} enabled={canDecant} label="Dried extract" onActivate={() => activate('extract')}>
        <ErlenmeyerFlask cx={0} baseY={0} id="decant-source" level={lab.decanted ? 0 : 0.5} />
      </Draggable>
      <SvgLabel x={200} y={448} anchor="middle">{t.ui.erlenmeyer}</SvgLabel>
      <SvgLabel x={700} y={448} anchor="middle">{t.ui.balance}</SvgLabel>
    </g>
  );
}

export function OilScene({ lab }: SceneProps) {
  const t = useSteamStrings();
  const warming = lab.busy === 'steam';
  const wet = !lab.outsideDried;
  const reading = lab.mass2 ?? lab.mass1 ?? balanceReading(lab);
  const flask = (id: string) => (
    <RoundFlask cx={0} cy={0} id={id} level={0.04} liquid="rgb(234 179 8 / 0.5)">
      {wet && [-30, -10, 14, 32].map((dx, i) => <circle key={dx} cx={dx} cy={-20 + i * 14} r={2.5} fill={WATER} />)}
    </RoundFlask>
  );
  return (
    <g>
      <BenchSurface />
      <Balance cx={700} baseY={420} reading={(warming ? 0 : reading).toFixed(2)}>
        {!warming && (
          <g transform="translate(0 -40) scale(0.8)">
            {flask('oil-flask-balance')}
          </g>
        )}
      </Balance>
      <g pointerEvents="none">
        <path d="M110 350 H290 Q290 420 200 420 Q110 420 110 350 Z" fill={WATER} stroke={INK} strokeWidth={2.5} />
        {warming && (
          <g>
            <g transform="translate(200 330) scale(0.8)">{flask('oil-flask-bath')}</g>
            {[150, 200, 250].map((x, i) => (
              <path key={x} d={`M${x} 345 q-6 -14 0 -26 q6 -12 0 -24`} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={2}>
                <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur={`${1.6 + i * 0.3}s`} repeatCount="indefinite" />
              </path>
            ))}
          </g>
        )}
      </g>
      <SvgLabel x={200} y={448} anchor="middle">{t.ui.steambath}</SvgLabel>
    </g>
  );
}
