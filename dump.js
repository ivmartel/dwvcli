import fs from 'fs';
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
  _yargs.usage('Usage: $0 -i [str]')
    .example([
      [
        '$0 -i data.dcm',
        'Dump the content of the input DICOM file.'
      ]
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input dicom file name')
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
 * @param {string} path The file path.
 * @returns {object} The dicom elements.
 */
function parseDicomFile(path) {
  // read dicom file
  const nodeBuffer = fs.readFileSync(path);
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

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') dump on: ' + args.input);

// parse dicom file
const elements = parseDicomFile(args.input);
// log the dicom elements
console.log(elements);

// all good
process.exit();
