import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {
  App,
  AppOptions,
  getDwvVersion,
} from 'dwv';

/**
 * Parse and verify input arguments.
 *
 * @param {string[]} argv Input arguments.
 * @returns {object} The validated arguments.
 */
function parseArgs(argv) {
  const _yargs = yargs();
  _yargs.usage('Usage: $0 -i [str]')
    .example([
      [
        '$0 -i path/to/dicom/',
        'Load a folder to check for errors.'
      ]
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input root folder name')
    .alias('f', 'folder')
    .nargs('f', 1)
    .describe('f', 'Input folder name')
    .alias('v', 'version')
    .alias('h', 'help')
    .demandOption(['i'])
    .strict()
    .version('0.1.0')
    .check(argv2 => {
      // check that input path exists
      if (!fs.existsSync(argv2.input)) {
        throw new Error('Input path does not exist.');
      }
      // check that input path is a directory
      if (!fs.lstatSync(argv2.input).isDirectory()) {
        throw new Error('Input path is not a directory.');
      }
      return true;
    });
  return _yargs.parse(hideBin(argv));
}

/**
 * Get the list of directory paths: if the input path
 * contains a folder, returns the list of subfolder of the folder;
 * if the input path does not contain a folder, returns just the folder.
 *
 * @param {string} inputPath The input path.
 * @returns {string[]} The list of file paths.
 */
function getDirectoryPaths(inputPath) {
  const subdirPaths = [];
  const dirents = fs.readdirSync(inputPath, {withFileTypes: true});
  for (const dirent of dirents) {
    if (dirent.isDirectory()) {
      subdirPaths.push(path.join(inputPath, dirent.name));
    }
  }
  let paths = [];
  if (subdirPaths.length !== 0) {
    paths = subdirPaths;
  } else {
    paths = [inputPath];
  }

  return paths;
}

/**
 * Get the list of loaded files.
 *
 * @param {string} inputPath The input path.
 * @returns {object[]} The list of file objects.
 */
function getFileObjects(inputPath, folderName) {
  const fileObjects = [];
  let finalPath = inputPath;
  if (typeof folderName !== 'undefined') {
    finalPath = path.join(inputPath, folderName);
  }
  const names = fs.readdirSync(finalPath);
  for (const name of names) {
    const fullPath = path.join(finalPath, name);
    const nodeBuffer = fs.readFileSync(fullPath);
    fileObjects.push({
      filename: name,
      data: new Uint8Array(nodeBuffer).buffer
    });
  }
  return fileObjects;
}

/**
 * Load the input file objects in a simple dwv app.
 *
 * @param {object[]} files File objecs to load.
 * @returns
 */
function loadFileObjecs(dirPath, folderName) {
  return new Promise((resolve, reject) => {

    const fileObjects = getFileObjects(dirPath, folderName);
    if (fileObjects.length === 0) {
      reject({error: {message: 'no files!'}});
    }

    // app config
    const options = new AppOptions();
    options.viewOnFirstLoadItem = false;
    // create app
    const app = new App();
    app.init(options);

    app.addEventListener('error', (e) => {
      reject({error: e});
    });
    app.addEventListener('load', () => resolve());
    //app.addEventListener('loadend', () => resolve());

    // load the files
    app.loadImageObject(fileObjects);
  });
}

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') load on: ' + args.input);

// error store
const errors = [];

// get the file list
const dirPaths = getDirectoryPaths(args.input);
// load for each file
for (const dirPath of dirPaths) {
  await loadFileObjecs(dirPath, args.folder)
    .catch((err) => {
      errors.push({
        input: dirPath,
        error: err
      });
    });
}

// log errors
if (errors.length !== 0) {
  console.log('Received', errors.length, 'error(s)');
  console.log('Path(s):');
  for (const error of errors) {
    console.log('-', error.input);
  }
} else {
  console.log('All good!');
}

// all good
process.exit();
