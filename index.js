const fs = require('fs');
const path = require('path');

//  Process arguments -------------------------------------------------------------------------------------------------------------------

const args = {};
process.argv.slice(2).forEach(arg => {

  const current = arg.split('=');
  switch (current[0]) {
    case ('-a'):
    case ('--all'):
      current[0] = 'all'; break;
    case ('-d'):
    case ('--dirs'):
    case ('--directories'):
      current[0] = 'dirs'; break;
    case ('-h'):
    case ('--help'):
      current[0] = 'help'; break;
    case ('-f'):
    case ('--filetype'):
      current[0] = 'filetype'; break;
    case ('-p'):
    case ('--prefix'):
      current[0] = 'prefix'; break;
    case ('-ph'):
    case ('--path'):
      current[0] = 'path'; break;
    case ('-r'):
    case ('--remove'):
      current[0] = 'remove'; break;
    case ('-s'):
    case ('--silent'):
      current[0] = 'silent'; break;
    case ('-t'):
    case ('--test'):
      current[0] = 'test'; break;
  }
  args[current[0]] = current[1] || null;
});

//  Help --------------------------------------------------------------------------------------------------------------------------------

if (args.hasOwnProperty('help')) {
  console.log(`
File prefix generator 1.0 by tomcat^mwi

Usage:
prefix --prefix=<prefix> [--path=<path>] [---filetype=<filetype>] [--all] [--remove] [--silent]

Parameters:

-a, --all                   Add the prefix also to files which already have it
-d, --dirs, --directories   Include directories
-h, --help                  Display this help text
-f, --filetype              Comma-separated list of file extension to process. If omitted, all files will be processed.                    
                            Some shortcuts:
                              img, image, images: Image files (gif, jpg, jpeg, png, jfif, webp, bmp, svg, ai, eps)
                              video, videos: Video files (doc, odt, html, txt, text, pdf)
                              audio, audios: Audio files (mp3, wav, ogg)
                              *: all files (same as to omit the argument)
-p, --prefix                The prefix to add
-ph, --path                 Path to process (ie. /home/myself/whatever/). Default is the current path.
-r, --remove                Don't add but remove the specified prefix, where exists
-s, --silent                Silent mode, don't display messages
-t, --test                  Test run only: don't actually rename files
`);
  process.exit();
}

//  Verify command line args ---------------------------------------------------------------------------------------------------------

//  Verify prefix
if (!args.hasOwnProperty('prefix') || !args.prefix) {
  console.error('No prefix was specified. Use: prefix=<prefix>');
  process.exit();
}

//  Verify if specified path exists
if (args.hasOwnProperty('path') && !fs.existsSync(args.path)) {
  console.error(`The specified path doesn't exist.`);
  process.exit();
}

const prefix = args.prefix;

//  Process filetype list ------------------------------------------------------------------------------------------------------------

let files = [];

args.filetype
  .trim()
  .split(',')
  .forEach(filetype => {
    switch (filetype.trim()) {
      case ('img'):
      case ('image'):
      case ('images'):
        files = files.concat(['gif', 'jpg', 'jpeg', 'png', 'jfif', 'webp', 'bmp', 'svg', 'ai', 'eps']);
        break;
      case ('video'):
      case ('videos'):
        files = files.concat(['mp4', 'avi', 'mpg', 'webm', 'vfw', 'mov']);
        break;
      case ('audio'):
      case ('audios'):
      case ('music'):
      case ('musics'):
        files = files.concat(['mp3', 'wav', 'ogg']);
        break;
      case ('documents'):
      case ('docs'):
      case ('document'):
      case ('documents'):
        files = files.concat(['doc', 'odt', 'txt', 'pdf', 'html', 'text']);
        break;
      case ('undefined'):
      case ('*'):
      case (''):
        files.push('*'); break;
      default:
        files.push(filetype.toLowerCase().replace(/\./igm, ''))
    }
  });

//  Get file list ---------------------------------------------------------------------------------------------------------------------

const dirname = args.path || __dirname;

const filelist = fs.readdirSync(dirname, { encoding: 'utf8', withFileTypes: true })
  .filter(x => args.hasOwnProperty('dirs') || !x.isDirectory())
  .filter(x => files.includes('*') || x.isDirectory() || files.includes(x.name.substr(x.name.lastIndexOf('.') + 1, x.length).toLowerCase()))
  .map(x => x.name)
  .filter(x =>
    (!args.hasOwnProperty('remove') && (args.hasOwnProperty('all') || x.substr(0, prefix.length) !== prefix)) ||
    ((args.hasOwnProperty('remove')) && x.substr(0, prefix.length) === prefix)
  );

if (!filelist || !filelist.length) {
  console.error('No files were found to process.');
  process.exit();
}

//  Create spacing for tidy file list in console output -------------------------------------------------------------------------------
let longest = 0;
const max_length = 35;

if (!args.hasOwnProperty('silent')) {
  filelist.forEach(filename => {
    if (filename.length > longest)
      longest = filename.length;
  });
  longest += String(args.path || '.').length;
  if (longest > max_length) longest = max_length;
}

if (!args.hasOwnProperty('silent'))
  console.log(`Processing directory: "${dirname}"\n`);


//  Iterate file list and do the job --------------------------------------------------------------------------------------------------
filelist.forEach(filename => {
  const new_filename = args.hasOwnProperty('remove') ? filename.replace(new RegExp(prefix, 'igm'), '') : args.prefix + filename;

  //  Rename files
  if (!args.hasOwnProperty('test')) {
    fs.renameSync(path.join(dirname, filename), path.join(dirname, new_filename));
  }

  //  Console output
  if (!args.hasOwnProperty('silent')) {

    let filenameOutput = filename;
    if (filenameOutput.length > max_length)
      filenameOutput = filenameOutput.substr(0, max_length - 3) + '...';
    filenameOutput = (`"${filenameOutput}"`).padEnd(longest + 3, ' ');

    let newFilenameOutput = new_filename;
    if (newFilenameOutput.length > max_length - 3)
      newFilenameOutput = newFilenameOutput.substr(0, max_length) + '...';

    console.log(`${filenameOutput} => "${newFilenameOutput}"`);
  }

});

if (args.hasOwnProperty('test') && (!args.hasOwnProperty('silent')))
  console.log('\nThis was a test run. No files were renamed.');
