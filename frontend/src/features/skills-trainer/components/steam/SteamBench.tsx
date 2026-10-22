import { useCallback } from 'react';
import type { SteamLab } from '../../hooks/useSteamDistillationLab';
import { useSvgDrag } from '../../hooks/useSvgDrag';
import { useSteamStrings } from '../../hooks/useSteamStrings';
import type { Point } from './Glassware';
import {
  ApparatusScene,
  BALANCE_PAN,
  CHARGE_FLASK,
  ChargeScene,
  GRIND_BOWL,
  GrindScene,
  SLOT,
  WeighScene,
  type SceneProps,
} from './SteamScenes';
import { DECANT_FLASK, DRY_FLASK, DecantScene, DryScene, ExtractScene, FUNNEL_TOP, OilScene } from './SteamScenesWeekTwo';
import type { PartId, SampleId } from '../../hooks/useSteamDistillationLab';

const near = (a: Point, b: Point, r: number) => Math.hypot(a.x - b.x, a.y - b.y) < r;

export function SteamBench({ lab }: { lab: SteamLab }) {
  const t = useSteamStrings();
  const { grindStroke, chooseSample, transferSample, placePart, loadFunnel, addSolvent, addDrying, placeFlaskOnBalance, decant, drain } = lab;

  const perform = useCallback(
    (id: string) => {
      if (id.startsWith('jar:')) chooseSample(id.slice(4) as SampleId);
      else if (id.startsWith('part:')) placePart(id.slice(5) as PartId);
      else if (id === 'pestle') grindStroke(400);
      else if (id === 'mortar') transferSample();
      else if (id === 'beaker') loadFunnel();
      else if (id === 'dcm') addSolvent();
      else if (id === 'sulfate') addDrying();
      else if (id === 'rbf') placeFlaskOnBalance();
      else if (id === 'extract') decant();
      else if (id === 'stopcock') drain();
    },
    [chooseSample, placePart, grindStroke, transferSample, loadFunnel, addSolvent, addDrying, placeFlaskOnBalance, decant, drain]
  );

  const onDrop = useCallback(
    (id: string, pt: Point) => {
      if (id.startsWith('jar:') && near(pt, { x: BALANCE_PAN.x, y: BALANCE_PAN.y - 10 }, 90)) perform(id);
      else if (id.startsWith('part:')) {
        const part = id.slice(5) as PartId;
        if (near(pt, SLOT[part], part === 'condenser' ? 110 : 80)) perform(id);
      } else if (id === 'mortar' && near(pt, CHARGE_FLASK, 100)) perform(id);
      else if ((id === 'beaker' || id === 'dcm') && near(pt, { x: FUNNEL_TOP.x, y: FUNNEL_TOP.y + 20 }, 110)) perform(id);
      else if (id === 'sulfate' && near(pt, { x: DRY_FLASK.x, y: DRY_FLASK.y - 20 }, 110)) perform(id);
      else if (id === 'rbf' && near(pt, { x: 700, y: 320 }, 100)) perform(id);
      else if (id === 'extract' && near(pt, { x: DECANT_FLASK.x, y: 310 }, 120)) perform(id);
    },
    [perform]
  );

  const onMove = useCallback(
    (id: string, pt: Point, prev: Point) => {
      if (id === 'pestle' && near(pt, GRIND_BOWL, 90)) grindStroke(Math.hypot(pt.x - prev.x, pt.y - prev.y));
    },
    [grindStroke]
  );

  const { svgRef, drag, start, move, end, cancel } = useSvgDrag({ onDrop, onMove });
  const props: SceneProps = { lab, drag, start, activate: perform };

  const scene = () => {
    switch (lab.step) {
      case 0:
        return <WeighScene {...props} />;
      case 1:
        return <GrindScene {...props} />;
      case 2:
        return <ChargeScene {...props} />;
      case 6:
        return lab.week === 2 ? <ExtractScene {...props} /> : <ApparatusScene {...props} mode="distil" />;
      case 7:
        return <DryScene {...props} />;
      case 8:
        return <DecantScene {...props} />;
      case 9:
        return <ApparatusScene {...props} mode="solvent" />;
      case 10:
      case 11:
        return <OilScene {...props} />;
      default:
        return <ApparatusScene {...props} mode="distil" />;
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 900 460"
      aria-label={t.benchTitle}
      className="block h-auto w-full select-none"
      style={{ touchAction: 'none' }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={cancel}
    >
      {scene()}
    </svg>
  );
}
