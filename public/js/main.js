'use strict';
/*import 'custom' from '../db/db.json';*/
console.log(__dirname);
let custom = require('./public/db/db.json');
let config = require('./public/db/config.json');
let gitlog = require('gitlog');
let gitstate = require('git-state');

let remote = require('remote');
let Menu = remote.require('menu');
let MenuItem = remote.require('menu-item');

let lastItem = false;

let navContext = new Menu();
let app = angular.module('mouse',[]);
let ipc = require('ipc');
let fs = require('fs');
let path = require('path');

Notification.requestPermission();


app.controller('NavCtrl', ['$scope','$rootScope', function($scope,$rootScope){

	$scope.choose = (project) => $rootScope.$emit('projects', project);
	$scope.projects = [];

	let scanner = (_paths)=>{
		if (!config.paths) {
			config.paths = _paths
			fs.writeFile('./public/db/config.json', JSON.stringify(config,null,4));
		}
		$scope.projects = [];
			config.paths.forEach((_path)=>{
				fs.readdir(_path,(err,__projects)=>{
					if (err) {console.error(err); return false}

					__projects.forEach((dirname)=>{
						if (fs.lstatSync(path.join(_path, dirname)).isFile()) return false;
						$scope.projects.push(new Project(_path, dirname));
						$scope.$apply();
					})
				})
			})
	}

	if (config.paths) {scanner(config.paths)}
	ipc.on('dirChange',scanner);
}]);

app.controller('ContentCtrl', ['$scope','$rootScope',($scope,$rootScope)=>{
	$rootScope.$on('projects', (event,project) => $scope.project = project);
}]);

app.controller('TopBarCtrl', ['$scope', ($scope)=>{
	$scope.dirChange = () => ipc.send('dirChange');
	$scope.openOptions = () => ipc.send('openOptions');
}]);

app.controller('OptionsCtrl', ['$scope', ($scope)=>{
	$scope.config = config;
	$scope.addPath = ()=>{
		ipc.send('dirChange')
		let l = ipc.on('dirChange' , (dirs)=>{
			config.paths = config.paths.concat(dirs);
			fs.writeFile('./public/db/config.json', JSON.stringify(config,null,4));
			l = null
			$scope.$apply()
		})
	}
	$scope.removePath = (index)=>{
		config.paths.splice(index,1)
		fs.writeFile('./public/db/config.json', JSON.stringify(config,null,4));
	}
}])

/**
 * Context Menu
 */
navContext.append(new MenuItem({ label: 'Open in Browser', click: (e)=> { console.log(e,'item 1 clicked'); } }));
navContext.append(new MenuItem({ label: 'Open in Terminal', click: ()=> { console.log('item 1 clicked'); } }));

window.addEventListener('contextmenu', function (e) {
	console.log(e.target.dataset)
  e.preventDefault();
  navContext.popup(remote.getCurrentWindow());
}, false);


// var notify = new Notification('title', { body: 'body', icon: 'assets/icon.png' });

class Project{
	constructor(p, name){
		this.checker = [this.nodeChecker.bind(this), this.cppChecker.bind(this), this.bowerChecker.bind(this), this.gitChecker.bind(this)]
		this.path = path.join(p,name)
		this.name = name
		this.files = []
		this.indicat()
		console.log(this)
	}
	indicat(){
		fs.readdir(this.path, (err,content)=> {
			this.checker.forEach((check)=>{
				check(content)
			})
			content.forEach((file)=>{
				fs.stat(path.join(this.path,file),(err,status)=>{
					if (err) return false;
					if (status.isDirectory()) this.files.push({[file]:[]})
					if (status.isFile()) this.files.push(file)
				})
			})
		})
	}
	nodeChecker(content){
		fs.stat(path.join(this.path, 'package.json'),(err,data)=>{
			if (err) return false;
			this.node = require(path.join(this.path, 'package.json'));
		});
	}
	bowerChecker(content){
		fs.stat(path.join(this.path, 'bower.json'),(err,data)=>{
			if (err) return false;
			this.bower = require(path.join(this.path, 'bower.json'));
			fs.watch(path.join(this.path, 'bower.json'), ()=>{
				this.bower = require(path.join(this.path, 'bower.json'));
				new Notification(`PM2 --${this.name} -- Bower`, {body: 'Bower added new Dependencies' , icon : 'icon.png'})
			})
		});
	}
	cppChecker(content){

	}
	gitChecker(content){
		fs.stat(path.join(this.path, '.git'), (err,data)=>{
			if (err) return false;
			this.git = {
				commits : [],
				status : {}
			};
			gitlog({repo: path.join(this.path, '.git')},(error,commits)=>{
				this.git.commits = commits;
			});
			gitstate.check(path.join(this.path), (err,result)=>{
				this.git.status = result
			});

			// fs.watch(path.join(this.path, '.git'), (ev,file)=>{
			// 	gitstate.check(path.join(this.path),(err,result)=>{
			// 		if (this.git.status !== result) {
			// 			new Notification(`PM2 --${this.name} -- GIT`, {body: 'Git status changed' , icon : 'icon.png'})
			// 		};
			// 	})
			// });
		})
	}
}

