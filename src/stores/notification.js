import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    isOpen: false,
    message: '',
    type: 'warning', // 'warning' | 'error' | 'success' | 'info'
    timeoutId: null,
  }),

  actions: {
    show({ message, type = 'warning', duration = 5000 }) {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }

      this.message = message
      this.type = type
      this.isOpen = true

      if (duration > 0) {
        this.timeoutId = setTimeout(() => {
          this.close()
        }, duration)
      }
    },

    warning(message, duration = 5000) {
      this.show({ message, type: 'warning', duration })
    },

    error(message, duration = 6000) {
      this.show({ message, type: 'error', duration })
    },

    success(message, duration = 4000) {
      this.show({ message, type: 'success', duration })
    },

    info(message, duration = 4000) {
      this.show({ message, type: 'info', duration })
    },

    close() {
      this.isOpen = false
      if (this.timeoutId) {
        clearTimeout(this.timeoutId)
        this.timeoutId = null
      }
    },
  },
})

