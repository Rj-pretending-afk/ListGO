const MAX_PX = 800
const JPEG_QUALITY = 0.80

/**
 * 将 base64/data-URL 图片压缩到 MAX_PX 宽度以内并输出 JPEG。
 * 无论原始尺寸是否已在限制内，都走 canvas 压缩，避免大体积 PNG 原样存入 D1。
 * 对 https:// URL 不做处理（无法 canvas 跨域）。
 */
export function resizeDataUrl(dataUrl: string, maxPx = MAX_PX): Promise<string> {
  if (!dataUrl.startsWith('data:image')) return Promise.resolve(dataUrl)

  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const w = Math.min(img.width, maxPx)
      const h = Math.round(img.height * (w / img.width))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}
