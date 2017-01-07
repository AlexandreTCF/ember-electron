const fs = require('fs-extra');
const path = require('path');
const electronWinstaller = require('electron-winstaller');

const PromiseExt = require('ember-cli/lib/ext/promise');

module.exports = function shipWin (pkg, options) {
  const ee = pkg['ember-electron'];
  const mkdir = PromiseExt.denodeify(fs.mkdirs);

  return mkdir(path.join('electron-builds', 'installers'))
    .finally(() => createWinstaller(pkg, options));
}

function createWinstaller (pkg, options) {
  const ee = pkg['ember-electron'];
  const winOpts = ee['win-opts'];

  const name = options.name || ee.name || pkg.name;
  const platform = options.platform || ee.platform;
  const arch = options.arch || ee.arch;
  const version = options.version || ee['app-version'] || pkg.version

  const basePath = path.resolve('electron-builds');
  const input = path.join(basePath, `${name}-${platform}-${arch}`);
  const outputDir = path.join(basePath, 'installers');

  const exeName = name.replace(/-/g, '_');
  const installerOptions = {
    appDirectory: input,
    outputDirectory: outputDir,
    exe: `${exeName}.exe`,
    setupExe: `Setup.${exeName}.exe`,
    name: name,
    version: version
  };

  if (winOpts !== null && typeof winOpts === 'object') {
    const loadingGif = winOpts['loading-gif'];
    const iconUrl = winOpts['icon-url'];
    const certificateFile = winOpts['certificate-file'];
    const certificatePassword = winOpts['certificate-password'];
    const signWithParams = winOpts['sign-with-params'];

    const _remoteReleases = winOpts['remote-releases']
    const remoteReleases = typeof _remoteReleases === 'string' ?
      _remoteReleases.replace('$VERSION', version) :
      _remoteReleases;

    if (typeof loadingGif === 'string') {
      installerOptions.loadingGif = loadingGif;
    }

    if (typeof iconUrl === 'string') {
      installerOptions.iconUrl = iconUrl;
    }

    if (typeof remoteReleases === 'string') {
      installerOptions.remoteReleases = remoteReleases;
    }

    if (typeof certificateFile === 'string') {
      installerOptions.certificateFile = certificateFile;
    }

    if (typeof certificatePassword === 'string') {
      installerOptions.certificatePassword = certificatePassword;
    }

    if (typeof signWithParams === 'string') {
      installerOptions.signWithParams = signWithParams;
    }
  };

  return electronWinstaller.createWindowsInstaller(installerOptions);
}
