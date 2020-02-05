const FilePicker = require('./helpers/FilePicker');
const { exec } = require('child_process');

FilePicker.promptForFiles().then((files) => {
  files.forEach((file) => {
    console.time(file);
    exec(`node ${FilePicker.baseDir}/${file}`, (err, stdout, stderr) => {
      if (err) {
        console.error(err);
      } else {
        if (stdout) {
          console.log(stdout);
        }

        if (stderr) {
          console.error(stderr);
        }
      }

      console.timeEnd(file);
    });
  });
});
