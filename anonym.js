import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {
  getDwvVersion,
  DicomParser,
  DicomWriter
} from 'dwv';

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
  .check(argv => {
    // check that files do exist
    if (!fs.existsSync(argv.input)) {
      throw new Error('Input DICOM file does not exist.');
    }
    if (typeof argv.rules !== 'undefined' &&
      !fs.existsSync(argv.rules)) {
      throw new Error('Input rules file does not exist.');
    }
    return true;
  });
const args = _yargs.parse(hideBin(process.argv));

console.log('> Running dwv (v' +
getDwvVersion() + ') anonymisation on: ' + args.input);

// read dicom file
const dicomBuffer = fs.readFileSync(args.input, null).buffer;

// setup the dicom parser
const dicomParser = new DicomParser();
// parse the buffer
dicomParser.parse(dicomBuffer);

// read rules file
const rulesData = fs.readFileSync(args.rules, 'utf-8');
const rulesJson = JSON.parse(rulesData);

// get output buffer
const writer = new DicomWriter();
writer.rules = rulesJson;
const elements = dicomParser.getDicomElements();
const outputDicomBuffer = writer.getBuffer(elements);
if (outputDicomBuffer === null) {
  throw new Error('Problem when creating output dicom buffer...');
}

// write output buffer
fs.writeFileSync(args.output, new DataView(outputDicomBuffer));

// all good
process.exit();
