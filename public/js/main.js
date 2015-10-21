'use strict';
/*import 'custom' from '../db/db.json';*/
console.log(__dirname);
let custom = require('./public/db/db.json');
let config = require('./public/db/config.json');

let app = angular.module('mouse',[]);
let ipc = require('ipc');
let fs = require('fs');
let path = require('path');

app.controller('NavCtrl', ['$scope','$rootScope', function($scope,$rootScope){
	$scope.projects = custom;
	$scope.choose = (project) => $rootScope.$emit('projects', project);

	$scope.projects = [];


	let scanner = (path)=>{
		if (!config.path) {
			config.path = path[0]
			fs.writeFile('./public/db/config.json', JSON.stringify(config,null,4));
		}
		fs.readdir(config.path,(err,arr)=>{
			arr.forEach((dirname)=>{
				$scope.projects.push(new Project(config.path, dirname));
				$scope.$apply();
			})
		})
	}

	if (config.path) {scanner(config.path)}
	ipc.on('dirChange',scanner);
}]);

app.controller('ContentCtrl', ['$scope','$rootScope',function($scope,$rootScope){
	$rootScope.$on('projects', (event,project) => $scope.project = project);
}]);

app.controller('TopBarCtrl', ['$scope', function($scope){
	$scope.dirChange = ()=> ipc.send('dirChange');
}])




class Project{
	constructor(p, name){
		this.checker = [this.nodeChecker.bind(this), this.cppChecker.bind(this), this.bowerChecker.bind(this)]
		this.path = path.join(p,name)
		this.name = name
		this.indicat()
	}
	indicat(){
		fs.readdir(this.path, (err,content)=> {
			this.checker.forEach((check)=>{
				console.log(this)
				check(content)
			})
		})
	}
	nodeChecker(content){
		if (content.indexOf('package.json')) {
			this.node = require(path.join(this.path, 'package.json'));
		}
	}
	bowerChecker(content){
		if (content.indexOf('bower.json')) {
			this.bower = require(path.join(this.path, 'bower.json'));
		}
	}
	cppChecker(content){

	}
	gitChecker(content){
		if (content.indexOf('.git')) {
			this.bower = require(path.join(this.path, 'bower.json'));
		}
	}
}



/**
 * ELECTRON
 */
