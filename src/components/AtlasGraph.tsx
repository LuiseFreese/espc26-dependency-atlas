import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Asset, Dependency } from "../types";
import type { ImpactResult } from "../graph/impact";
import { impactStateFor } from "../graph/impact";
import type { Positions } from "../graph/layout";
import { NODE_HEIGHT, NODE_WIDTH } from "../graph/layout";
import { AssetNode, type AssetFlowNode } from "./AssetNode";

const nodeTypes: NodeTypes = { asset: AssetNode };
// Controlled nodes must carry `measured` for fitView/minimap; until React Flow reports real sizes
// (or if it never does after a remount) the layout size is a good approximation.
const DEFAULT_NODE_SIZE = { width: NODE_WIDTH, height: NODE_HEIGHT };

export interface AtlasGraphProps {
  assets: Asset[];
  dependencies: Dependency[];
  positions: Positions;
  onNodeMoved: (id: string, position: { x: number; y: number }) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  impact: ImpactResult | null;
  searchHits: Set<string>;
  /** Changing this value (e.g. `${id}:${Date.now()}`) centres the viewport on the node. */
  focusRequest: { id: string; nonce: number } | null;
  fitRequest: number;
}

const EDGE_IDLE = "#4a4a5e";
const EDGE_PATH = "#e0338f";
// Keeps the graph clear of the floating toolbar (top) and legend (bottom-left) when fitting.
const FIT_PADDING = { top: "90px", right: "24px", bottom: "110px", left: "24px" } as const;

function AtlasGraphInner(props: AtlasGraphProps) {
  const { assets, dependencies, positions, onNodeMoved, selectedId, onSelect, impact, searchHits, focusRequest, fitRequest } = props;
  const { fitView, setCenter, getNode } = useReactFlow();
  // React Flow reports measured node sizes through onNodesChange; they must be fed back into the
  // (controlled) nodes, otherwise fitView/minimap have no dimensions to work with.
  const [measured, setMeasured] = useState<Map<string, { width: number; height: number }>>(new Map());

  const nodes = useMemo<AssetFlowNode[]>(
    () =>
      assets.map((asset) => ({
        id: asset.id,
        type: "asset",
        position: positions.get(asset.id) ?? { x: 0, y: 0 },
        selected: asset.id === selectedId,
        measured: measured.get(asset.id) ?? DEFAULT_NODE_SIZE,
        data: { asset, impact: impactStateFor(asset.id, impact), isSearchHit: searchHits.has(asset.id) },
      })),
    [assets, positions, selectedId, impact, searchHits, measured],
  );

  const edges = useMemo<Edge[]>(
    () =>
      dependencies.map((dep) => {
        const onPath = impact?.pathEdgeIds.has(dep.id) ?? false;
        const dimmed = impact !== null && !onPath;
        const color = onPath ? EDGE_PATH : EDGE_IDLE;
        return {
          id: dep.id,
          source: dep.dependentId,
          target: dep.requiredId,
          type: "default",
          animated: onPath,
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
          style: {
            stroke: color,
            strokeWidth: onPath ? 3 : 2,
            strokeOpacity: dimmed ? 0.08 : 1,
          },
          zIndex: onPath ? 1 : 0,
          ariaLabel: dep.name,
        };
      }),
    [dependencies, impact],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<AssetFlowNode>[]) => {
      // Nodes are derived from state: drags flow back as positions, measurements as sizes; selection is click-driven.
      const sizes: Array<[string, { width: number; height: number }]> = [];
      for (const change of changes) {
        if (change.type === "position" && change.position) onNodeMoved(change.id, change.position);
        if (change.type === "dimensions" && change.dimensions) sizes.push([change.id, change.dimensions]);
      }
      if (sizes.length) {
        setMeasured((prev) => {
          let next: Map<string, { width: number; height: number }> | null = null;
          for (const [id, size] of sizes) {
            const cur = prev.get(id);
            if (cur && cur.width === size.width && cur.height === size.height) continue;
            next ??= new Map(prev);
            next.set(id, size);
          }
          return next ?? prev;
        });
      }
    },
    [onNodeMoved],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<AssetFlowNode>>((_, node) => onSelect(node.id), [onSelect]);
  const handlePaneClick = useCallback(() => onSelect(null), [onSelect]);

  useEffect(() => {
    if (!focusRequest) return;
    const node = getNode(focusRequest.id);
    if (!node) return;
    const w = node.measured?.width ?? 260;
    const h = node.measured?.height ?? 118;
    void setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: 1, duration: 500 });
  }, [focusRequest, getNode, setCenter]);

  useEffect(() => {
    if (fitRequest === 0) return;
    void fitView({ padding: FIT_PADDING, duration: 500 });
  }, [fitRequest, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={handleNodesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: FIT_PADDING }}
      minZoom={0.15}
      maxZoom={2}
      nodesConnectable={false}
      elementsSelectable
      selectNodesOnDrag={false}
      panOnScroll
      zoomOnPinch
      proOptions={{ hideAttribution: false }}
      colorMode="dark"
      defaultEdgeOptions={{ type: "default" }}
    >
      <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#26263a" />
      <Controls position="bottom-right" showInteractive={false} />
      <MiniMap
        position="top-right"
        pannable
        zoomable
        nodeColor={(n) => {
          const state = (n.data as AssetFlowNode["data"]).impact;
          if (state === "unavailable") return "#e0338f";
          if (state === "direct") return "#ff8c42";
          if (state === "indirect") return "#ffd166";
          if (state === "unaffected") return "#2a2a36";
          return "#4a4a5e";
        }}
        maskColor="rgba(11, 11, 16, 0.75)"
        style={{ marginTop: 80 }}
      />
    </ReactFlow>
  );
}

export function AtlasGraph(props: AtlasGraphProps) {
  return (
    <ReactFlowProvider>
      <AtlasGraphInner {...props} />
    </ReactFlowProvider>
  );
}
