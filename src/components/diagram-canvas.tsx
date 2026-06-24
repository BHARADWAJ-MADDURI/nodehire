"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { ArrowUpRight, Box, Eraser, Pencil, Type, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Point = { x: number; y: number };
type Element =
  | { kind: "box"; x: number; y: number; width: number; height: number; label: string }
  | { kind: "arrow"; from: Point; to: Point }
  | { kind: "path"; points: Point[] }
  | { kind: "text"; x: number; y: number; label: string };
type Tool = "box" | "arrow" | "draw" | "text";

export type DiagramCanvasRef = { exportPng: () => Promise<string | null> };

export const DiagramCanvas = forwardRef<DiagramCanvasRef>(function DiagramCanvas(_, ref) {
  const [elements, setElements] = useState<Element[]>([]);
  const [tool, setTool] = useState<Tool>("box");
  const [label, setLabel] = useState("Service");
  const start = useRef<Point | null>(null);
  const drawing = useRef<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  function point(event: React.PointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * 900, y: ((event.clientY - rect.top) / rect.height) * 520 };
  }
  function down(event: React.PointerEvent<SVGSVGElement>) {
    const current = point(event); start.current = current;
    if (tool === "text") { setElements((items) => [...items, { kind: "text", ...current, label }]); start.current = null; }
    if (tool === "draw") drawing.current = [current];
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (tool === "draw" && start.current) drawing.current.push(point(event));
  }
  function up(event: React.PointerEvent<SVGSVGElement>) {
    if (!start.current) return;
    const end = point(event);
    if (tool === "box") setElements((items) => [...items, { kind: "box", x: Math.min(start.current!.x, end.x), y: Math.min(start.current!.y, end.y), width: Math.max(70, Math.abs(end.x - start.current!.x)), height: Math.max(45, Math.abs(end.y - start.current!.y)), label }]);
    if (tool === "arrow") setElements((items) => [...items, { kind: "arrow", from: start.current!, to: end }]);
    if (tool === "draw" && drawing.current.length > 1) setElements((items) => [...items, { kind: "path", points: drawing.current }]);
    start.current = null; drawing.current = [];
  }
  useImperativeHandle(ref, () => ({ exportPng: async () => {
    if (!elements.length || !svgRef.current) return null;
    const svg = new XMLSerializer().serializeToString(svgRef.current);
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = reject; image.src = url; });
      const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 694;
      const context = canvas.getContext("2d"); if (!context) return null;
      context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png", 0.86);
    } finally { URL.revokeObjectURL(url); }
  } }), [elements]);
  return <div className="space-y-3"><div className="flex flex-wrap items-center gap-2">{([['box', Box, 'Box'], ['arrow', ArrowUpRight, 'Arrow'], ['draw', Pencil, 'Draw'], ['text', Type, 'Text']] as const).map(([value, Icon, name]) => <Button key={value} type="button" size="sm" variant={tool === value ? "default" : "outline"} onClick={() => setTool(value)}><Icon />{name}</Button>)}<Input value={label} onChange={(event) => setLabel(event.target.value)} aria-label="Shape label" className="h-9 w-36" /><Button type="button" size="icon-sm" variant="ghost" aria-label="Undo" onClick={() => setElements((items) => items.slice(0, -1))}><Undo2 /></Button><Button type="button" size="icon-sm" variant="ghost" aria-label="Clear diagram" onClick={() => setElements([])}><Eraser /></Button></div><svg ref={svgRef} viewBox="0 0 900 520" onPointerDown={down} onPointerMove={move} onPointerUp={up} className="aspect-[900/520] w-full touch-none rounded-xl border bg-white text-slate-900 shadow-inner"><defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#334155" /></marker></defs>{elements.map((element, index) => element.kind === "box" ? <g key={index}><rect x={element.x} y={element.y} width={element.width} height={element.height} rx="10" fill="#eff6ff" stroke="#4f46e5" strokeWidth="3"/><text x={element.x + element.width / 2} y={element.y + element.height / 2} dominantBaseline="middle" textAnchor="middle" fontSize="17" fill="#1e293b">{element.label}</text></g> : element.kind === "arrow" ? <line key={index} x1={element.from.x} y1={element.from.y} x2={element.to.x} y2={element.to.y} stroke="#334155" strokeWidth="3" markerEnd="url(#arrowhead)" /> : element.kind === "text" ? <text key={index} x={element.x} y={element.y} fontSize="18" fill="#1e293b">{element.label}</text> : <polyline key={index} points={element.points.map((item) => `${item.x},${item.y}`).join(" ")} fill="none" stroke="#334155" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />)}</svg><p className="text-xs text-muted-foreground">Drag to place boxes and arrows; click to add labels. The diagram stays in this browser until submission.</p></div>;
});
