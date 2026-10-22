import { useCallback, useRef, useState, type PointerEvent } from 'react';
import type { DragState, Point } from '../components/steam/Glassware';

interface Options {
  onDrop: (id: string, pt: Point) => void;
  onMove?: (id: string, pt: Point, prev: Point) => void;
}

export function useSvgDrag({ onDrop, onMove }: Options) {
  const svgRef = useRef<SVGSVGElement>(null);
  const last = useRef<Point>({ x: 0, y: 0 });
  const [drag, setDrag] = useState<DragState | null>(null);

  const toSvg = useCallback((e: { clientX: number; clientY: number }): Point => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x, y: p.y };
  }, []);

  const start = useCallback(
    (id: string) => (e: PointerEvent<SVGElement>) => {
      e.preventDefault();
      svgRef.current?.setPointerCapture(e.pointerId);
      const p = toSvg(e);
      last.current = p;
      setDrag({ id, ...p });
    },
    [toSvg]
  );

  const move = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!drag) return;
      const p = toSvg(e);
      onMove?.(drag.id, p, last.current);
      last.current = p;
      setDrag({ id: drag.id, ...p });
    },
    [drag, toSvg, onMove]
  );

  const end = useCallback(
    (e: PointerEvent<SVGSVGElement>) => {
      if (!drag) return;
      const p = toSvg(e);
      setDrag(null);
      onDrop(drag.id, p);
    },
    [drag, toSvg, onDrop]
  );

  const cancel = useCallback(() => setDrag(null), []);

  return { svgRef, drag, start, move, end, cancel };
}
