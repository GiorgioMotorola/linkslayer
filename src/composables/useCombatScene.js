import { ref } from "vue";

// Module-level singleton — same refs shared across all callers
const _actionsPlaying    = ref(false);
const _currentActionIndex = ref(0);
const _selectionLocked   = ref(false);

// Export via composable so <script setup> components receive real top-level
// ref bindings that Vue auto-unwraps in templates.
export function useCombatScene() {
  return {
    actionsPlaying:     _actionsPlaying,
    currentActionIndex: _currentActionIndex,
    selectionLocked:    _selectionLocked,
  };
}
