DWV cli
=======

cli for the [dwv](https://github.com/ivmartel/dwv) library.

```bash
Usage: main -i [str] [-d] [-r [str] -o [str]]

Options:
  -i, --input    Input dicom file name                                [required]
  -o, --output   Output dicom file name
  -r, --rules    Writing rules file name
  -d, --dump     Parse and dump content to output stream               [boolean]
  -v, --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  main -i data.dcm -d                       Dump the content of the input DICOM
                                            file.
  main -i data.dcm -r rules.json -o out.dc  Write back the input DICOM file usin
  m                                         g the input fules file.
```