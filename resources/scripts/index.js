window.onload = function() {
	var pokeapi = "//pokeapi.co/api/v2/";
	var player1Div = "player1";
	var player2Div = "player2";
	var player1ArraySlot = 0;
	var player2ArraySlot = 1;
	var MAX_MOVES = 3;
	var TIME_BEFORE_OPPONENT_MOVES = 2000;
	var ENDGAME_TRANSITION_TIME = 10000;
	var HEALTH_MAGNIFIER = 6;

	var pokemonList = ["bulbasaur","ivysaur","venusaur","charmander","charmeleon","charizard","squirtle","wartortle","blastoise","caterpie","metapod","butterfree","weedle","kakuna","beedrill","pidgey","pidgeotto","pidgeot","rattata","raticate","spearow","fearow","ekans","arbok","pikachu","raichu","sandshrew","sandslash","nidoran-f","nidorina","nidoqueen","nidoran-m","nidorino","nidoking","clefairy","clefable","vulpix","ninetales","jigglypuff","wigglytuff","zubat","golbat","oddish","gloom","vileplume","paras","parasect","venonat","venomoth","diglett","dugtrio","meowth","persian","psyduck","golduck","mankey","primeape","growlithe","arcanine","poliwag","poliwhirl","poliwrath","abra","kadabra","alakazam","machop","machoke","machamp","bellsprout","weepinbell","victreebel","tentacool","tentacruel","geodude","graveler","golem","ponyta","rapidash","slowpoke","slowbro","magnemite","magneton","farfetchd","doduo","dodrio","seel","dewgong","grimer","muk","shellder","cloyster","gastly","haunter","gengar","onix","drowzee","hypno","krabby","kingler","voltorb","electrode","exeggcute","exeggutor","cubone","marowak","hitmonlee","hitmonchan","lickitung","koffing","weezing","rhyhorn","rhydon","chansey","tangela","kangaskhan","horsea","seadra","goldeen","seaking","staryu","starmie","mr-mime","scyther","jynx","electabuzz","magmar","pinsir","tauros","magikarp","gyarados","lapras","ditto","eevee","vaporeon","jolteon","flareon","porygon","omanyte","omastar","kabuto","kabutops","aerodactyl","snorlax","articuno","zapdos","moltres","dratini","dragonair","dragonite","mewtwo","mew","chikorita","bayleef","meganium","cyndaquil","quilava","typhlosion","totodile","croconaw","feraligatr"];
	
	var battle = {
		pokemon: [],
		turn: 0,

		switchTurn: function() {
			this.turn = (this.turn + 1) % 2;
		},
		isPlayer1Turn: function() {
			return this.turn === 0;
		},
		player1Attack: function() {
			var move = getPlayer1Attack(this.pokemon[0]);
			var moveString = "You used " + move.useString();
			setMessage(moveString);
			this.pokemon[1].loseHp(move.damage);
			drawHp(this.pokemon[1], this.pokemon[1].divId);
			if (this.pokemon[1].isDead()) {
				endgame();
			}
		},
		player2Attack: function() {
			var move = getPlayer2Attack(this.pokemon[1]);
			var moveString = "Opponent used " + move.useString();
			setMessage(moveString);
			this.pokemon[0].loseHp(move.damage);
			drawHp(this.pokemon[0], this.pokemon[0].divId);
			if (this.pokemon[0].isDead()) {
				endgame();
			}
		}
	};

	var radio = {
		intro: null,
		battle: null,
		victory: null,

		playMusic: function(music) {
			if (music) {
				this.stopAll();
				music.play();
			};
		},

		stopMusic: function(music) {
			if (music) {
				music.pause();
			};
		},

		stopAll: function() {
			this.stopMusic(this.intro);
			this.stopMusic(this.battle);
			this.stopMusic(this.victory);
		},

		init: function() {
			this.intro = new Audio('resources/audio/opening.mp3');
			this.battle = new Audio('resources/audio/battle.mp3');
			this.victory = new Audio('resources/audio/victory.mp3');
			this.intro.loop = true;
			this.battle.loop = true;
			this.victory.loop = true;
		}
	};

	function Pokemon(name, hp, imageUrl, moves, divId) {
		this.name = name;
		this.maxHp = hp;
		this.hp = hp;
		this.imageUrl = imageUrl;
		this.moves = moves;
		this.divId = divId;

		this.loseHp = function(amount) {
			if (this.hp < amount) {
				this.hp = 0;
			} else {
				this.hp -= amount;
			}
		};

		this.isDead = function() {
			return this.hp === 0;
		};
	}

	function Move(name, damage) {
		this.name = name;
		this.damage = damage;
		this.toString = function() {
			return this.name + "  [damage: " + this.damage + "]";
		};
		this.useString = function() {
			return this.name + " and did " + this.damage + " damage";
		}
	}

	function drawPokemonAtIndex(index, divId) {
		drawPokemon(battle.pokemon[index], divId);
	}

	function drawPokemon(pokemon, divId) {
		if (pokemon) {
			console.log("drawing...");
			var pokeDiv = document.getElementById(divId);
			pokeDiv.innerHTML = pokemon.name;

			$("<div>", {id: "hpDiv", html: pokemon.hp}).appendTo(pokeDiv);
			//draw image
			var avatar = document.createElement("img");
			avatar.setAttribute("src", pokemon.imageUrl);
			avatar.className = "img-circle";
			pokeDiv.appendChild(avatar);

			//draw move list
			var moveList = $("<div>", {"class": "btn-group", "data-toggle": "buttons"});
			for (var i = 0; i < pokemon.moves.length; i++) {

				var radioElem = $("<label>", {class: "btn-sm"});
				var radioInput = $("<input>", { type: "hidden", name: "opponentButtons", id: pokemon.moves[i].name, value: pokemon.moves[i].damage});

				$(radioElem).html(pokemon.moves[i].toString());

				$(radioElem).append(radioInput);
				$(moveList).append(radioElem);
			}
			$(pokeDiv).append(moveList);
		} else {
			console.log("pokemon undefined. can't draw.");
		} 

		drawHp(pokemon, divId);

		if (divId === player1Div) {
			drawPlayerOneStuff(pokeDiv);
		}
	}

	function drawHp(pokemon, pokeDivId) {
		var hpDiv = $("#"+pokeDivId).find("#hpDiv");
		hpDiv.html(pokemon.hp + " / " + pokemon.maxHp);
		var hplevel = 100 * pokemon.hp / pokemon.maxHp;

		var progress = $("<div>", {class: "progress"});
		var progressBar = $("<div>", {class: "progress-bar progress-bar-success progress-bar-striped active", role: "progressbar", 
			"aria-valuenow": 70, "aria-valuemin": 0, "aria-valuemax": 100, style: "width:" + hplevel + "%"});
		progress.append(progressBar);
		hpDiv.append(progress);
	}

	function drawPlayerOneStuff(pokeDiv) {
		$(pokeDiv).find( "input" ).attr( "type", "radio" ).attr("name", "attackButtons");
		$(pokeDiv).find( "input" ).first().attr( "checked", "true" );
		var attackBtn = $("<input>", 
		{
			type: "submit", 
			class: "btn btn-danger",
			value: "ATTACK", 
			click: attackBtnPressed});

		$(pokeDiv).append(attackBtn);
	}

	function getPokemon(name, divId, arraySlot) {
		if (name !== "") {
			$.ajax({
				url: pokeapi + "pokemon/" + name,
				success: function(data) {

					var drawCallback = function() {
						drawPokemonAtIndex(arraySlot, divId);
					}

					var newName = data.name;
					var newHP = getHpFromStatArray(data.stats) * HEALTH_MAGNIFIER; //data.stats[];
					var newImage = data.sprites.front_default;
					var moves = getMovesFromData(data, drawCallback);
					var newPoke = new Pokemon(newName, newHP, newImage, moves, divId);
					battle.pokemon[arraySlot] = newPoke;
					drawPokemon(newPoke, divId);
				}
			});
		}
	}

	function getMovesFromData(data, callback) {
		/*   Testing   */
		// var move1 = new Move("Move 1", 100);
		// var move2 = new Move("move 2", 150);
		// var moves = [move1, move2];

		var moves = [];

		var numberOfMoves = Math.min(MAX_MOVES, data.moves.length);

		for (var i = 0; i < numberOfMoves; i++) {
			var move = data.moves[i].move;
			var moveUrl = move.url;
			$.ajax({
				url: moveUrl,
				success: function(data) {
					var moveName = data.name;
					var moveDamage = data.power;
					if (!moveDamage) {
						moveDamage = 0;
					}
					var newMove = new Move(moveName, moveDamage);
					moves.push(newMove);
					callback();
				}
			});
		}

		return moves;
	}

	function getHpFromStatArray(statArray) {
		for (var i = 0; i < statArray.length; i++) {
			if (statArray[i].stat.name === "hp") {
				return statArray[i].base_stat;
			}
		}
		//if can't find hp
		return 500000;
	}

	function submitPokemonSearch() {
		var name = document.getElementById("searchPokemon").value;
		getPokemon(name, player1Div, player1ArraySlot);
		getRandomOpponent();
		startgame();
	}

	function getRandomOpponent() {
		var randomIndex = Math.floor(Math.random() * 150) + 1;
		getPokemon(randomIndex, player2Div, player2ArraySlot);
	}


	function attackBtnPressed() {
		if (battle.isPlayer1Turn()) {
			battle.switchTurn();
			battle.player1Attack();
			if (!battle.pokemon[1].isDead()) {
				setTimeout(opponentAttack, TIME_BEFORE_OPPONENT_MOVES);
			} 
		}
	}

	function opponentAttack() {
		battle.player2Attack();
		battle.switchTurn();
	}

	function getPlayer1Attack(poke1) {
		 var attackName = $('input[name=attackButtons]:checked').attr("id");
		 console.log((attackName));
		 for (var i = 0; i < poke1.moves.length; i++) {
		 	if (poke1.moves[i].name === attackName) {
		 		return poke1.moves[i];
		 	}
		 }
		 return new Move("default", 1);
	}

	function getPlayer2Attack(poke2) {
		 var randAttackIndex = Math.floor(Math.random() * poke2.moves.length);
		 return poke2.moves[randAttackIndex];
		 // var opponentAttacks = $('input[name=opponentButtons]');
		 // console.log(opponentAttacks);
		 // var randAttackIndex = Math.floor(Math.random() * opponentAttacks.length);
		 // return opponentAttacks[randAttackIndex].value;
	}

	function setMessage(string) {
		console.log("setting message string");
		$("#message").text(string);
	}

	function setUpAutoComplete() {
        $( "#searchPokemon" ).autocomplete({
          source: pokemonList
        });
	}

	function setDefaultPokemon() {
		//default testing
		var defaultMove = new Move("", 0);
		var defaultMoveList = [];
		var poke1 = new Pokemon("", 0, "resources/images/favicon.ico", defaultMoveList, player1Div);
		var poke2 = new Pokemon("", 0, "resources/images/favicon.ico", defaultMoveList, player2Div);
		battle.pokemon = [poke1, poke2];
		//delete
		drawPokemon(poke1, player1Div);
		drawPokemon(poke2, player2Div);
	}

	function init() {
		radio.init();
		setUpAutoComplete();
		opening();
		document.getElementById("submitSearch").addEventListener("click", submitPokemonSearch);
	}

	function opening() {
		battle.turn = 1;
		radio.playMusic(radio.intro);
		setDefaultPokemon();
	}

	function endgame() {
		battle.turn = 1;
		radio.playMusic(radio.victory);
	}

	function startgame() {
		battle.turn = 0;
		radio.playMusic(radio.battle);
	}

	init();

	// setTimeout(
	// 	function() {
	// 		drawPokemon(pokemon[0], player1Div);
	// },
	// 7000);
}


