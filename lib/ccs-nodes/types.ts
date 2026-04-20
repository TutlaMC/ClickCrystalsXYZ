// ─── Category colors ──────────────────────────────────────────────────────────

export type Category =
  | 'module'     // def module, def desc
  | 'event'      // on <event>
  | 'syntax'     // if, while, loop, execute, wait, function
  | 'client'     // module enable/disable, config, send, notify, playsound
  | 'macro'      // drop, teleport, input, switch, damage, turn_to, etc.
  | 'packet'     // cancel_packet, uncancel_packet
  | 'unknown';

export const CATEGORY_COLORS: Record<Category, string> = {
  module:  '#ac8929', // gold
  event:   '#5b8dd9', // blue
  syntax:  '#9d6fd4', // purple
  client:  '#4caf7d', // green
  macro:   '#d45b5b', // red
  packet:  '#d4a45b', // orange
  unknown: '#555566', // grey
};

export const CATEGORY_LABELS: Record<Category, string> = {
  module:  'MODULE',
  event:   'EVENT',
  syntax:  'FLOW',
  client:  'CLIENT',
  macro:   'MACRO',
  packet:  'PACKET',
  unknown: 'UNKNOWN',
};

// ─── Port definitions ─────────────────────────────────────────────────────────

export interface PortDef {
  id: string;
  label: string;
}

// ─── Node definition ──────────────────────────────────────────────────────────

export interface NodeDefinition {
  /** Primary command keyword, e.g. "on", "if", "loop" */
  command: string;
  /** Human readable label shown in node header */
  label: string;
  /** Short description shown in node body */
  description: string;
  category: Category;
  /** Argument hint shown as sub-labels, e.g. ["<event>", "[condition]"] */
  argHints: string[];
  /** Incoming connection handles */
  inputs: PortDef[];
  /** Outgoing connection handles */
  outputs: PortDef[];
}