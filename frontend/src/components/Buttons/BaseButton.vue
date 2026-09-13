<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | danger | ghost
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false }
});

defineEmits(['click']);
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    class="base-button"
    :class="[`base-button--${variant}`, { 'base-button--block': block }]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<style scoped lang="scss">
@use '../../styles/variables.scss' as *;

.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: $radius-sm;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  transition: filter 0.15s ease, background-color 0.15s ease;
  min-height: 42px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(0.95);
  }

  &--primary {
    background: $color-primary;
    color: #fff;
  }

  &--secondary {
    background: $color-surface;
    color: $color-primary;
    border-color: $color-primary;
  }

  &--danger {
    background: $color-error;
    color: #fff;
  }

  &--ghost {
    background: transparent;
    color: $color-text-muted;

    &:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  &--block {
    width: 100%;
  }
}
</style>
