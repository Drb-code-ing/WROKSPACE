import path from 'path'

console.log(process.cwd())// E:\WROKSPACE\backend\path_fs
console.log(path.dirname(process.cwd()))// E:\WROKSPACE\backend
console.log(path.dirname('a/b/c'))// a\b

console.log(path.basename('a/b/c.js'))// c.js
console.log(path.basename('a/b/c.js', '.js'))// c
console.log(path.basename('a/b/c.js', 'js'))// c
console.log(path.basename('a/b/c.js', 's'))// c.js

console.log(path.normalize('a/b//c/d/e/..'))// a\b\c\d
console.log(path.extname('a/b/c.js'))// .js

console.log(path.parse('home/user/dir/file.txt'))