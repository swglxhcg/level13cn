define(['ash', 'game/vos/PerkVO'], function (Ash, PerkVO) {
	
	var PerkConstants = {
	
		perkTypes: {
			injury: "Injury",
			movement: "Movement",
			health: "Health",
			stamina: "Stamina",
			light: "Light",
		},
		
		perkIds: {
			hunger: "hunger",
			thirst: "thirst",
			healthPenalty: "health--",
			healthBonus1: "health-1",
			healthBonus2: "health-2",
			healthBonus3: "health-3",
			hazardRadiation: "hazard-radiation",
			hazardPoison: "hazard-poison",
			hazardCold: "hazard-cold",
			encumbered: "encumbered",
			staminaBonus: "energized",
			staminaBonusPenalty: "headache",
			lightBeacon: "beacon",
		},
		
		perkDefinitions: {
			injury: [],
			health: [],
			stamina: [],
			movement: [],
		},
		
		perkStatus: {
			ACTIVATING: 1,
			ACTIVE: 2,
			DEACTIVATING: 3,
		},
		
		PERK_RECOVERY_FACTOR_REST: 3,
		TIMER_DISABLED: -1,
		
		ACTIVATION_TIME_HEALTH_DEBUFF: 30,
	
		getPerk: function (perkId, startTimer, removeTimer) {
			for (var key in this.perkDefinitions) {
				for (let i = 0; i < this.perkDefinitions[key].length; i++) {
					if (this.perkDefinitions[key][i].id === perkId) {
						let result = this.perkDefinitions[key][i].clone();
						result.setStartTimer(startTimer || PerkConstants.TIMER_DISABLED);
						result.setRemoveTimer(removeTimer || PerkConstants.TIMER_DISABLED);
						return result;
					};
				}
			}
			return null;
		},
		
		isPercentageEffect: function (perkType) {
			switch (perkType) {
				case this.perkTypes.health: return true;
				case this.perkTypes.injury: return true;
				case this.perkTypes.stamina: return true;
				case this.perkTypes.movement: return true;
				default: return false;
			}
		},

		isNegative: function (perk) {
			switch (perk.type) {
				case PerkConstants.perkTypes.injury:
					return true;
				case PerkConstants.perkTypes.movement:
					return perk.effect > 1;
				default:
					return perk.effect < 1;
			}
		},
		
		getCurrentEffect: function (perk) {
			var status = this.getStatus(perk);
			switch (status) {
				case PerkConstants.perkStatus.ACTIVE: return perk.effect;
				case PerkConstants.perkStatus.DEACTIVATING:
					return this.getPartialEffect(perk, perk.effectFactor);
				case PerkConstants.perkStatus.ACTIVATING:
					var activePercent = this.getPerkActivePercent(perk);
					return this.getPartialEffect(perk, activePercent);
			}
		},
		
		getPerkActivePercent: function (perk) {
			if (perk.removeTimer != PerkConstants.TIMER_DISABLED)
				return 1;
			if (perk.startTimer == PerkConstants.TIMER_DISABLED)
				return 1;
			var duration = perk.startTimerDuration || perk.startTimer;
			var activePercent = Math.min(1, 1 - perk.startTimer / duration);
			activePercent = Math.round(activePercent * 10) / 10;
			return activePercent;
		},
		
		getPartialEffect: function (perk, percent) {
			if (this.isPercentageEffect(perk.type)) {
				if (perk.effect > 1) {
					let mod = perk.effect - 1;
					return 1 + mod * percent;
				} else {
					let mod = 1 - perk.effect;
					return 1 - mod * percent;
				}
			} else {
				return perk.effect * percent;
			}
		},
		
		getStatus: function (perk) {
			if (perk.removeTimer != PerkConstants.TIMER_DISABLED) {
				return PerkConstants.perkStatus.DEACTIVATING;
			}
			if (perk.startTimer != PerkConstants.TIMER_DISABLED) {
				return PerkConstants.perkStatus.ACTIVATING;
			}
			return PerkConstants.perkStatus.ACTIVE;
		},
		
		getRemoveTimeFactor: function (perk, isResting) {
			return this.isNegative(perk) && isResting ? PerkConstants.PERK_RECOVERY_FACTOR_REST : 1;
		},
		
		getStartTimeFactor: function (perk, isResting) {
			return 1;
		},
		
	};
	
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.healthBonus1, "健康度", "Health", 1.1, "img/items/health-positive.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.healthBonus2, "增强 (L1)", "Health", 1.25, "img/items/health-positive.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.healthBonus3, "增强 (L2)", "Health", 1.5, "img/items/health-positive.png"));
	
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.hunger, "饥饿", "Health", 0.75, "img/items/health-negative.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.thirst, "口渴", "Health", 0.75, "img/items/health-negative.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.hazardRadiation, "Radiation sickness", "Health", 0.25, "img/items/health-negative.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.hazardPoison, "污染", "Health", 0.5, "img/items/health-negative.png"));
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.hazardCold, "寒冷", "Health", 0.75, "img/items/health-negative.png"));
	
	PerkConstants.perkDefinitions.health.push(new PerkVO(PerkConstants.perkIds.encumbered, "阻碍", "Movement", 0.1, "img/items/weight.png"));
	
	PerkConstants.perkDefinitions.stamina.push(new PerkVO(PerkConstants.perkIds.staminaBonus, "充满热情", "Stamina", 1, "img/items/health-positive.png"));
	PerkConstants.perkDefinitions.stamina.push(new PerkVO(PerkConstants.perkIds.staminaBonusPenalty, "头痛", "Stamina", 0.9, "img/items/health-negative.png"));
	
	PerkConstants.perkDefinitions.stamina.push(new PerkVO(PerkConstants.perkIds.lightBeacon, "灯塔", "Light", 20, "img/items/perk-light-beacon.png"));
	
	var lightInjuryEffect = 0.9;
	var medInjuryEffect = 0.7;
	var seriousInjuryEffect = 0.5;
	var bodyParts = ["腿", "手臂", "头", "叫", "胸膛", "手"];
	for (let i = 0; i < bodyParts.length; i++) {
		var id = bodyParts[i].toLowerCase();
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-big-" + id, bodyParts[i] + " 伤口 (严重)", "Injury", seriousInjuryEffect, "img/items/injury-1.png"));
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-med-" + id, bodyParts[i] + " 伤口 (中等)", "Injury", medInjuryEffect, "img/items/injury-2.png"));
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-small-" + id, bodyParts[i] + " 伤口 (轻)", "Injury", lightInjuryEffect, "img/items/injury-3.png"));
	}
	var injuryTypes = [ "烧伤", "踝韧带扭伤", "肋骨骨折"];
	for (let j = 0; j < injuryTypes.length; j++) {
		var id = injuryTypes[j].toLowerCase();
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-big-" + id, injuryTypes[j] + " (严重)", "Injury", seriousInjuryEffect, "img/items/injury-1.png"));
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-med-" + id, injuryTypes[j] + " (中等)", "Injury", medInjuryEffect, "img/items/injury-2.png"));
		PerkConstants.perkDefinitions.injury.push(new PerkVO("injury-small-" + id, injuryTypes[j] + " (轻)", "Injury", lightInjuryEffect, "img/items/injury-3.png"));
	}
	
	return PerkConstants;
	
});
