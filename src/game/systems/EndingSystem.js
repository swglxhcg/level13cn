define([
	'ash',
	'game/GameGlobals',
], function (Ash, GameGlobals) {
	
	var EndingSystem = Ash.System.extend({
		
		isPopupShown: false,

		constructor: function () {},

		addToEngine: function (engine) {
			this.engine = engine;
		},

		removeFromEngine: function (engine) {
			this.engine = null;
		},

		update: function () {
			if (this.isPopupShown)
				return;
			
			if (!GameGlobals.gameState.isFinished)
				return;
			
			this.showPopup();
		},
		
		showPopup: function () {
			gtag('event', 'game_complete', { event_category: 'progression' })
			this.gameManager.pauseGame();
			GameGlobals.uiFunctions.showQuestionPopup(
				"The End",
				"恭喜你!你已经完成了Level 13。谢谢你的参与!<br/></br>您想重新开始吗?",
				"重启",
				"取消",
				function () {
					GameGlobals.uiFunctions.restart();
				},
				function () {}
			);
			this.isPopupShown = true;
		}
	});

	return EndingSystem;
});
