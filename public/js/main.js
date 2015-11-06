'use strict';
/* global angular*/
/* import 'custom' from '../db/db.json';*/
const config = require('./public/db/config.json');
const remote = require('remote');
const Menu = remote.require('menu');
const MenuItem = remote.require('menu-item');
const Project = require('Project.js');
// const lastItem = false;
const navContext = new Menu();
const app = angular.module('mouse', []);
const ipc = require('ipc');
const fs = require('fs');
const path = require('path');

Notification.requestPermission();

app.controller('NavCtrl', ['$scope', '$rootScope', ($scope, $rootScope) => {
	$scope.choose = project => $rootScope.$emit('projects', project);
	$scope.projects = [];

	const scanner = _paths => {
		if (!config.paths) {
			config.paths = _paths;
			fs.writeFile('./public/db/config.json', JSON.stringify(config, null, 4));
		}
		$scope.projects = [];
		config.paths.forEach(_path => {
			fs.readdir(_path, (err, __projects) => {
				if (err) {
					console.error(err);
					return false;
				}

				__projects.forEach(dirname => {
					if (fs.lstatSync(path.join(_path, dirname)).isFile()) {
						return false;
					}
					$scope.projects.push(new Project(_path, dirname));
					$scope.$apply();
				});
			});
		});
	};

	if (config.paths) {
		scanner(config.paths);
	}
	ipc.on('dirChange', scanner);
}]);

app.controller('ContentCtrl', ['$scope', '$rootScope', ($scope, $rootScope) => {
	$rootScope.$on('projects', (event, project) => $scope.project = project);
}]);

app.controller('TopBarCtrl', ['$scope', $scope => {
	$scope.dirChange = () => ipc.send('dirChange');
	$scope.openOptions = () => ipc.send('openOptions');
}]);

app.controller('OptionsCtrl', ['$scope', $scope => {
	$scope.config = config;
	$scope.addPath = () => {
		ipc.send('dirChange');
		ipc.on('dirChange', dirs => {
			config.paths = config.paths.concat(dirs);
			fs.writeFile('./public/db/config.json', JSON.stringify(config, null, 4));
			// l = null;
			$scope.$apply();
		});
	};
	$scope.removePath = index => {
		config.paths.splice(index, 1);
		fs.writeFile('./public/db/config.json', JSON.stringify(config, null, 4));
	};
}]);

/**
 * Context Menu
 */
navContext.append(new MenuItem({label: 'Open in Browser', click: e => console.log(e, 'item 1 clicked')}));
navContext.append(new MenuItem({label: 'Open in Terminal', click: () => console.log('item 1 clicked')}));

window.addEventListener('contextmenu', e => {
	e.preventDefault();
	navContext.popup(remote.getCurrentWindow());
}, false);
