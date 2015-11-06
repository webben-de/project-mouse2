/* global require*/
/* eslint global-require:0*/

const path = require('path');
const fs = require('fs');
const gitlog = require('gitlog');
const gitstate = require('git-state');

export default class Project {
	constructor(p, name) {
		this.checker = [this.nodeChecker.bind(this), this.cppChecker.bind(this), this.bowerChecker.bind(this), this.gitChecker.bind(this)];
		this.path = path.join(p, name);
		this.name = name;
		this.files = [];
		this.indicat();
		console.log(this);
	}
	indicat() {
		fs.readdir(this.path, (err, content) => {
			if (err) {
				throw err;
			}
			this.checker.forEach(check => check(content));
			content.forEach(file => {
				fs.stat(path.join(this.path, file), (err, status) => {
					if (err) {
						return false;
					}
					if (status.isDirectory()) {
						this.files.push({[file]: []});
					}
					if (status.isFile()) {
						this.files.push(file);
					}
				});
			});
		});
	}
	nodeChecker() {
		fs.stat(path.join(this.path, 'package.json'), err => {
			if (err) {
				return false;
			}
			this.node = require(path.join(this.path, 'package.json'));
		});
	}
	bowerChecker() {
		fs.stat(path.join(this.path, 'bower.json'), err => {
			if (err) {
				return false;
			}
			this.bower = require(path.join(this.path, 'bower.json'));
			fs.watch(path.join(this.path, 'bower.json'), () => {
				this.bower = require(path.join(this.path, 'bower.json'));
				return new Notification(`PM2 --${this.name} -- Bower`, {body: 'Bower added new Dependencies', icon: 'icon.png'});
			});
		});
	}
	cppChecker() {

	}
	gitChecker() {
		fs.stat(path.join(this.path, '.git'), err => {
			if (err) {
				return false;
			}
			this.git = {
				commits: [],
				status: {}
			};
			gitlog({repo: path.join(this.path, '.git')}, (error, commits) => {
				if (error) {
					console.error(error);
				}
				this.git.commits = commits;
			});
			gitstate.check(path.join(this.path), (err, result) => {
				if (err) {
					console.error(err);
				}
				this.git.status = result;
			});

			// fs.watch(path.join(this.path, '.git'), (ev,file)=>{
			// 	gitstate.check(path.join(this.path),(err,result)=>{
			// 		if (this.git.status !== result) {
			// 			new Notification(`PM2 --${this.name} -- GIT`, {body: 'Git status changed' , icon : 'icon.png'})
			// 		};
			// 	})
			// });
		});
	}
}
