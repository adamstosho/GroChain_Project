/** Save a QR code download in PNG, SVG (embedded), or PDF. */
export async function saveQrDownload(
  response: Response,
  code: string,
  format: "png" | "svg" | "pdf" = "png"
): Promise<void> {
  const pngBlob = await response.blob()
  const baseName = (code || "qr-code").replace(/[^\w.-]+/g, "_")

  if (format === "png") {
    triggerDownload(pngBlob, `${baseName}.png`)
    return
  }

  const dataUrl = await blobToDataUrl(pngBlob)

  if (format === "svg") {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#FFFFFF"/>
  <image width="512" height="512" xlink:href="${dataUrl}"/>
</svg>`
    triggerDownload(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `${baseName}.svg`)
    return
  }

  // PDF
  const { default: jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFillColor(11, 61, 30)
  doc.rect(0, 0, pageW, 28, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("GroChain QR Code", 14, 14)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Building Trust in Nigeria's Food Chain", 14, 21)
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(11)
  doc.text(`Code: ${code}`, 14, 40)
  const imgSize = 90
  const x = (pageW - imgSize) / 2
  doc.addImage(dataUrl, "PNG", x, 50, imgSize, imgSize)
  doc.setFillColor(22, 101, 52)
  doc.rect(0, doc.internal.pageSize.getHeight() - 8, pageW, 8, "F")
  doc.save(`${baseName}.pdf`)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result || ""))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
