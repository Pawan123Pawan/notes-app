/**
 * Runs once when the Next.js server starts.
 * bson@7.3+ calls v8.startupSnapshot.isBuildingSnapshot(), which throws in Bun.
 * Patch before any MongoDB / Mongoose import so auth and DB code can load.
 */
export async function register() {
  patchV8StartupSnapshotForBun()
}

function patchV8StartupSnapshotForBun() {
  try {
    const getBuiltinModule = (
      process as NodeJS.Process & {
        getBuiltinModule?: (id: string) => unknown
      }
    ).getBuiltinModule

    if (typeof getBuiltinModule !== 'function') {
      return
    }

    const v8Module = getBuiltinModule('v8') as
      | {
          startupSnapshot?: {
            isBuildingSnapshot?: () => boolean
            addDeserializeCallback?: (callback: () => void) => void
          }
        }
      | undefined

    if (!v8Module) {
      return
    }

    const existing = v8Module.startupSnapshot

    Object.defineProperty(v8Module, 'startupSnapshot', {
      configurable: true,
      enumerable: true,
      value: {
        isBuildingSnapshot: () => {
          try {
            return existing?.isBuildingSnapshot?.() ?? false
          } catch {
            return false
          }
        },
        addDeserializeCallback: (callback: () => void) => {
          try {
            existing?.addDeserializeCallback?.(callback)
          } catch {
            // Bun: not implemented — ignore.
          }
        },
      },
    })
  } catch {
    // Never block server boot on a best-effort polyfill.
  }
}
