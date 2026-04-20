import type { NodeDefinition } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const flow = (inputs: string[], outputs: string[]) => ({
  inputs:  inputs.map(id => ({ id, label: id })),
  outputs: outputs.map(id => ({ id, label: id })),
});

// ─── Registry ─────────────────────────────────────────────────────────────────

export const NODE_REGISTRY: NodeDefinition[] = [

  // ── Module / definition ─────────────────────────────────────────────────────
  {
    command: 'module',
    label: 'Module',
    description: 'Declares a custom CCS module',
    category: 'module',
    argHints: ['<module-id>'],
    ...flow([], ['events']),
  },
  {
    command: 'desc',
    label: 'Description',
    description: 'Sets the module description',
    category: 'module',
    argHints: ['"description text"'],
    ...flow(['in'], []),
  },
  {
    command: 'description',
    label: 'Description',
    description: 'Sets the module description (full form)',
    category: 'module',
    argHints: ['"description text"'],
    ...flow(['in'], []),
  },

  // ── Events ───────────────────────────────────────────────────────────────────
  ...[
    'right_click','left_click','middle_click',
    'right_release','left_release','middle_release',
    'place_block','break_block','punch_block','interact_block',
    'tick','pre_tick','post_tick',
    'item_use','item_consume','totem_pop',
    'module_enable','module_disable',
    'move_pos','move_look',
    'key_press','key_release',
    'damage','respawn','death',
    'game_join','game_leave',
    'chat_send','chat_receive',
  ].map((evt): NodeDefinition => ({
    command: `on:${evt}`,
    label: `on ${evt}`,
    description: `Event listener: ${evt}`,
    category: 'event',
    argHints: evt === 'key_press' || evt === 'key_release'
      ? ['**key', '..']
      : evt === 'chat_send' || evt === 'chat_receive'
      ? ['**message', '..']
      : ['..'],
    ...flow(['module'], ['body']),
  })),

  // ── Conditionals ─────────────────────────────────────────────────────────────
  {
    command: 'if',
    label: 'if',
    description: 'Evaluates a condition and runs next line/block if true',
    category: 'syntax',
    argHints: ['<condition>', '..'],
    ...flow(['in'], ['true', 'false']),
  },
  {
    command: 'if_not',
    label: 'if_not (!if)',
    description: 'Evaluates a condition and runs next line/block if false',
    category: 'syntax',
    argHints: ['<condition>', '..'],
    ...flow(['in'], ['true', 'false']),
  },

  // ── Loops ─────────────────────────────────────────────────────────────────────
  {
    command: 'while',
    label: 'while',
    description: 'Loops block until condition is false',
    category: 'syntax',
    argHints: ['N (seconds delay)', '<condition>', '..'],
    ...flow(['in'], ['loop', 'exit']),
  },
  {
    command: 'while_not',
    label: 'while_not (!while)',
    description: 'Loops block until condition is true',
    category: 'syntax',
    argHints: ['N (seconds delay)', '<condition>', '..'],
    ...flow(['in'], ['loop', 'exit']),
  },
  {
    command: 'loop',
    label: 'loop',
    description: 'Repeat a block N times',
    category: 'syntax',
    argHints: ['n (count)', '..'],
    ...flow(['in'], ['body', 'done']),
  },
  {
    command: 'loop_period',
    label: 'loop_period',
    description: 'Repeat a block N times with a delay between iterations',
    category: 'syntax',
    argHints: ['n (times)', 'N (period s)', '..'],
    ...flow(['in'], ['body', 'done']),
  },

  // ── Execution ─────────────────────────────────────────────────────────────────
  {
    command: 'execute',
    label: 'execute',
    description: 'Execute a script block or line',
    category: 'syntax',
    argHints: ['..'],
    ...flow(['in'], ['out']),
  },
  {
    command: 'execute_random',
    label: 'execute_random',
    description: 'Execute ONE random line from a block',
    category: 'syntax',
    argHints: ['{ line; line; ... }'],
    ...flow(['in'], ['out']),
  },
  {
    command: 'execute_period',
    label: 'execute_period',
    description: 'Execute block with N seconds delay between each line',
    category: 'syntax',
    argHints: ['N (seconds)', '..'],
    ...flow(['in'], ['out']),
  },

  // ── Wait ──────────────────────────────────────────────────────────────────────
  {
    command: 'wait',
    label: 'wait',
    description: 'Wait N seconds before executing block/line',
    category: 'syntax',
    argHints: ['N (seconds)', '..'],
    ...flow(['in'], ['out']),
  },
  {
    command: 'wait_random',
    label: 'wait_random',
    description: 'Wait a random duration between min and max seconds',
    category: 'syntax',
    argHints: ['N (min s)', 'N (max s)', '..'],
    ...flow(['in'], ['out']),
  },

  // ── Function ──────────────────────────────────────────────────────────────────
  {
    command: 'function',
    label: 'function (func)',
    description: 'Call a defined function by name',
    category: 'syntax',
    argHints: ['<function-name>'],
    ...flow(['in'], ['out']),
  },
  {
    command: 'def func',
    label: 'def func',
    description: 'Define a reusable function',
    category: 'syntax',
    argHints: ['<name>', '..'],
    ...flow([], ['body']),
  },

  // ── as (entity reference) ────────────────────────────────────────────────────
  {
    command: 'as',
    label: 'as',
    description: 'Set script reference entity to a target',
    category: 'syntax',
    argHints: ['<target>', '[**ID]'],
    ...flow(['in'], ['out']),
  },

  // ── Output / messaging ────────────────────────────────────────────────────────
  {
    command: 'send',
    label: 'send',
    description: 'Send a message to the client',
    category: 'client',
    argHints: ['"message"'],
    ...flow(['in'], []),
  },
  {
    command: 'say',
    label: 'say',
    description: 'Say a message in chat to the server',
    category: 'client',
    argHints: ['"message"'],
    ...flow(['in'], []),
  },
  {
    command: 'print',
    label: 'print',
    description: 'Print a message to the console/log',
    category: 'client',
    argHints: ['"message"'],
    ...flow(['in'], []),
  },
  {
    command: 'throw',
    label: 'throw',
    description: 'Throw a script exception with a message',
    category: 'client',
    argHints: ['"message"'],
    ...flow(['in'], []),
  },
  {
    command: 'notify',
    label: 'notify',
    description: 'Send an on-screen notification',
    category: 'client',
    argHints: ['N (stay seconds)', '"message"'],
    ...flow(['in'], []),
  },
  {
    command: 'playsound',
    label: 'playsound',
    description: 'Play a sound to the client',
    category: 'client',
    argHints: ['ID', 'N (volume)', 'N (pitch)'],
    ...flow(['in'], []),
  },

  // ── Module management ─────────────────────────────────────────────────────────
  {
    command: 'module enable',
    label: 'module enable',
    description: 'Enable a module by ID',
    category: 'client',
    argHints: ['<module-id>'],
    ...flow(['in'], []),
  },
  {
    command: 'module disable',
    label: 'module disable',
    description: 'Disable a module by ID',
    category: 'client',
    argHints: ['<module-id>'],
    ...flow(['in'], []),
  },
  {
    command: 'module create',
    label: 'module create',
    description: 'Create a new module at runtime',
    category: 'client',
    argHints: ['<module-id>'],
    ...flow(['in'], []),
  },

  // ── Config ────────────────────────────────────────────────────────────────────
  {
    command: 'config save',
    label: 'config save',
    description: 'Save the current config profile',
    category: 'client',
    argHints: [],
    ...flow(['in'], []),
  },
  {
    command: 'config load',
    label: 'config load',
    description: 'Load the config profile',
    category: 'client',
    argHints: [],
    ...flow(['in'], []),
  },
  {
    command: 'config reload',
    label: 'config reload',
    description: 'Reload the config profile',
    category: 'client',
    argHints: [],
    ...flow(['in'], []),
  },

  // ── Exit ──────────────────────────────────────────────────────────────────────
  {
    command: 'exit',
    label: 'exit',
    description: 'Exit the Java JVM with specified exit code',
    category: 'client',
    argHints: ['n (exit code)'],
    ...flow(['in'], []),
  },

  // ── Macros ────────────────────────────────────────────────────────────────────
  {
    command: 'input',
    label: 'input',
    description: 'Simulate a player input',
    category: 'macro',
    argHints: ['<input_name>'],
    ...flow(['in'], []),
  },
  {
    command: 'hold_input',
    label: 'hold_input',
    description: 'Hold a player input for N seconds',
    category: 'macro',
    argHints: ['<input_name>', 'N (seconds) | cancel'],
    ...flow(['in'], []),
  },
  {
    command: 'switch',
    label: 'switch',
    description: 'Hotkey to a hotbar item, or "back" to previous',
    category: 'macro',
    argHints: ['ID | back'],
    ...flow(['in'], []),
  },
  {
    command: 'swap',
    label: 'swap',
    description: 'Swap main hand with offhand item',
    category: 'macro',
    argHints: [],
    ...flow(['in'], []),
  },
  {
    command: 'drop',
    label: 'drop',
    description: 'Drop N items (or all) from main hand',
    category: 'macro',
    argHints: ['N | all'],
    ...flow(['in'], []),
  },
  {
    command: 'damage',
    label: 'damage',
    description: 'Send attack packet to nearest target entity',
    category: 'macro',
    argHints: ['<target_type>', '[ID]'],
    ...flow(['in'], []),
  },
  {
    command: 'turn_to',
    label: 'turn_to',
    description: 'Slowly turn camera toward a target, then run callback',
    category: 'macro',
    argHints: ['<target_type>', '[ID]', 'then ..'],
    ...flow(['in'], ['then']),
  },
  {
    command: 'snap_to',
    label: 'snap_to',
    description: 'Instantly snap camera toward a target, then run callback',
    category: 'macro',
    argHints: ['<target_type>', '[ID]', 'then ..'],
    ...flow(['in'], ['then']),
  },
  {
    command: 'teleport',
    label: 'teleport',
    description: 'Send a teleport packet to change position',
    category: 'macro',
    argHints: ['~N ~N ~N'],
    ...flow(['in'], []),
  },
  {
    command: 'velocity',
    label: 'velocity',
    description: 'Send a velocity packet to change movement',
    category: 'macro',
    argHints: ['~N ~N ~N'],
    ...flow(['in'], []),
  },
  {
    command: 'gui_drop',
    label: 'gui_drop',
    description: 'Drop an item from inventory GUI',
    category: 'macro',
    argHints: ['ID', 'N | all'],
    ...flow(['in'], []),
  },
  {
    command: 'gui_switch',
    label: 'gui_switch',
    description: 'Hover cursor over item in inventory GUI',
    category: 'macro',
    argHints: ['ID'],
    ...flow(['in'], []),
  },
  {
    command: 'gui_swap',
    label: 'gui_swap',
    description: 'Swap inventory item with offhand',
    category: 'macro',
    argHints: ['ID'],
    ...flow(['in'], []),
  },
  {
    command: 'gui_quickmove',
    label: 'gui_quickmove',
    description: 'Quick-move an item in inventory GUI',
    category: 'macro',
    argHints: ['ID', '[n (slot)]'],
    ...flow(['in'], []),
  },

  // ── Packets ───────────────────────────────────────────────────────────────────
  {
    command: 'cancel_packet',
    label: 'cancel_packet',
    description: 'Cancel the next packet of specified type',
    category: 'packet',
    argHints: ['c2s | s2c', '<packetName>'],
    ...flow(['in'], []),
  },
  {
    command: 'uncancel_packet',
    label: 'uncancel_packet',
    description: 'Remove a packet from the cancel queue',
    category: 'packet',
    argHints: ['c2s | s2c', '<packetName>'],
    ...flow(['in'], []),
  },
];

// ─── Lookup helper ────────────────────────────────────────────────────────────

const _map = new Map<string, NodeDefinition>(
  NODE_REGISTRY.map(d => [d.command, d])
);

/**
 * Look up a node definition by command string.
 * Falls back to an "unknown" definition if not registered.
 */
export function getNodeDef(command: string): NodeDefinition {
  return _map.get(command) ?? {
    command,
    label: command,
    description: 'Unrecognized command',
    category: 'unknown',
    argHints: [],
    inputs: [{ id: 'in', label: 'in' }],
    outputs: [],
  };
}