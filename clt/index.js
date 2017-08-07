#!/usr/bin/env node
/*
//Classes
function Game(){
	this.gStart;
	this.gEnd;
	this.players = [];
	this.deaths = [];
}

function Player(id){
	this.id = id;
	this.name;
	this.kill_amount;
	this.set_name = function(name){
		this.name = name;
	}
	this.set_kill_amount = function(kills){
		this.kill_amount = kills;
	}
}*/

/**
 * Modules and dependencies
 */

var co = require('co');
var prompt = require('co-prompt');
var program = require('commander');
var fs = require('fs');
var request = require('request');
var FileStore = require('fs-store').FileStore;
var my_store = new FileStore({filename: 'games-info.json', max_backups: 1});
var Storage = require('node-storage');
var store = new Storage('log.json');
var game_config = require('game-config');

/**
 * Read the server log file by some path
 */

function read_file () {
	var file;
	if (program.file) {
		file = program.file;
		parse_logs(file);
	} else {
		co(function *() {
			file = yield prompt('File_path: ');
			parse_logs(file);
		});
	}
}

/**
 * Save in json file the parsed game logs
 */

function parse_logs (file) {
	game_config.read_path(file);
	var games = my_store.get('games');
	//console.log(games);
	store.put('games', games);
}

/**
 * Creates an array with descriptions about the games
 *  Each game contains:
 *		-start and end game events
 *		-players name
 *		-total kills by players
 *		-total number of kills
 */
//See return
function summary() {
	var kills, msg, games = my_store.get('games');
	for (var gp in games) {
		msg = "Game started at " + games[gp].gStart;
		console.log(msg);
		for (var pp in games[gp].players) {
			msg = " player: " + games[gp].players[pp].name;
			msg += "\n\tkills: ";
			msg += games[gp].players[pp].kill_amount;
			console.log(msg);
		}
		msg = "\nTotal kills: " + games[gp].total_kills + "\n\n";
		msg += "Game finished at " + games[gp].gEnd + "\n";
		console.log(msg);
	}
}

/**
 * Creates an array of players in descending order
 */

function ranking() {
	var games = my_store.get('games'), msg, username, enemy, cause, killsQ;
	var players = [], players_name = [], playersKills = [];
	for (var gp in games) {
		for (var pp in games[gp].players) {
			username = games[gp].players[pp].name;
			user_pos = players_name.indexOf(username);
			if (user_pos < 0) {
				players_name.push(username);
				games[gp].players[pp].kills = [];
				players.push(games[gp].players[pp]);
			} else {
				killsQ = games[gp].players[pp].kill_amount;
				players[user_pos].kill_amount += killsQ;
			}
		}
		for (var dp in games[gp].deaths) {
			username = games[gp].deaths[dp].key;
			enemy = games[gp].deaths[dp].value[0];
			cause = games[gp].deaths[dp].value[1];
			if (username != 1022) {
				if (username == enemy) continue;
				msg = username + " killed the player " + enemy;
				msg += " with the " + cause;
				user_pos = players_name.indexOf(username);
			} else {
				msg = enemy;
				msg += " died because was hurt and fell of a cliff.";
				user_pos = enemy; continue;
			}
			players[user_pos].kills.push(msg);
		}
	}
	players = players.sort(function (a,b) {
		return b.kill_amount - a.kill_amount;
	});
	if (program.view === 'see') {
		players.forEach(function (player) {
			msg = "player: " + player.name + "\n";
			msg += "Total kills: " + player.kill_amount; + "\n";
			console.log(msg);
			player.kills.forEach(function (msg) {
				console.log("\t" + msg);
			})
		});
	}
	return players;
}

/**
 * Post the ranking by http post protocol
 */

function post() {
	var url, rank;
	if (program.url) {
		url = program.url;
	} else {
		console.log('You need use -u or --url.');
		return;
	}
	rank = ranking();
	request.post(url, rank, function (err, response, body) {
		if (err) {
			console.log("Upload failed: " + err);
		} else {
			console.log('\tUpload successful.');
		}
	});
}

/**
* Save files
*/

function save(data) {
	var path, filename, dataToSend;
	if (program.save) {
		filename = program.save;
	} else {
		console.log('You need use -n or --name and write a filename.');
		return;
	}
	dataToSend = JSON.stringify(data);
	path = __dirname + "\\saved\\";
	fs.writeFile(path + filename, dataToSend, function (err) {
		if (err) throw err;
		console.log('Saved in: \\saved\\' + filename);
	})
}

/**
 * Test a user interaction with the prompt
 */

function test() {
	console.log('Command Line Tool by Maurício Júnior - 2017');
}

/**
 * Commander utilities
 */

program
.arguments('<command>')
.option('-f, --file <file>','The game logs text file.')
.option('-s, --save <save>','Save the summary or ranking.')
.option('-n, --name <name>','Name a file to be saved.')
.option('-u, --url <url>', 'Send a post to an url.')
.option('-v, --view <view>', 'View returned data.' )
.action(function (command) {
	// Executes a function by user input
	function call_function (callback) {
		var bool=true, data = callback();
		switch (bool) {
			case (program.save != null): {
				save(data);
				break;
			}
			default:
				break;
		}
	}

	switch (command) {
		case 'nread':
			call_function(read_file);
			break;
		case 'summary':
			call_function(summary);
			break;
		case 'ranking':
			call_function(ranking);
			break;
		case 'post':
			call_function(post);
			break;
		case 'test':
			call_function(test);
			break;
		default:
			call_function(test);
			break;
	}
})
.parse(process.argv);
