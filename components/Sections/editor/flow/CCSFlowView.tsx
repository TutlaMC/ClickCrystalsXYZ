'use client';
import { useReactFlow } from 'reactflow';
import { addEdge, Connection } from 'reactflow';

import { useEffect, useState } from 'react';
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
import { getNodeDef, NODE_REGISTRY } from '@/lib/ccs-nodes/registry';
import { CATEGORY_COLORS } from '@/lib/ccs-nodes/types';


const nodeTypes = {
  module: ModuleNode,
  command: CommandNode,
};

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

const MODULE_X_GAP = 500;
const NODE_X_INDENT = 290;
const NODE_Y_GAP = 115;
const MODULE_Y = 60;

let _id = 0;
const uid = () => `n${_id++}`;

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
      data: { ...def, args: stmt.args },
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

function CCSFlowView({ code }: { code: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [availableNodes] = useState(NODE_REGISTRY); // Use NODE_REGISTRY for available nodes

  useEffect(() => {
    const mods = parseCCS(code);
    const { nodes: n, edges: e } = buildGraph(mods);
    setNodes(n);
    setEdges(e);
  }, [code]);

  // Handle adding a new node from the sidebar
  const onNodeDragStart = (event: React.DragEvent, node: any) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify(node)
    );
    event.dataTransfer.effectAllowed = "move";
  };
  const { project } = useReactFlow();
  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();

    const nodeData = JSON.parse(
      event.dataTransfer.getData("application/reactflow")
    );

    const position = project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    const newNode: Node = {
      id: uid(),
      type: 'command',
      position,
      data: nodeData,
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onConnect = (connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds
      )
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div
        style={{ width: '200px', background: '#1f1f1f', padding: '10px', color: '#fff' }}
      >
        <h2>Available Nodes</h2>
        <div>
          {availableNodes.map((node) => (
            <div
              key={node.command}
              draggable
              onDragStart={(e) => onNodeDragStart(e, node)}
              style={{
                padding: '8px',
                margin: '4px',
                background: '#333',
                cursor: 'grab',
                borderRadius: '4px',
              }}
            >
              {node.label}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{ flex: 1 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
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
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.25 }}
              attributionPosition="bottom-left"
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
    </div>
  );
}

export default CCSFlowView;
