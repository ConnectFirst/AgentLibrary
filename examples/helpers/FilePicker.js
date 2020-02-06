const fs = require('fs');
const prompts = require('prompts');
const ignoreFiles = ['base.config.js', 'helpers', 'transport'];
const baseDir = './examples';

function promptForFiles() {
  return new Promise((resolve, reject) => {
    fs.readdir(baseDir, (err, files) => {
      files = files.filter((file) => {
        return ignoreFiles.indexOf(file) === -1;
      });
      (async () => {
        const response = await prompts([
          {
            type: 'multiselect',
            name: 'files',
            message: 'File to run',
            choices: [...files]
          }
        ]);

        resolve(response.files.map((index) => files[index]));
      })();
    });
  });
}

module.exports = {
  baseDir,
  promptForFiles
};
