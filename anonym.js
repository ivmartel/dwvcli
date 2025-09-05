import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {
  getDwvVersion,
  DicomParser,
  DicomWriter
} from 'dwv';

/**
 * Parse and verify input arguments.
 *
 * @param {string[]} argv Input arguments.
 * @returns {object} The validated arguments.
 */
function parseArgs(argv) {
  const _yargs = yargs();
  _yargs.usage('Usage: $0 -i [str] [-d] -r [str] -o [str]')
    .example([
      [
        '$0 -i data.dcm -r resources/rules.json -o out.dcm',
        'Write back the input DICOM file using the input rules file.'
      ],
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input dicom file name')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'Output dicom file name')
    .alias('r', 'rules')
    .nargs('r', 1)
    .describe('r', 'Writing rules file name')
    .alias('v', 'version')
    .alias('h', 'help')
    .demandOption(['i', 'o', 'r'])
    .strict()
    .version('0.1.0')
    .check(argv2 => {
      // check that input exist
      if (!fs.existsSync(argv2.input)) {
        throw new Error('Input DICOM file does not exist.');
      }
      // check that rules exist
      if (typeof argv2.rules !== 'undefined' &&
        !fs.existsSync(argv2.rules)) {
        throw new Error('Input rules file does not exist.');
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

/**
 * Parse a rules file.
 *
 * @param {string} path The input path.
 * @returns {object} The rules.
 */
function parseRulesFile(path) {
  const rulesData = fs.readFileSync(path, 'utf-8');
  return JSON.parse(rulesData);
}

/**
 * Write the output DICOM file.
 *
 * @param {object} elements The DICOM elements.
 * @param {object} rules The write rules.
 * @param {string} outputPath The output path.
 */
function writeFile(elements, rules, outputPath) {
  // get output buffer
  const writer = new DicomWriter();
  writer.rules = rules;
  const outputDicomBuffer = writer.getBuffer(elements);
  if (outputDicomBuffer === null) {
    throw new Error('Problem when creating output dicom buffer...');
  }

  // write output buffer
  fs.writeFileSync(outputPath, new DataView(outputDicomBuffer));
}

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') anonymisation on: ' + args.input);

// parse dicom file
const elements = parseDicomFile(args.input);
// parse rules file
const rules = parseRulesFile(args.rules);
// write dicom files according to rules
writeFile(elements, rules, args.output);

// all good
process.exit();
