const storage = {
  get(name: string): string | null {
    if (process.client) {
      return localStorage.getItem(name)
    }
    return null
  },

  set(name: string, item: string) {
    if (process.client) {
      localStorage.setItem(name, item)
    }
  },

  has(name: string): boolean {
    if (process.client) {
      return localStorage.getItem(name) !== null
    }
    return false
  },

  remove(name: string) {
    if (process.client) {
      localStorage.removeItem(name)
    }
  },

  removeItems(items: string[]) {
    if (process.client && items && Array.isArray(items) && items.length) {
      items.forEach(item => {
        this.remove(item)
      })
    }
  },

  clear() {
    if (process.client) {
      localStorage.clear()
    }
  }
}

export default storage