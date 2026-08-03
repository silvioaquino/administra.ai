// scripts/prepare-dist.mjs
// O Next.js gera a build em `.next`, mas a verificação da plataforma espera `dist/`.
// Este script copia a saída da build para `dist/` sem symlinks de diretório.
import { existsSync, rmSync, cpSync, lstatSync, readlinkSync } from "node:fs"
import { resolve } from "node:path"

const root = process.cwd()
const source = resolve(root, ".next")
const target = resolve(root, "dist")

if (!existsSync(source)) {
  console.error("Saída da build não encontrada em .next")
  process.exit(1)
}

rmSync(target, { recursive: true, force: true })

cpSync(source, target, {
  recursive: true,
  dereference: true,
  filter: (path) => {
    if (!lstatSync(path).isSymbolicLink()) return true

    const linkTarget = resolve(path, "..", readlinkSync(path))
    return existsSync(linkTarget)
  },
})

console.log("dist copiado a partir de .next sem symlinks")
