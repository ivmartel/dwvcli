import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {
  getDwvVersion,
  DicomParser
} from 'dwv';

/**
 * Parse and verify input arguments.
 *
 * @param {string[]} argv Input arguments.
 * @returns {object} The validated arguments.
 */
function parseArgs(argv) {
  const _yargs = yargs();
  _yargs.usage('Usage: $0 -i [str] [-m]')
    .example([
      [
        '$0 -i data.dcm',
        'Move the input file into a folder ' +
        'named after its Series Instance UID.'
      ],
      [
        '$0 -i /path/to/data',
        'Move the dicom files of the input folder into a folder ' +
        'named after their Series Instance UID.'
      ]
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input dicom file name or folder of dicom files')
    .alias('m', 'move')
    .describe('m', 'Flag to move, and not copy, the input file(s) ' +
      'into the Series instance UID dir')
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
      return true;
    });
  return _yargs.parse(hideBin(argv));
}

/**
 * Get the list of file paths: if the input path
 * is a folder, returns the list of files of the folder;
 * if the input path is a file returns just the file.
 *
 * @param {string} inputPath The input path.
 * @returns {string[]} The list of file paths.
 */
function getFilePaths(inputPath) {
  let paths = [];
  if (fs.lstatSync(inputPath).isDirectory()) {
    const names = fs.readdirSync(args.input);
    for (const name of names) {
      paths.push(path.join(inputPath, name));
    }
  } else {
    paths = [inputPath];
  }
  return paths;
}

/**
 * Parse a DICOM file.
 *
 * @param {string} inputPath The file path.
 * @returns {object|undefined} The dicom elements.
 */
function parseDicomFile(inputPath) {
  // read dicom file
  const nodeBuffer = fs.readFileSync(inputPath);
  // corrupt buffer in some cases... cast seems to fix it
  const dicomBuffer = new Uint8Array(nodeBuffer).buffer;

  // setup the dicom parser
  const dicomParser = new DicomParser();
  // parse the buffer
  try {
    dicomParser.parse(dicomBuffer);
  } catch (e) {
    console.log('Error: ', e);
    return;
  }

  return dicomParser.getDicomElements();
}

/**
 * Get the destination directory: input file root +
 *   series UID.
 *
 * @param {string} inputPath The input file path.
 * @param {object} elements The dicom elements.
 * @returns {string} The destination directory.
 */
function getDistDir(inputPath, elements) {
  // https://dicom.innolitics.com/ciods/ct-image/general-series/0020000e
  const seriesUidElement = elements['0020000E'];
  if (typeof seriesUidElement === 'undefined') {
    throw new Error('Series Instance UID is undefined.');
  }

  // dir based on Series UID
  const inputDirname = path.dirname(inputPath);
  const dir = inputDirname + '/' + seriesUidElement.value[0];
  // create dir if not present
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  return dir;
}

/**
 * Move or copy the input file.
 *
 * @param {string} inputPath The input file path.
 * @param {string} dir The destination directory.
 * @param {boolean} moveOrCopy Move or copy flag: true to move,
 * false to copy.
 * @returns {boolean} True if all went well.
 */
function moveOrCopyInputFile(inputPath, dir, moveOrCopy) {
  // file names
  const inputFilename = path.basename(inputPath);
  const destPath = path.join(dir, inputFilename);
  // move or copy
  if (moveOrCopy) {
    try {
      fs.renameSync(inputPath, destPath);
    } catch (e) {
      console.log('Rename error: ', e);
      return false;
    }
  } else {
    try {
      fs.copyFileSync(inputPath, destPath);
    } catch (e) {
      console.log('Copy error: ', e);
      return false;
    }
  }
  return true;
}

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') sort on: ' + args.input);

// get the file list
const filePaths = getFilePaths(args.input);
// move or copy for each file
for (const filePath of filePaths) {
  // parse dicom file
  const elements = parseDicomFile(filePath);
  if (typeof elements === 'undefined') {
    continue;
  }
  // get the destination directory
  const dir = getDistDir(filePath, elements);
  // move or copy input file to destination
  moveOrCopyInputFile(filePath, dir, args.move);
}

// all good
process.exit();
