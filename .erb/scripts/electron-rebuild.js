import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { dependencies } from '../../release/app/package.json';
import webpackPaths from '../configs/webpack.paths';

function getElectronVersion() {
  if (process.env.ELECTRON_VERSION) {
    return process.env.ELECTRON_VERSION;
  }

  const electronPkgPath = path.join(
    webpackPaths.rootPath,
    'node_modules',
    'electron',
    'package.json'
  );
  if (fs.existsSync(electronPkgPath)) {
    const electronPkg = JSON.parse(fs.readFileSync(electronPkgPath, 'utf-8'));
    return electronPkg?.version;
  }

  const rootPkgPath = path.join(webpackPaths.rootPath, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
    return rootPkg?.devDependencies?.electron || rootPkg?.dependencies?.electron;
  }

  return null;
}

if (
  Object.keys(dependencies || {}).length > 0 &&
  fs.existsSync(webpackPaths.appNodeModulesPath)
) {
  const electronVersion = getElectronVersion();
  const versionArg = electronVersion ? ` --version ${electronVersion}` : '';
  const electronRebuildCmd = `../../node_modules/.bin/electron-rebuild --force --types prod,dev,optional --module-dir .${versionArg}`;
  const cmd =
    process.platform === 'win32'
      ? electronRebuildCmd.replace(/\//g, '\\')
      : electronRebuildCmd;
  execSync(cmd, {
    cwd: webpackPaths.appPath,
    stdio: 'inherit',
  });
}
