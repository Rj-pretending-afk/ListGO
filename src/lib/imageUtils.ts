const MAX_PX = 1200
const JPEG_QUALITY = 0.85

/**
 * 将 base64/data-URL 图片缩放到 MAX_PX 宽度以内，输出 JPEG。
 * 对 https:// URL 不做处理（无法 canvas 跨域）。
 */
export function resizeDataUrl(dataUrl: string, maxPx = MAX_PX): Promise<string> {
  if (!dataUrl.startsWith('data:image')) return Promise.resolve(dataUrl)

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      if (img.width <= maxPx) { resolve(dataUrl); return }
      const ratio = maxPx / img.width
      const canvas = document.createElement('canvas')
      canvas.width = maxPx
      canvas.height = Math.round(img.height * ratio)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
