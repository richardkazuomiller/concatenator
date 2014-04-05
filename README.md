#Concatenator

Concatenates the contents of a directory. This is useful for loading frontend JavaScript files, html templates, or any other group of files in a directory.

##concatenator.concat_dir(path,options,callback)

Concatenates all of the contents of a path asynchronously.

path `String`

The path of the directory

options `Object`

- file_priorites `Array` By default files will be loaded in whatever order fs.readdir will list them. Files in this array will be loaded before others
- exclude `Array` Files to be ignored

callback `Function` The callback is passed two arguments (err, data), where data is the contents represented as an object, string, and array


	var Concatenator = require('concatenator');
	var concatenator = new Concatenator();

	var options = {
	  file_priorities : [
	  	'file3' //make sure file3 is loaded before everything else
	  ]
    }

	concatenator.concat_dir('./dirname',options,function(err,data){
	  console.log(data); /*
	    {
	      obj: {
          file3: 'contents of file3\n',
          file1: 'contents of file1\n',
          file2: 'contents of file2\n'
        },
        arr: [
          'contents of file3\n',
          'contents of file1\n',
          'contents of file2\n'
        ],
        string: 'contents of file3\n\ncontents of file1\n\ncontents of file2\n'
      }
	  */
	})


##concatenator.concat_dirs(options,callback)

options `Object`

- dirs `Array` directories to be concatenated. Example:

<!---->

	{
	  dirs : [
	  	{
	  	  path : 'dir1',
	  	  file_priorities : []
	  	},
	  	{
	  	  path : 'dir2',
	  	  file_priorities : []
	  	}
  	  ]
  	}

##Tests

Use `npm test` to run tests and see coverage to see test coverage.

Mocha and Istanbul need to be installed globally

`npm install mocha istanbul -g`
