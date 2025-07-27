<template>
  <div class="default-avatar" :style="{ width: size + 'px', height: size + 'px', fontSize: fontSize + 'px' }">
    <i class="fas fa-user"></i>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number
  fontSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 40,
  fontSize: 16
})
</script>

<style scoped>
.default-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.default-avatar i {
  opacity: 0.9;
}
</style> 