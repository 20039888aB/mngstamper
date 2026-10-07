import '@testing-library/jest-dom/vitest'

// jsdom does not implement Blob.prototype.arrayBuffer, which the production
// sniffing code relies on (browsers do provide it). Polyfill it via FileReader
// so tests exercise the real browser code path.
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
