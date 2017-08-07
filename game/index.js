#!/usr/bin/env node

/**
 * Classes Game and players
 */

function Game() {
	this.gStart;
	this.gEnd;
	this.players = [];
	this.deaths = [];
	this.total_kills = 0;
}

function Player(id) {
	this.id = id;
	this.name;
	this.kill_amount;
	this.set_name = function (name) {
		this.name = name;
	}
	this.set_kill_amount = function (kills) {
		this.kill_amount = kills;
	}
}

/**
 * Modules and dependencies
 */

var fs = require('fs');
var FileStore = require('fs-store').FileStore;
var myStore = new FileStore({filename: 'games-info.json',max_backups: 1});
var games = [];

/**
 * exports / module.exports
 */

exports = module.exports = {
    read_path: function (path) {
        var text, ipos, sipos, epos, num_players;
        var i=ipos, cpos, pcpos, kpos, line, count, end, id, name;
        fs.readFile(path, function (err, logData) {
    		//Case someone error occurs
    		if (err) throw err;
    		text = logData.toString();

            while (1) {
    			var	game = new Game();
    			ipos = text.indexOf('InitGame');
    			if (ipos < 0) break;
    			sipos = text.indexOf('InitGame', ipos + 1);
    			game.gStart = text.slice(ipos - 6, ipos - 1);
    			epos = text.indexOf('ShutdownGame');
    			if (epos > sipos && sipos > 0) {
    				epos = sipos - 8;
    				game.gEnd = "ShutdownGame keyword not structed";
    			} else if (epos < 0) {
    				game.gEnd = "ShutdownGame keyword missing";
    			} else {
    				game.gEnd = text.slice(epos - 6, epos - 1);
    			}
    			if (ipos + epos == -2) {
    				break;
    			}
    			cpos = pcpos = kpos = ipos;
                // Variables to second loop
    			num_players = [];
    			// Getting matcher's players
    			while (1) {
    				cpos = text.indexOf('ClientConnect', cpos + 1);
    				pcpos = text.indexOf('ClientUserinfoChanged', pcpos + 1);
    				kpos = text.indexOf('Kill', kpos + 1);

                    // End of informations to a game
                    if ((cpos > epos && pcpos > epos && kpos > epos) || cpos + pcpos + kpos == -3) {
                        for(var i=0, key, username; i<game.players.length; i++){
    						count = 0;
    						for(var p in game.deaths){
    							key = game.deaths[p].key;
    							username = game.players[i].name;
    							if(key == username){
    								count++;
    							}
    							if(key == 1022){
    								if(username == game.deaths[p].value[1]){
    									count--;
    									game.deaths.split(p,1);
    								}
    							}
    						}
    						game.players[i].set_kill_amount(count);
    					}
                        //console.log('near end', game.gStart);
                        games.push(game);
                        console.log(games.length);
                        console.log(games);
                        break;
                    }
                    //Create a new player by a id
                    if (cpos > 0 && cpos < epos) {
    					cpos += 15;
    					end = text.indexOf('\n', cpos);
    					id = parseInt(text.slice(cpos, end));
    					if (num_players.indexOf(id) < 0) {
    						var player = new Player(id);
    						num_players.push(id);
    						game.players.push(player);
    					}
    				}
                    if (pcpos > 0 && pcpos < epos) {
    					pcpos += 23;
    					end = text.indexOf(' ', pcpos);
    					id = text.slice(pcpos, end);
                        var endName = text.indexOf("\\", end + 3);
    					name = text.slice(end+3, endName);
    					for (var pp in game.players) {
    						if (game.players[pp].id == id) {
    							game.players[pp].set_name(name);
    						}
    					}
    				}
                    if (kpos > 0 && kpos < epos) {
    					var killer, died, cause, killer_pos, died_pos;
    					game.total_kills++;
    					kpos += 6;
    					line = text.slice(kpos, text.indexOf('\n', kpos));
    					line = line.split(" ", 3);
    					killer = parseInt(line[0]);
    					died = parseInt(line[1]);
    					cause = parseInt(line[2].slice(0,-1));
                        if (killer != 1022) {
    						killer_pos = num_players.indexOf(killer);
                            killer = game.players[killer_pos].name;
                        }
	                    died_pos = num_players.indexOf(died);
	                    died = game.players[died_pos].name;
						game.deaths.push({
							key: killer,
							value: [died, cause]
						});
    				}
    			} // End of second while
    			text = text.slice(text.indexOf('\n', epos)+1);
    		} // End of first while
    		myStore.set('games',games);
    		return games;
    	});
    },
    test : function(){
    	return "Game config: parser to store Quake 3 Server log files.";
    }
};
