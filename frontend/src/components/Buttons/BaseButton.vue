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
  border-radius: $radius-md;
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 0.9rem;
  transition: filter 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
  min-height: 40px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    filter: brightness(0.95);
  }

  &--primary {
    background: linear-gradient(135deg, $color-primary-dark, $color-primary);
    color: #fff;
    box-shadow: 0 8px 18px rgba(168, 85, 247, 0.28);
  }

  &--secondary {
    background: $color-surface;
    color: $color-primary;
    border-color: $color-primary;
  }

  &--danger {
    background: #fff1f2;
    color: #be123c;
    border-color: #fecdd3;
  }

  &--ghost {
    background: transparent;
    color: $color-text-muted;

    &:not(:disabled):hover {
      background: rgba(0, 0, 0, 0.04);
    }
  }

  &--primary:not(:disabled):hover {
    background: $color-primary-dark;
  }

  &--block {
    width: 100%;
  }
}
</style>
