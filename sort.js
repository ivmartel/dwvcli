import dwv from 'dwv';
import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';

const _yargs = yargs();
_yargs.usage('Usage: $0 -i [str] [-m]')
  .example([
    [
      '$0 -i data.dcm',
      'Move thie input file into a folder named after its Series Instance UID.'
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
  .check(argv => {
    // check that files do exist
    if (!fs.existsSync(argv.input)) {
      throw new Error('Input DICOM file does not exist.');
    }
    if (fs.lstatSync(argv.input).isDirectory() ) {
      throw new Error('Input file is a directory.');
    }
    return true;
  });
const args = _yargs.parse(hideBin(process.argv));

// console.log('> Running dwv (v' +
//   dwv.getDwvVersion() + ') sort on: ' + args.input);

// read dicom file
const dicomBuffer = fs.readFileSync(args.input, null).buffer;

// setup the dicom parser
const dicomParser = new dwv.DicomParser();
// parse the buffer
dicomParser.parse(dicomBuffer);

const elements = dicomParser.getDicomElements()
// https://dicom.innolitics.com/ciods/ct-image/general-series/0020000e
const seriesUidElement = elements['0020000E'];
if (typeof seriesUidElement === 'undefined') {
  throw new Error('Series Instance UID is undefined.');
}

// dir based on Series UID
const inputDirname = path.dirname(args.input);
const dir = inputDirname + '/' + seriesUidElement.value[0];
// create dir if not present
if (!fs.existsSync(dir)){
  fs.mkdirSync(dir);
}
// file names
const inputFilename = path.basename(args.input);
const dest = dir + '/' + inputFilename;
const errorCb = (error) => {
  console.log('Error: ', error);
};
// move or copy
if (args.move) {
  fs.rename(args.input, dest, errorCb);
} else {
  fs.copyFile(args.input, dest, errorCb);
}

// all good
process.exit();
