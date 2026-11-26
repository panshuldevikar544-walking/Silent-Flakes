// Runs a Blender script and waits for its log. The Windows Store launcher
// returns immediately, so the exit code alone cannot be trusted.
import { spawn } from 'node:child_process'
import { existsSync, lstatSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const log = path.join(here, 'last_run.log')
const script = path.join(here, 'make_book_parts.py')
const storeLauncher = path.join(
  process.env.LOCALAPPDATA ?? '',
  'Microsoft',
  'WindowsApps',
  'blender-launcher.exe',
)
// Store app aliases are links that existsSync cannot follow.
function isPresent(file) {
  try {
    return Boolean(lstatSync(file))
  } catch {
    return false
  }
}

const blender = process.env.BLENDER_PATH ?? (isPresent(storeLauncher) ? storeLauncher : 'blender')

rmSync(log, { force: true })
spawn(blender, ['--background', '--factory-startup', '--python', script], { stdio: 'inherit' }).on(
  'error',
  (error) => {
    console.error(`Could not start Blender (${error.message}). Set BLENDER_PATH.`)
    process.exit(1)
  },
)

const started = Date.now()
const timer = setInterval(() => {
  const text = existsSync(log) ? readFileSync(log, 'utf8') : ''
  if (text) {
    clearInterval(timer)
    console.log(text)
    process.exit(text === 'OK' ? 0 : 1)
  }
  if (Date.now() - started > 120_000) {
    console.error('Blender did not finish within two minutes.')
    process.exit(1)
  }
}, 500)
