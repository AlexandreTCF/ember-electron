const fs = require('fs-extra');
const path = require('path');
const childProcess = require('child_process');
const path7za = require('7zip-bin').path7za;

const PromiseExt = require('ember-cli/lib/ext/promise');

module.exports = function shipMac (pkg, options) {
  const ee = pkg['ember-electron'];
  const mkdir = PromiseExt.denodeify(fs.mkdirs);

  return mkdir(path.join('electron-builds', 'installers'))
    .finally(() => createZip(pkg, options));
}

function createZip (pkg, options) {
  const ee = pkg['ember-electron'];
  const access = PromiseExt.denodeify(fs.access);
  const unlink = PromiseExt.denodeify(fs.unlink);

  const name = options.name || ee.name || pkg.name;
  const platform = options.platform || ee.platform;
  const arch = options.arch || ee.arch;

  const basePath = path.resolve('electron-builds');
  const input = path.join(basePath, `${name}-${platform}-${arch}`);
  const output = path.join(basePath, 'installers', `${name}.zip`);

  return access(output)
    .then(() => unlink(output))
    .finally(() => {
      // ht electron-builder/src/targets/archive: https://github.com/electron-userland/electron-builder/blob/master/src/targets/archive.ts#L41-L80
      const zipArgs = [
        'a', '-bd', '-bb0', // ht electron-builder/src/util/util#debug7zargs https://github.com/electron-userland/electron-builder/blob/master/src/util/util.ts#L230-L239
        '-mm=Deflate',
        output,
        path.basename(input)
      ];

      const zipOpts = {
        cwd: path.dirname(input),
        stdio: 'ignore'
      };

      const zip = childProcess.spawn(path7za, zipArgs, zipOpts);

      return new PromiseExt((resolve, reject) => {
        zip.on('close', (code) => {
          switch (code) {
          case 0: resolve();
          default: reject(`Error shipping for Mac: 7zip command threw ${code}`);
          }
        });
      });
    });
}
