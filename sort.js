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
        'Move thie input file into a folder ' +
        'named after its Series Instance UID.'
      ]
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input dicom file name')
    .alias('m', 'move')
    .describe('m', 'Move the input file into the new dir')
    .alias('v', 'version')
    .alias('h', 'help')
    .demandOption(['i'])
    .strict()
    .version('0.1.0')
    .check(argv2 => {
      // check that input exist
      if (!fs.existsSync(argv2.input)) {
        throw new Error('Input DICOM file does not exist.');
      }
      // check that input is not a directory
      if (fs.lstatSync(argv2.input).isDirectory()) {
        throw new Error('Input file is a directory.');
      }
      return true;
    });
  return _yargs.parse(hideBin(argv));
}

/**
 * Parse a DICOM file.
 *
 * @param {string} inputPath The file path.
 * @returns {object} The dicom elements.
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
 */
function moveOrCopyInputFile(inputPath, dir, moveOrCopy) {
  // file names
  const inputFilename = path.basename(inputPath);
  const dest = dir + '/' + inputFilename;
  const errorCb = (error) => {
    console.log('Error: ', error);
  };
  // move or copy
  if (moveOrCopy) {
    fs.rename(inputPath, dest, errorCb);
  } else {
    fs.copyFile(inputPath, dest, errorCb);
  }
}

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') sort on: ' + args.input);

// parse dicom file
const elements = parseDicomFile(args.input);
// get the destination directory
const dir = getDistDir(args.input, elements);
// move or copy input file to destination
moveOrCopyInputFile(args.input, dir, args.move);

// all good
process.exit();
