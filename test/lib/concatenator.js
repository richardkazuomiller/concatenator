var assert = require('power-assert');
var mockery = require('mockery');
var sinon = require('sinon');
var fs = require('fs');

describe('Concatenator',function(){
  beforeEach(function(){
    var Concatenator = require('../../lib/concatenator.js');
    this.concatenator = new Concatenator();
  })
  describe('#concat_dirs',function(){
    it('should call the callback with default retval',function(done){
      var mycb = function(){};
      var myoptions = {};
      sinon.stub(this.concatenator,'concat_dirs_cb',function(index,options,cb,retval){
        assert(index == 0);
        assert(options == myoptions)
        assert(cb = mycb);
        assert(retval.arr)
        assert(retval.string == '');
        assert(retval.obj);
        done();
      })
      this.concatenator.concat_dirs(myoptions,mycb);
    })
  })
  describe('#concat_dirs_callback',function(done){
    it('should concatenate all the directories',function(done){
      var options = {
        dirs : [
          {
            path : 'hoge'
          },
          {
            path : 'piyo'
          }
        ]
      }
      sinon.stub(this.concatenator,'concat_dir',function(dir,options,cb){
        if(dir == 'hoge'){
          cb(null,{
            arr : ['hoge'],
            obj : {
              'foo' : 'hoge'
            },
            string : 'hoge\n'
          })
        }
        else if(dir == 'piyo'){
          cb(null,{
            arr : ['derp','piyo'],
            obj : {
              'foo' : 'piyo',
              'bar' : 'derp'
            },
            string : 'derp\npiyo\n'
          })
        }
      })
      this.concatenator.concat_dirs(options,function(err,data){
        assert(data.arr[0] == 'hoge');
        assert(data.arr[1] == 'derp');
        assert(data.arr[2] == 'piyo');
        assert(data.obj.foo == 'piyo');
        assert(data.obj.bar == 'derp');
        assert(data.string == 'hoge\nderp\npiyo\n')
        done();
      })
    })
  });
  describe('#concat_dir',function(){
    it('should readdir the specified directory',function(done){
      var self = this;
      sinon.stub(this.concatenator,'readdir',function(dir,callback){
        callback(null,['file1.js','file2.js'])
      });
      sinon.stub(this.concatenator,'readFile',function(path,enc,cb){
        cb = cb||enc
        if(path == './foobar/file1.js'){
          cb(null,'console.log(hoge);');
          return;
        }
        if(path == './foobar/file2.js'){
          cb(null,'console.log(piyo);');
          return;
        }
      });

      this.concatenator.concat_dir('./foobar',function(err,data){
        assert(self.concatenator.readdir.calledWith('./foobar'))
        assert(data.obj['file1.js'] == 'console.log(hoge);');
        assert(data.obj['file2.js'] == 'console.log(piyo);');
        assert(data.arr.join('\n') == 'console.log(hoge);\nconsole.log(piyo);')
        self.concatenator.readdir.restore();
        done();
      });
    });
    it('should callback with an error if there is an I/O error in readdir',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb('piyo');
      });
      this.concatenator.concat_dir('./derp',function(err,data){
        assert(err == 'piyo');
        done();
      })
    })
    it('should callback with an error if there is an I/O error in readFile',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb(null,['file1','file2']);
      });
      sinon.stub(this.concatenator,'readFile',function(){
        var cb = arguments[arguments.length-1];
        cb('hoge');
      });
      this.concatenator.concat_dir('./derp',function(err,data){
        assert(err == 'hoge');
        done();
      })
    })
    it('should skip files that start with "."',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb(null,['file1','.hoge']);
      });
      sinon.stub(this.concatenator,'readFile',function(){
        var cb = arguments[arguments.length-1];
        cb(null,'hoge');
      });
      this.concatenator.concat_dir('./derp',function(err,data){
        assert(data.obj.file1 == 'hoge');
        assert(typeof data.obj['.hoge'] == 'undefined');
        done();
      })
    })
    it('should skip files in options.exclude',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb(null,['file1','file2']);
      });
      sinon.stub(this.concatenator,'readFile',function(){
        var cb = arguments[arguments.length-1];
        cb(null,'hoge');
      });
      this.concatenator.concat_dir('./derp',{exclude:'file2'},function(err,data){
        assert(data.obj.file1 == 'hoge');
        assert(typeof data.obj['file2'] == 'undefined');
        done();
      })
    })
    it('should reorder files based on priority',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb(null,['file1','file2','file3','file4','file5','file6']);
      });
      sinon.stub(this.concatenator,'readFile',function(){
        var segs = arguments[0].split('/');
        var retval = segs[segs.length-1];
        var cb = arguments[arguments.length-1];
        cb(null,retval);
      });
      var options = {
        file_priorities : [
          'file3',
          'file2',
          'file4',
        ]
      }
      this.concatenator.concat_dir('./derp',options,function(err,data){
        assert(data.arr[0] == 'file3');
        assert(data.arr[1] == 'file2');
        assert(data.arr[2] == 'file4');
        assert(data.arr[3] == 'file1');
        assert(data.arr[4] == 'file5');
        assert(data.arr[5] == 'file6');
        done();
      })
    })
    it('should return an error if you add a not found file to the file_priorities',function(done){
      sinon.stub(this.concatenator,'readdir',function(){
        var cb = arguments[arguments.length-1];
        cb(null,[]);
      });
      sinon.stub(this.concatenator,'readFile',function(){
        if(arguments[0] == 'notfound'){
          cb('this is an error');
        }
      });
      var options = {
        file_priorities : [
          'notfound'
        ]
      }
      this.concatenator.concat_dir('./derp',options,function(err,data){
        assert(err.message == 'A file in file_priorities does not exist');
        done();
      })
    });
  })
  describe('#readdir',function(){
    it('should call readdir and give its callback',function(done){
      sinon.stub(fs,'readdir',function(dir,callback){
        callback('hogehoge');
      })
      this.concatenator.readdir('./hoge',function(data){
        assert(data == 'hogehoge');
        fs.readdir.restore();
        done();
      })
    });
  })
  describe('#readFile',function(){
    it('should call readFile and give its callback',function(done){
      sinon.stub(fs,'readFile',function(dir,callback){
        callback('hogehoge');
      })
      this.concatenator.readFile('./hoge',function(data){
        assert(data == 'hogehoge');
        fs.readFile.restore();
        done();
      })
    });
  })
})
