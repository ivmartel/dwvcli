import dwv from 'dwv';
import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

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
  .check(argv => {
    // check that files do exist
    if (!fs.existsSync(argv.input)) {
      throw new Error('Input DICOM file does not exist.');
    }
    return true;
  });
const args = _yargs.parse(hideBin(process.argv));

console.log('> Running dwv (v' +
  dwv.getDwvVersion() + ') dump on: ' + args.input);

// read dicom file
const dicomBuffer = fs.readFileSync(args.input, null).buffer;

// setup the dicom parser
const dicomParser = new dwv.DicomParser();
// parse the buffer
dicomParser.parse(dicomBuffer);

// dump
console.log(dicomParser.getDicomElements());

// all good
process.exit();
