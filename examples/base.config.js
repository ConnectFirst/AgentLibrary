const FilePicker = require('./helpers/FilePicker');
const { execFile } = require('child_process');
require('./helpers/InitGlobals');

// prompt for files and execute
FilePicker.promptForFiles().then((files) => {
  files.forEach((file) => {
    console.time(file);
    execFile('node', [`./examples/${file}`], (err, stdout, stderr) => {
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
