const { execSync } = require('child_process');
const path = require('path');

const skipFlag = process.env.SKIP_ELECTRON_BUILDER_INSTALL_APP_DEPS;
const isCi = !!process.env.CI && process.env.CI !== 'false';
const shouldSkip =
  isCi || skipFlag === '1' || skipFlag === 'true' || skipFlag === 'yes';
const forceElectronBuilder =
  process.env.FORCE_ELECTRON_BUILDER_INSTALL_APP_DEPS === '1' ||
  process.env.FORCE_ELECTRON_BUILDER_INSTALL_APP_DEPS === 'true' ||
  process.env.FORCE_ELECTRON_BUILDER_INSTALL_APP_DEPS === 'yes';
const appDir = path.resolve(__dirname, '..', '..', 'release', 'app');

if (shouldSkip) {
  console.log(
    'Skipping electron-builder install-app-deps (CI or SKIP_ELECTRON_BUILDER_INSTALL_APP_DEPS set).'
  );
  process.exit(0);
}

function runFallbackInstall() {
  console.log(
    'Installing release/app deps via pnpm install --frozen-lockfile --ignore-workspace.'
  );
  execSync('pnpm install --frozen-lockfile --ignore-workspace', {
    cwd: appDir,
    stdio: 'inherit',
  });
}

if (process.platform === 'win32' && !forceElectronBuilder) {
  runFallbackInstall();
  process.exit(0);
}

try {
  execSync('pnpm exec electron-builder install-app-deps', {
    stdio: 'inherit',
  });
} catch (error) {
  console.warn(
    'electron-builder install-app-deps failed; falling back to pnpm install in release/app.'
  );
  try {
    runFallbackInstall();
  } catch (fallbackError) {
    process.exit(typeof fallbackError?.status === 'number' ? fallbackError.status : 1);
  }
}
