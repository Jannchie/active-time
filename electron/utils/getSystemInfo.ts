import os from 'os'
export function getSystemInfo () {
  return {
    platform: os.platform(),
    memory: os.totalmem(),
    version: os.version(),
    arch: os.arch(),
  }
}
