window.onload = function() {
	var pokeapi = "http://pokeapi.co/api/v2/";
	var player1Div = "player1";
	var player2Div = "player2";
	var player1ArraySlot = 0;
	var player2ArraySlot = 1;
	var MAX_MOVES = 1;
	var TIME_BEFORE_OPPONENT_MOVES = 2000;

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
		},
		player2Attack: function() {
			var move = getPlayer2Attack(this.pokemon[1]);
			var moveString = "Opponent used " + move.useString();
			setMessage(moveString);
			this.pokemon[0].loseHp(move.damage);
			drawHp(this.pokemon[0], this.pokemon[0].divId);
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
		$("#"+pokeDivId).find("#hpDiv").html(pokemon.hp + " / " + pokemon.maxHp);
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
					var newHP = getHpFromStatArray(data.stats); //data.stats[];
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
		var move1 = new Move("Move 1", 100);
		var move2 = new Move("move 2", 150);
		var moves = [move1, move2];

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
	}

	function getRandomOpponent() {
		var randomIndex = Math.floor(Math.random() * 150) + 1;
		getPokemon(randomIndex, player2Div, player2ArraySlot);
	}


	function attackBtnPressed() {
		if (battle.isPlayer1Turn()) {
			battle.switchTurn();
			battle.player1Attack();
			setTimeout(opponentAttack, TIME_BEFORE_OPPONENT_MOVES);
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

	function init() {


		document.getElementById("submitSearch").addEventListener("click", submitPokemonSearch);


		//default testing
		var defaultMove = new Move("Default", 1);
		var defaultMoveList = [defaultMove, defaultMove, defaultMove, defaultMove];
		var poke1 = new Pokemon("Ivy", 100, "resources/images/favicon.ico", defaultMoveList, player1Div);
		var poke2 = new Pokemon("Bulba", 200, "resources/images/favicon.ico", defaultMoveList, player2Div);
		battle.pokemon = [poke1, poke2];

		//delete
		drawPokemon(poke1, player1Div);
		drawPokemon(poke2, player2Div);
	}

	init();

	// setTimeout(
	// 	function() {
	// 		drawPokemon(pokemon[0], player1Div);
	// },
	// 7000);
}


