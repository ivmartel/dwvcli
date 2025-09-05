import fs from 'fs';
import path from 'path';
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
        '$0 -i data.dcm -r resources/rules.json -o path/out',
        'Write back the input DICOM file using the input rules file.'
      ],
      [
        '$0 -i path/to/data -r resources/rules.json -o path/out',
        'Write back the DICOM files of the input folder ' +
        'using the input rules file.'
      ]
    ])
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'Input dicom file name or folder of dicom files')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'Output dicom folder')
    .alias('r', 'rules')
    .nargs('r', 1)
    .describe('r', 'Writing rules file name')
    .alias('v', 'version')
    .alias('h', 'help')
    .demandOption(['i', 'o', 'r'])
    .strict()
    .version('0.1.0')
    .check(argv2 => {
      // check that input path exists
      if (!fs.existsSync(argv2.input)) {
        throw new Error('Input path does not exist.');
      }
      // check that rules paht exists
      if (!fs.existsSync(argv2.rules)) {
        throw new Error('Input rules file does not exist.');
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
 * Parse a rules file.
 *
 * @param {string} inputPath The input path.
 * @returns {object} The rules.
 */
function parseRulesFile(inputPath) {
  const rulesData = fs.readFileSync(inputPath, 'utf-8');
  return JSON.parse(rulesData);
}

/**
 * Write the output DICOM file.
 *
 * @param {object} elements The DICOM elements.
 * @param {object} rules The write rules.
 * @param {string} outputPath The output path.
 * @returns {boolean} True if all went well.
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
  try {
    fs.writeFileSync(outputPath, new DataView(outputDicomBuffer));
  } catch (e) {
    console.log('Write error: ', e);
    return false;
  }
  return true;
}

// *************************************
// main
// *************************************
const args = parseArgs(process.argv);

console.log('> Running dwv (v' +
  getDwvVersion() + ') anonymisation on: ' + args.input);

// create ouput path if not present
if (!fs.existsSync(args.output)) {
  fs.mkdirSync(args.output);
}

// get the file list
const filePaths = getFilePaths(args.input);
// move or copy for each file
for (const filePath of filePaths) {
  // parse dicom file
  const elements = parseDicomFile(filePath);
  if (typeof elements === 'undefined') {
    continue;
  }
  // parse rules file
  const rules = parseRulesFile(args.rules);
  // output file path
  const outputFilePath = path.join(
    args.output, path.basename(filePath));
  // write dicom files according to rules
  writeFile(elements, rules, outputFilePath);
}

// all good
process.exit();
