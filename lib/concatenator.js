var fs = require('fs');

var Concatenator = function(){};

Concatenator.prototype.readdir = function(dir,callback){
  return fs.readdir(dir,callback);
}

Concatenator.prototype.readFile = function(path,enc,cb){
  return fs.readFile.apply(fs,arguments);
}

Concatenator.prototype.concat_dirs = function(options,cb){
  var retval = {
    obj : {},
    string : '',
    arr : []
  };
  this.concat_dirs_cb(0,options,cb,retval);
}

Concatenator.prototype.concat_dirs_cb = function(index,options,cb,retval){
  if(index >= options.dirs.length){
    cb(null,retval);
    return;
  }
  var self = this;
  var dir = options.dirs[index];
  this.concat_dir(dir.path,dir,function(err,data){
    for(var i in data.obj){
      retval.obj[i] = data.obj[i];
    }
    retval.arr = retval.arr.concat(data.arr);
    retval.string += data.string;
    self.concat_dirs_cb(index+1,options,cb,retval);
  })
}

Concatenator.prototype.concat_dir = function(dir,options,cb){
  var self = this;
  if(!cb){
    cb = options;
    options = {};
  }
  if(typeof options.exclude == 'string'){
    options.exclude = [options.exclude];
  }
  var file_priorities = options.file_priorities||[];
  var templates = {};
  var string = '';
  this.readdir(dir,function(err,files){
    if (err){
      cb(err);
      return;
    }
    var c=0;
    for(var j = file_priorities.length-1; j >= 0; j--){
      var path = file_priorities[j];
      var index = files.indexOf(path);
      if(index == -1){
        cb(new Error('A file in file_priorities does not exist'));
        return;
      }
      files.splice(index,1);
      files.unshift(path);
    }
    self.concat_dir_cb(dir,options,cb,files,0);
  });
}

Concatenator.prototype.concat_dir_cb = function(dir,options,cb,files,index,retval){
  var self = this;
  retval = retval||{};
  retval.obj = retval.obj||{};
  retval.arr = retval.arr||[];
  if(index >= files.length){
    retval.string = retval.arr.join('\n');
    cb(null,retval);
    return;
  }
  var file = files[index];
  if(file.indexOf('.') == 0){
    this.concat_dir_cb(dir,options,cb,files,index+1,retval);
    return;
  }
  var fullpath = [dir,file].join('/').split('//').join('/');
  self.readFile(fullpath,'utf-8',function(err,html){
    if (err){
      cb(err,null);return;
    }
    if(!options.exclude || options.exclude.indexOf(file) == -1){
      retval.arr.push(html);
      retval.obj[file.replace('.html','')]=html;
    }
    self.concat_dir_cb(dir,options,cb,files,index+1,retval);
  });
}

module.exports = Concatenator;
