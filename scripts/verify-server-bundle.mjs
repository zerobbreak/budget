import { access, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const serverDir = join(process.cwd(), '.output/server')

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function collectModuleFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = join(directory, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await collectModuleFiles(path)))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.mjs')) {
      files.push(path)
    }
  }

  return files
}

if (!(await pathExists(serverDir))) {
  console.log(
    'Skipping server bundle verification (.output/server not found — expected on Vercel builds).',
  )
  process.exit(0)
}

const files = await collectModuleFiles(serverDir)

for (const file of files) {
  const source = await readFile(file, 'utf8')

  if (/export\s*\{[^}]*\bssr_exports\b/.test(source) && !/\bssr_exports\s*=/.test(source)) {
    console.error(`Invalid SSR bundle: ${file} exports ssr_exports without declaring it.`)
    process.exit(1)
  }

  if (/\bcreateSelectorCreator\$1\b/.test(source) && !/\b(?:var|let|const|function)\s+createSelectorCreator\$1\b/.test(source)) {
    console.error(
      `Invalid SSR bundle: ${file} references createSelectorCreator$1 without declaring it.`,
    )
    process.exit(1)
  }

  const result = spawnSync(process.execPath, ['--check', file], {
    stdio: 'inherit',
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

console.log(`Server bundle check passed (${files.length} modules).`)
