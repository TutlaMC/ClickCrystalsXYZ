'use client';

import { useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CommandNode } from '@/lib/ccs-nodes/CommandNode';
import { ModuleNode } from '@/lib/ccs-nodes/ModuleNode';
import { getNodeDef } from '@/lib/ccs-nodes/registry';
import { CATEGORY_COLORS } from '@/lib/ccs-nodes/types';

// ─── ReactFlow node type map ──────────────────────────────────────────────────

const nodeTypes = {
  module: ModuleNode,
  command: CommandNode,
};

// ─── Parser ───────────────────────────────────────────────────────────────────

interface ParsedStatement {
  command: string;
  args: string;
  children: ParsedStatement[];
}

interface ParsedModule {
  name: string;
  desc: string;
  author: string;
  statements: ParsedStatement[];
}

function resolveCommand(token: string, restStr: string): string {
  if (token === 'on') {
    const evt = restStr.trim().split(/\s+/)[0];
    return `on:${evt}`;
  }
  if (token === 'module') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (['enable', 'disable', 'create'].includes(sub)) return `module ${sub}`;
    return '__def_module';
  }
  if (token === 'config') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (['save', 'load', 'reload'].includes(sub)) return `config ${sub}`;
  }
  if (token === 'def') {
    const sub = restStr.trim().split(/\s+/)[0];
    if (sub === 'module') return '__def_module';
    if (sub === 'desc') return 'desc';
    if (sub === 'func') return 'def func';
    return '__def_module';
  }
  const aliases: Record<string, string> = {
    func: 'function',
    '!if': 'if_not',
    '!while': 'while_not',
    desc: 'desc',
  };
  return aliases[token] ?? token;
}

function parseCCS(code: string): ParsedModule[] {
  const modules: ParsedModule[] = [];
  const lines = code.split('\n');

  let author = '@anonymous';
  const authorLine = lines.find(l => l.trim().startsWith('//'));
  if (authorLine) {
    const m = authorLine.match(/\/\/\s*(@\S+)/);
    if (m) author = m[1];
  }

  let current: ParsedModule | null = null;
  // stack[top] = the array we're currently appending statements into
  let stack: ParsedStatement[][] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;

    const openings = (line.match(/\{/g) ?? []).length;
    const closings = (line.match(/\}/g) ?? []).length;

    const stripped = line.replace(/[{}]/g, '').trim();

    // pure closing brace line
    if (!stripped) {
      for (let i = 0; i < closings && stack.length > 1; i++) stack.pop();
      continue;
    }

    const [token, ...rest] = stripped.split(/\s+/);
    const restStr = rest.join(' ');
    const cmd = resolveCommand(token, restStr);

    if (cmd === '__def_module') {
      const modName = restStr.replace(/^module\s+/, '').trim();
      if (current) modules.push(current);
      current = { name: modName, desc: '', author, statements: [] };
      stack = [current.statements];
      continue;
    }

    if (!current) continue;

    // desc at top level sets module description
    if (cmd === 'desc' && stack.length <= 1) {
      const m = stripped.match(/^(?:def\s+)?desc\s+"(.+)"/);
      if (m) { current.desc = m[1]; continue; }
    }

    const stmt: ParsedStatement = { command: cmd, args: restStr, children: [] };
    const target = stack[stack.length - 1];
    target.push(stmt);

    if (openings > closings) {
      stack.push(stmt.children);
    } else if (closings > openings) {
      for (let i = 0; i < (closings - openings) && stack.length > 1; i++) {
        stack.pop();
      }
    }
  }

  if (current) modules.push(current);
  return modules;
}

// ─── Graph builder ────────────────────────────────────────────────────────────

const MODULE_X_GAP  = 500;
const NODE_X_INDENT = 290;
const NODE_Y_GAP    = 115;
const MODULE_Y      = 60;

let _id = 0;
const uid = () => `n${_id++}`;

function statementsToGraph(
  stmts: ParsedStatement[],
  baseX: number,
  startY: number,
  parentId: string,
  parentHandle: string,
  nodes: Node[],
  edges: Edge[],
): number {
  let y = startY;
  for (const stmt of stmts) {
    const def = getNodeDef(stmt.command);
    const nodeId = uid();
    const color = CATEGORY_COLORS[def.category];

    nodes.push({
      id: nodeId,
      type: 'command',
      position: { x: baseX, y },
      data: { ...def, args: stmt.args, category: def.category },
    });

    edges.push({
      id: `e-${parentId}-${nodeId}`,
      source: parentId,
      sourceHandle: parentHandle,
      target: nodeId,
      targetHandle: def.inputs[0]?.id,
      style: { stroke: color, strokeWidth: 1.5, opacity: 0.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 10, height: 10 },
    });

    y += NODE_Y_GAP;

    if (stmt.children.length) {
      const childOutHandle = def.outputs[0]?.id ?? 'out';
      y = statementsToGraph(
        stmt.children,
        baseX + NODE_X_INDENT,
        y,
        nodeId,
        childOutHandle,
        nodes,
        edges,
      );
    }
  }
  return y;
}

function buildGraph(modules: ParsedModule[]): { nodes: Node[]; edges: Edge[] } {
  _id = 0;
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  modules.forEach((mod, mi) => {
    const moduleId = uid();
    nodes.push({
      id: moduleId,
      type: 'module',
      position: { x: mi * MODULE_X_GAP, y: MODULE_Y },
      data: { name: mod.name, desc: mod.desc, author: mod.author },
    });

    statementsToGraph(
      mod.statements,
      mi * MODULE_X_GAP + NODE_X_INDENT,
      MODULE_Y,
      moduleId,
      'events',
      nodes,
      edges,
    );
  });

  return { nodes, edges };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CCSFlowView({ code }: { code: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const mods = parseCCS(code);
    const { nodes: n, edges: e } = buildGraph(mods);
    setNodes(n);
    setEdges(e);
  }, [code]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0a0a14' }}>
      {nodes.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#333',
            fontFamily: 'monospace',
            fontSize: 13,
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 28 }}>◈</span>
          <span>No modules found</span>
          <span style={{ fontSize: 11, color: '#222' }}>
            Start with `def module my-module`
          </span>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          attributionPosition="bottom-left"
          deleteKeyCode={null}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1a1a2a" />
          <Controls
            style={{
              background: '#1a1a2e',
              border: '1px solid #ac892944',
              borderRadius: 6,
            }}
          />
          <MiniMap
            style={{ background: '#0f0f1a', border: '1px solid #333' }}
            nodeColor={(n) => {
              const cat = (n.data as any)?.category;
              return CATEGORY_COLORS[cat] ?? '#555';
            }}
          />
        </ReactFlow>
      )}
    </div>
  );
}