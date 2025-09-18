import fs from 'fs'
import path from 'path'
import ejs from 'ejs'
import puppeteer from 'puppeteer'
import QRCode from 'qrcode'

const TEMPLATES_DIR = path.resolve(process.cwd(), 'src', 'templates')

async function renderTemplate(templateName, data) {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`)
  const cssPath = path.join(TEMPLATES_DIR, 'base.css')
  const tpl = fs.readFileSync(templatePath, 'utf8')
  let cssHref = ''
  if (fs.existsSync(cssPath)) {
    const css = fs.readFileSync(cssPath, 'utf8')
    const base64 = Buffer.from(css, 'utf8').toString('base64')
    cssHref = `data:text/css;base64,${base64}`
  }
  // Auto-load DIGEMAPS logo as data URL if not provided
  let logoUrl = data?.logoUrl
  try {
    if (!logoUrl) {
      const candidates = [
        path.resolve(process.cwd(), 'Especificaciones', 'DIGEMAPS.png'),
        path.resolve(process.cwd(), '..', 'Especificaciones', 'DIGEMAPS.png'),
        path.resolve(process.cwd(), '..', '..', 'Especificaciones', 'DIGEMAPS.png')
      ]
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p)
          const b64 = buf.toString('base64')
          logoUrl = `data:image/png;base64,${b64}`
          break
        }
      }
    }
  } catch {}
  const html = ejs.render(tpl, { ...data, cssHref, logoUrl })
  return html
}

function resolveBrowserExecutable() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && fs.existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH
  }
  const candidates = [
    // Edge
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    // Chrome
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p
    } catch {}
  }
  return null
}

export async function generateInformePDF({ template = 'informe', data, outputPath, returnBuffer = false }) {
  data = data || {}
  // Prepare QR as data URL if not present
  if (!data.qrDataUrl && data.qrText) {
    data.qrDataUrl = await QRCode.toDataURL(data.qrText)
  }
  const html = await renderTemplate(template, data)
  let browser
  try {
    // First attempt: default bundled Chromium
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--font-render-hinting=medium'] })
  } catch (e1) {
    // Fallback attempt: try system Edge/Chrome on Windows
    const exe = resolveBrowserExecutable()
    if (!exe) {
      throw e1
    }
    browser = await puppeteer.launch({ headless: 'new', executablePath: exe, args: ['--no-sandbox', '--font-render-hinting=medium'] })
  }
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.emulateMediaType('screen')
    const pdfRaw = await page.pdf({ path: returnBuffer ? undefined : outputPath, format: 'A4', printBackground: true, margin: { top: '15mm', right: '12mm', bottom: '15mm', left: '12mm' } })
    if (returnBuffer) {
      // Puppeteer usually returns a Buffer; normalize defensively
      const pdfBuffer = Buffer.isBuffer(pdfRaw) ? pdfRaw : Buffer.from(pdfRaw)
      return pdfBuffer
    }
  } finally {
    if (browser) await browser.close()
  }
  return outputPath
}
