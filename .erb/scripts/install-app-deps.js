const { execSync } = require('child_process');

const skipFlag = process.env.SKIP_ELECTRON_BUILDER_INSTALL_APP_DEPS;
const isCi = !!process.env.CI && process.env.CI !== 'false';
const shouldSkip =
  isCi || skipFlag === '1' || skipFlag === 'true' || skipFlag === 'yes';

if (shouldSkip) {
  console.log(
    'Skipping electron-builder install-app-deps (CI or SKIP_ELECTRON_BUILDER_INSTALL_APP_DEPS set).'
  );
  process.exit(0);
}

try {
  execSync('pnpm exec electron-builder install-app-deps', {
    stdio: 'inherit',
  });
} catch (error) {
  process.exit(typeof error?.status === 'number' ? error.status : 1);
}
