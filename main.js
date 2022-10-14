import dwv from 'dwv';
import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

const _yargs = yargs();
_yargs.usage('Usage: $0 -i [str] [-d] [-r [str] -o [str]]')
  .example([
    [
      '$0 -i data.dcm -d',
      'Dump the content of the input DICOM file.'
    ],
    [
      '$0 -i data.dcm -r resources/rules.json -o out.dcm',
      'Write back the input DICOM file using the input fules file.'
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
  .implies('o', 'r')
  .implies('r', 'o')
  .alias('d', 'dump')
  .boolean(['d'])
  .describe('d', 'Parse and dump content to output stream')
  .alias('v', 'version')
  .alias('h', 'help')
  .demandOption(['i'])
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

console.log('> Running dwv parser on: ' + args.input);

// read dicom file
const dicomBuffer = fs.readFileSync(args.input, null).buffer;

// setup the dicom parser
const dicomParser = new dwv.dicom.DicomParser();
// parse the buffer
dicomParser.parse(dicomBuffer);

// dump
if (args.dump) {
  console.log(dicomParser.getDicomElements().dump());
}

// write mode
// (if rules is there, so should output, see yargs implies)
if (typeof args.rules !== 'undefined') {
  // read rules file
  const rulesData = fs.readFileSync(args.rules, 'utf-8');
  const rulesJson = JSON.parse(rulesData);

  // get output buffer
  const writer = new dwv.dicom.DicomWriter();
  writer.rules = rulesJson;
  const elements = dicomParser.getRawDicomElements();
  const outputDicomBuffer = writer.getBuffer(elements);
  if (outputDicomBuffer === null) {
    throw new Error('Problem when creating output dicom buffer...');
  }

  // write output buffer
  fs.writeFileSync(args.output, new DataView(outputDicomBuffer));
}

// all good
process.exit();
