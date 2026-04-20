'use client';

import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CATEGORY_COLORS, CATEGORY_LABELS } from './types';
import type { NodeDefinition } from './types';

interface CommandNodeData extends NodeDefinition {
  args: string; // raw argument string parsed from code
}

export const CommandNode = memo(({ data }: { data: CommandNodeData }) => {
  const color = CATEGORY_COLORS[data.category];
  const catLabel = CATEGORY_LABELS[data.category];

  return (
    <div
      style={{
        background: '#111120',
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 6,
        minWidth: 180,
        maxWidth: 260,
        fontFamily: 'monospace',
        fontSize: 11,
        boxShadow: `0 2px 12px ${color}18`,
        position: 'relative',
      }}
    >
      {/* Input handles */}
      {data.inputs.map((port, i) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          style={{
            top: data.inputs.length === 1 ? '50%' : `${20 + i * 20}%`,
            background: color,
            border: `2px solid #0a0a14`,
            width: 10,
            height: 10,
          }}
          title={port.label}
        />
      ))}

      {/* Header */}
      <div
        style={{
          padding: '6px 10px 4px',
          borderBottom: `1px solid ${color}22`,
        }}
      >
        <div
          style={{
            color,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            marginBottom: 2,
            opacity: 0.8,
          }}
        >
          {catLabel}
        </div>
        <div
          style={{
            color: '#f0e6c8',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Body: args + hints */}
      <div style={{ padding: '5px 10px 7px' }}>
        {data.args && (
          <div
            style={{
              color: '#9bd',
              fontSize: 11,
              marginBottom: 3,
              wordBreak: 'break-word',
            }}
          >
            {data.args}
          </div>
        )}
        {data.argHints.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {data.argHints.map((hint, i) => (
              <span
                key={i}
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}33`,
                  color: `${color}cc`,
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 3,
                }}
              >
                {hint}
              </span>
            ))}
          </div>
        )}
        {data.description && !data.args && data.argHints.length === 0 && (
          <div style={{ color: '#555', fontSize: 10, fontStyle: 'italic' }}>
            {data.description}
          </div>
        )}
      </div>

      {/* Output handles */}
      {data.outputs.map((port, i) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          style={{
            top: data.outputs.length === 1
              ? '50%'
              : `${15 + i * (70 / Math.max(data.outputs.length - 1, 1))}%`,
            background: color,
            border: `2px solid #0a0a14`,
            width: 10,
            height: 10,
          }}
          title={port.label}
        />
      ))}

      {/* Output port labels */}
      {data.outputs.length > 1 && (
        <div
          style={{
            position: 'absolute',
            right: 14,
            top: 0,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-around',
            pointerEvents: 'none',
          }}
        >
          {data.outputs.map((port) => (
            <span
              key={port.id}
              style={{
                color: `${color}99`,
                fontSize: 8,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {port.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

CommandNode.displayName = 'CommandNode';