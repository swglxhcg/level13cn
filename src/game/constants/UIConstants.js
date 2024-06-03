// Singleton with helper methods for UI elements used throughout the game
define(['ash',
	'game/GameGlobals',
	'game/constants/StoryConstants',
	'game/constants/PositionConstants',
	'game/constants/SectorConstants',
	'game/constants/FollowerConstants',
	'game/constants/ItemConstants',
	'game/constants/BagConstants',
	'game/constants/PerkConstants',
	'game/constants/UpgradeConstants',
	'game/constants/PlayerActionConstants',
	'game/components/common/PositionComponent',
	'game/components/common/CampComponent',
	'game/components/sector/SectorStatusComponent',
	'game/components/sector/SectorLocalesComponent',
	'game/components/sector/PassagesComponent',
	'game/components/common/VisitedComponent',
	'utils/UIAnimations'
], function (Ash, GameGlobals,
	StoryConstants, PositionConstants, SectorConstants, FollowerConstants, ItemConstants, BagConstants, PerkConstants, UpgradeConstants, PlayerActionConstants,
	PositionComponent, CampComponent, SectorStatusComponent, SectorLocalesComponent,
	PassagesComponent, VisitedComponent, UIAnimations) {

	var UIConstants = {

		FEATURE_MISSING_TITLE: "特征缺失",
		FEATURE_MISSING_COPY: "此功能尚未实现。待会再来!",

		MAP_MINIMAP_SIZE: 7,
		SCROLL_INDICATOR_SIZE: 5,

		resourceImages: {
			metal: "img/res-metal.png",
		},

		getItemDiv: function (itemsComponent, item, count, calloutContent, hideComparisonIndicator) {
			var url = item ? item.icon : null;
			var hasCount = count || count === 0;

			var classes = "item";
			if (item && item.equipped) classes += " item-equipped";
			if (hasCount) classes += " item-with-count";
			var div = "<div class='" + classes + (item ? "' data-itemid='" + item.id + "' data-iteminstanceid='" + item.itemID + "'>" : ">");

			if (item && calloutContent) {
				div += "<div class='info-callout-target info-callout-target-small' description='" + this.cleanupText(calloutContent) + "'>";
			}

			if (item) div += "<img src='" + url + "' alt='" + item.name + "'/>";

			if (hasCount)
				div += "<div class='item-count lvl13-box-1 vision-text'>" + count + "x </div>";

			if (!hideComparisonIndicator && item.equippable) {
				var comparisonClass = "indicator-even";
				if (item.equipped) {
					comparisonClass = "indicator-equipped";
				} else {
					var comparison = itemsComponent.getEquipmentComparison(item);
					if (comparison > 0) {
						comparisonClass = "indicator-increase";
					} else if (comparison < 0) {
						comparisonClass = "indicator-decrease";
					}
				}
				div += "<div class='item-comparison-badge'><div class='item-comparison-indicator " + comparisonClass + "'/></div>";
			}

			if (calloutContent) div += "</div>";

			div += "</div>"

			return div;
		},

		getItemSlot: function (itemsComponent, item, count, isLost, simple, showBagOptions, bagOptions, tab) {
			let itemDev = this.getItemDiv(itemsComponent, item, count, this.getItemCallout(item, false, showBagOptions, bagOptions, tab));
			var imageDiv = "<div class='item-slot-image'>"+ itemDev + "</div>";
			var liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			if (isLost) liclasses += "item-slot-lost";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>"
		},

		updateItemSlot: function (slot, count) {
			var $slot = typeof (slot) === "string" ? $(slot) : slot;
			if (!$slot) return;
			$slot.find(".item-count").text(count + "x");
			GameGlobals.uiFunctions.toggle($slot, count > 0);
		},

		getItemCallout: function (item, smallCallout, showBagOptions, bagOptions, tab) {
			var detail = " (" + this.getItemBonusDescription(item, true, false) + ")";
			if (detail.length < 5) detail = "";
			var weight = BagConstants.getItemCapacity(item);
			var itemCalloutContent = "<b>" + item.name + "</b><br/>类型: " + ItemConstants.getItemTypeDisplayName(item.type, false) + " " + detail;
			itemCalloutContent += "</br>重量: " + weight;
			itemCalloutContent += "</br>" + item.description;
			if (smallCallout) itemCalloutContent = item.name + (detail.length > 0 ? " " + detail : "");
			
			var makeButton = function (action, name) {
				if (!tab) {
					 return "<button class='action btn-narrow' action='" + action + "'>" + name + "</button>";
				} else {
					 return "<button class='action tabbutton btn-narrow' data-tab='" + tab + "' action='" + action + "'>" + name + "</button>";
				}
			};

			if (showBagOptions) {
				var options = "<div class='item-bag-options'>";
				if (bagOptions.canEquip) {
					var action = "equip_" + item.id;
					options += makeButton(action, "装备");
				} else if (bagOptions.canUnequip) {
					var action = "unequip_" + item.id;
					options += makeButton(action, "卸下");
				}
				if (bagOptions.canDiscard) {
					var action = "discard_" + item.id;
					options += makeButton(action, "丢弃");
				}
				options += "</div>";
				itemCalloutContent += options;
			}

			return itemCalloutContent;
		},

		getItemList: function (items) {
			var html = "";
			var itemsCounted = {};
			var itemsById = {};
			for (let i = 0; i < items.length; i++) {
				if (typeof itemsCounted[items[i].id] === 'undefined') {
					itemsCounted[items[i].id] = 1;
					itemsById[items[i].id] = items[i];
				} else {
					itemsCounted[items[i].id]++;
				}
			}

			for (var key in itemsById) {
				var item = itemsById[key];
				var amount = itemsCounted[key];
				html += "<li>" + this.getItemDiv(itemsComponent, item, amount, this.getItemCallout(item, true)) + "</li>";
			}
			return html;
		},
		
		getFollowerDiv: function (follower, isRecruited, isInCamp, hideComparisonIndicator) {
			let classes = "item";
			let div = "<div class='" + classes + "' data-followerid='" + follower.id + "'>";
			let calloutContent = this.getFollowerCallout(follower, isRecruited, isInCamp);
			
			div += "<div class='info-callout-target info-callout-target-small' description='" + this.cleanupText(calloutContent) + "'>";
			div += "<img src='" + follower.icon + "' alt='" + follower.name + "'/>";
			
			if (!hideComparisonIndicator) {
				div += "<div class='item-comparison-badge'><div class='item-comparison-indicator indicator-even'/></div>";
			}
			
			div += "</div>";
			div += "</div>"
			
			return div;
		},
		
		getFollowerCallout: function (follower, isRecruited, isInCamp) {
			let followerType = FollowerConstants.getFollowerTypeForAbilityType(follower.abilityType);
			let result = "<b>" + follower.name + "</b>";
			if (isRecruited) {
				result += "<br/>在Party: " + (follower.inParty ? "yes" : "no");
			}
			result += "<br/>类型: " + FollowerConstants.getFollowerTypeDisplayName(followerType);
			result += "<br/>能力: " + FollowerConstants.getAbilityTypeDisplayName(follower.abilityType)
				+ " (" + UIConstants.getFollowerAbilityDescription(follower) + ")";
			
			if (isRecruited && isInCamp) {
				var makeButton = function (action, name) {
					 return "<button class='action btn-narrow' action='" + action + "'>" + name + "</button>";
				};

				var options = "<div class='item-bag-options'>";
				options += makeButton("dismiss_follower_" + follower.id, "辞退");
				if (!follower.inParty) {
					options += makeButton("select_follower_" + follower.id, "加入 party");
				} else {
					options += makeButton("deselect_follower_" + follower.id, "交换或替换");
				}
				options += "</div>";
				result += options;
			}

			return result;
		},
		
		getFollowerAbilityDescription: function (follower) {
			switch (follower.abilityType) {
				case FollowerConstants.abilityType.ATTACK:
				case FollowerConstants.abilityType.DEFENCE:
					let att = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.fight_att);
					let def = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.fight_def);
					return "攻击 +" + att + ", 防御 +" + def;
				case FollowerConstants.abilityType.COST_MOVEMENT:
					let movementCostReduction = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.movement);
					return "运输成本 -" + UIConstants.getMultiplierBonusDisplayValue(movementCostReduction);
				case FollowerConstants.abilityType.COST_SCAVENGE:
					let scavengeCostReduction = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.scavenge_cost);
					return "清理成本 -" + UIConstants.getMultiplierBonusDisplayValue(scavengeCostReduction);
				case FollowerConstants.abilityType.COST_SCOUT:
					let scoutCostReduction = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.scout_cost);
					return "侦察成本 -" + UIConstants.getMultiplierBonusDisplayValue(scoutCostReduction);
				case FollowerConstants.abilityType.HAZARD_PREDICTION:
					return "预见未到访区域的危险";
				case FollowerConstants.abilityType.SCAVENGE_GENERAL:
					let scaBonus = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.scavenge_general);
					return "+" + UIConstants.getMultiplierBonusDisplayValue(scaBonus) + " 在拾荒时获得额外战利品的机会";
				case FollowerConstants.abilityType.SCAVENGE_INGREDIENTS:
					let ingredientBonus = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.scavenge_ingredients);
					return "+" + UIConstants.getMultiplierBonusDisplayValue(ingredientBonus) + " 捡食时找到食材的机会";
				case FollowerConstants.abilityType.SCAVENGE_SUPPLIES:
					let suppliesBonus = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.scavenge_supplies);
					return "+" + UIConstants.getMultiplierBonusDisplayValue(suppliesBonus) + " 有机会在拾荒时找到更多的补给";
				case FollowerConstants.abilityType.SCAVENGE_CAPACITY:
					let capacityBonus = FollowerConstants.getFollowerItemBonus(follower, ItemConstants.itemBonusTypes.bag);
					return "+" + capacityBonus + " 运载能力";
				default:
					log.w("no display name defined for abilityType: " + follower.abilityType);
					return follower.abilityType;
			}
		},

		getResourceLi: function (name, amount, isLost, simple) {
			var divclasses = "res item-with-count";
			var div = "<div class='" + divclasses + "' data-resourcename='" + name + "'>";
			div += "<div class='info-callout-target info-callout-target-small' description='" + name + "'>";
			div += this.getResourceImg(name);
			if (amount || amount === 0)
				div += "<div class='item-count lvl13-box-1'>" + Math.floor(amount) + "x</div>";
			div += "</div>";
			div += "</div>";
			var liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			if (isLost) liclasses += "item-slot-lost";
			var imageDiv = "<div class='item-slot-image'>" + div + "</div>";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>";
		},

		updateResourceLi: function (li, amount) {
			var $li = typeof (li) === "string" ? $(li) : li;
			if (!$li) return;
			var showAmount = Math.floor(amount);
			$li.find(".item-count").text(showAmount + "x");
			GameGlobals.uiFunctions.toggle($li, showAmount > 0);
		},

		getCurrencyLi: function (amount, simple) {
			var classes = "res item-with-count";
			var div = "<div class='" + classes + "' data-resourcename='currency'>";
			div += "<div class='info-callout-target info-callout-target-small' description='silver'>";
			div += this.getResourceImg("currency");
			div += "<div class='item-count lvl13-box-1'>" + Math.floor(amount) + "x </div>";
			div += "</div>";
			div += "</div>";
			var liclasses = "item-slot item-slot-small lvl13-box-1 ";
			if (simple) liclasses += "item-slot-simple";
			var imageDiv = "<div class='item-slot-image'>" + div + "</div>";
			return "<li class='" + liclasses + "'>" + imageDiv + "</li>";
		},

		updateCurrencyLi: function (li, amount) {
			var $li = typeof (li) === "string" ? $(li) : li;
			if (!$li) return;
			var showAmount = Math.floor(amount);
			$li.find(".item-count").text(showAmount + "x");
			GameGlobals.uiFunctions.toggle($li, showAmount > 0);
		},

		getBlueprintPieceLI: function (upgradeID) {
			var upgradeDefinition = UpgradeConstants.upgradeDefinitions[upgradeID];
			var name = upgradeDefinition.name;
			return "<li><div class='info-callout-target' description='Blueprint (" + name + ")'>" + this.getBlueprintPieceIcon(upgradeID) + " blueprint</li>";
		},

		getResourceList: function (resourceVO) {
			var html = "";
			for (var key in resourceNames) {
				var name = resourceNames[key];
				var amount = resourceVO.getResource(name);
				if (Math.round(amount) > 0) {
					var li = this.getResourceLi(name, amount);
					html += li;
				}
			}
			return html;
		},

		getItemBonusDescription: function (item, showAllBonuses, useLineBreaks) {
			let result = "";
			var defaultType = ItemConstants.getItemDefaultBonus(item);
			var value;
			for (var bonusKey in ItemConstants.itemBonusTypes) {
				var bonusType = ItemConstants.itemBonusTypes[bonusKey];
				if (bonusType === defaultType || showAllBonuses) {
					value = item.getBonus(bonusType);
					if (value <= 0 && showAllBonuses) {
						continue;
					}
					if (value <= 0 && !showAllBonuses) {}
					result += this.getItemBonusName(bonusType, true);
					result += useLineBreaks && !showAllBonuses ? "<br/>" : " ";
					result += this.getItemBonusText(item, bonusType);
				}
				if (showAllBonuses) {
					result += useLineBreaks ? "<br/>" : ", ";
				}
			}

			if (showAllBonuses) {
				result = result.substring(0, result.length - (useLineBreaks ? 5 : 2));
			}

			return result;
		},

		getItemBonusName: function (bonusType, short) {
			switch (bonusType) {
				case ItemConstants.itemBonusTypes.light: return "最大视野";
				case ItemConstants.itemBonusTypes.fight_att: return "攻击";
				case ItemConstants.itemBonusTypes.fight_def: return "防御";
				case ItemConstants.itemBonusTypes.fight_shield: return "护盾";
				case ItemConstants.itemBonusTypes.fight_speed: return "攻击速度";
				case ItemConstants.itemBonusTypes.movement: return "移动成本";
				case ItemConstants.itemBonusTypes.scavenge_cost: return "清理成本";
				case ItemConstants.itemBonusTypes.scavenge_general: return "清理奖励";
				case ItemConstants.itemBonusTypes.scavenge_supplies: return "清理奖励";
				case ItemConstants.itemBonusTypes.scavenge_ingredients: return "清理奖励";
				case ItemConstants.itemBonusTypes.scout_cost: return "侦察成本";
				case ItemConstants.itemBonusTypes.bag: return "背包容量";
				case ItemConstants.itemBonusTypes.res_cold: return "温暖";
				case ItemConstants.itemBonusTypes.res_radiation: return short ? "radiation prot" : "辐射保护";
				case ItemConstants.itemBonusTypes.res_poison: return short ? "poison prot" : "毒害保护";
				case ItemConstants.itemBonusTypes.shade: return short ? "sun prot" : "光照保护";
				case ItemConstants.itemBonusTypes.hazard_prediction: return short ? "surveying" : "地质灾害勘察";
				default:
					log.w("no display name defined for item bonus type: " + bonusType);
					return "";
			}
		},

		getItemBonusText: function (item, bonusType) {
			var bonusValue = item.getBonus(bonusType);
			
			if (ItemConstants.isStaticValue(bonusType)) {
				return " " + bonusValue;
			} else if (bonusValue === 0) {
				return "+0";
			} else if (ItemConstants.isMultiplier(bonusType) && ItemConstants.isIncreasing(bonusType)) {
				// increasing multiplier: fight speed
				var val = Math.abs(Math.round((1 - bonusValue) * 100));
				return bonusValue == 1 ? "+0%" : (bonusValue < 1 ? "-" + val + "%" : "+" + val + "%");
			} else if (bonusValue >= 1) {
				return " +" + bonusValue;
			} else if (bonusValue > 0) {
				return " -" + UIConstants.getMultiplierBonusDisplayValue(bonusValue);
			} else if (bonusValue > -1) {
				return " +" + UIConstants.getMultiplierBonusDisplayValue(bonusValue);
			} else {
				return " " + bonusValue;
			}
		},

		getPerkDetailText: function (perk, isResting) {
			let bonusText = this.getPerkBonusText(perk);
			let timerText = this.getPerkTimerText(perk, isResting);
			let result = "";
			if (bonusText) result += bonusText;
			if (timerText) {
				if (bonusText.length > 0) result += ", ";
				result += timerText;
			}
			return result;
		},
		
		getPerkTimerText: function (perk, isResting) {
			if (perk.removeTimer >= 0) {
				var factor = PerkConstants.getRemoveTimeFactor(perk, isResting);
				var timeleft = perk.removeTimer / factor;
				return "剩余时间: " + this.getTimeToNum(timeleft);
			} else if (perk.startTimer >= 0) {
				var percent = PerkConstants.getPerkActivePercent(perk);
				return "填满所需时间: " + this.getTimeToNum(perk.startTimer);
			} else {
				return null;
			}
		},

		getPerkBonusText: function (perk) {
			var value = 0;
			if (PerkConstants.isPercentageEffect(perk.type)) {
				if (perk.effect == 1) return null;
				if (perk.effect < 1) {
					value = "-" + UIConstants.getMultiplierBonusDisplayValue(PerkConstants.getCurrentEffect(perk));
				} else {
					value = "+" + UIConstants.getMultiplierBonusDisplayValue(PerkConstants.getCurrentEffect(perk));
				}
			} else {
				if (perk.effect == 0) return null;
				value = "+" + PerkConstants.getCurrentEffect(perk);
			}

			var effect = perk.type;
			switch (perk.type) {
				case PerkConstants.perkTypes.movement:
					effect = "移动成本";
					break;
				case PerkConstants.perkTypes.injury:
				case PerkConstants.perkTypes.health:
					effect = "健康度";
					break;
			}

			return effect + " " + value;
		},
		
		getMultiplierBonusDisplayValue: function (value) {
			return Math.round(Math.abs(1 - value) * 100) + "%";
		},

		sortItemsByType: function (a, b) {
			var getItemSortVal = function (itemVO) {
				var typeVal = 0;
				switch (itemVO.type) {
					case ItemConstants.itemTypes.uniqueEquipment: typeVal = 0; break;
					case ItemConstants.itemTypes.exploration: typeVal = 1; break;
					
					case ItemConstants.itemTypes.bag: typeVal = 11; break;
					case ItemConstants.itemTypes.light: typeVal = 12; break;
					case ItemConstants.itemTypes.weapon: typeVal = 13; break;
					case ItemConstants.itemTypes.clothing_over: typeVal = 14; break;
					case ItemConstants.itemTypes.clothing_upper: typeVal = 15; break;
					case ItemConstants.itemTypes.clothing_lower: typeVal = 16; break;
					case ItemConstants.itemTypes.clothing_hands: typeVal = 17; break;
					case ItemConstants.itemTypes.clothing_head: typeVal = 18; break;
					case ItemConstants.itemTypes.shoes: typeVal = 19; break;
					
					case ItemConstants.itemTypes.ingredient: typeVal = 21; break;
					case ItemConstants.itemTypes.voucher: typeVal = 22; break;
					case ItemConstants.itemTypes.trade: typeVal = 23; break;
					
					case ItemConstants.itemTypes.artefact: typeVal = 31; break;
					case ItemConstants.itemTypes.note: typeVal = 32; break;
				}
				return typeVal * 1000 - itemVO.getTotalBonus();
			};
			var aVal = getItemSortVal(a);
			var bVal = getItemSortVal(b);
			return aVal - bVal;
		},
		
		sortFollowersByType: function (a, b) {
			let getFollowerSortVal = function (followerVO) {
				let abilityType = followerVO.abilityType;
				let followerType = FollowerConstants.getFollowerTypeForAbilityType(abilityType);
				let typeVal = 0;
				switch (followerType) {
					case FollowerConstants.followerType.FIGHTER: typeVal = 1; break;
					case FollowerConstants.followerType.EXPLORER: typeVal = 2; break;
					case FollowerConstants.followerType.SCAVENGER: typeVal = 3; break;
				}
				return typeVal * 1000 - followerVO.abilityLevel;
			};
			let aVal = getFollowerSortVal(a);
			let bVal = getFollowerSortVal(b);
			return aVal - bVal;
		},

		createResourceIndicator: function (name, showName, id, showAmount, showChange) {
			var div = "<div class='stats-indicator' id='" + id + "'>";

			if (!showName) div = "<div class='info-callout-target info-callout-target-small' description='" + name + "'>" + div;
			else if (showChange) div = "<div class='info-callout-target' description=''>" + div;

			div += "<span class='icon'>";
			div += this.getResourceImg(name);
			if (!showName && !showChange) div += "</div>";
			div += "</span>";

			if (showName) div += "<span class='label'>" + name + "</span>";

			if (showAmount) div += "<span class='value'></span>";
			div += "<span class='change-indicator'></span>";
			div += "<span class='change'></span>";
			div += "<span class='forecast'></span>";
			div += "</div>";

			if (!showName || showChange) div = div + "</div>";

			return div;
		},
		
		completeResourceIndicatorAnimations: function (id) {
			let $valueElement = $(id).children(".value");
			UIAnimations.animateNumberEnd($valueElement);
		},

		updateResourceIndicator: function (id, value, change, storage, showChangeIcon, showChange, showDetails, showWarning, visible, animate) {
			GameGlobals.uiFunctions.toggle(id, visible);
			GameGlobals.uiFunctions.toggle($(id).parent(), visible);
			if (visible) {
				let $valueElement = $(id).children(".value");
				animate = animate || UIAnimations.isAnimating($valueElement);
				UIAnimations.animateOrSetNumber($valueElement, animate, value, "", false, (v) => { return UIConstants.roundValue(v, true, false); });
				$(id).children(".value").toggleClass("warning", showWarning && value < 5);
				$(id).children(".change").toggleClass("warning", change < 0);
				GameGlobals.uiFunctions.toggle($(id).children(".change"), showChange);
				GameGlobals.uiFunctions.toggle($(id).children(".forecast"), showDetails);
				$(id).children(".forecast").toggleClass("warning", change < 0);

				var isCappedByStorage = change > 0 && value >= storage;

				if (showChange) {
					$(id).children(".change").text(Math.round(change * 10000) / 10000 + "/s");
				}
				if (showDetails) {
					if (change > 0 && (storage - value > 0)) {
						$(id).children(".forecast").text("(" + this.getTimeToNum((storage - value) / change) + " to cap)");
					} else if (change < 0 && value > 0) {
						$(id).children(".forecast").text("(" + this.getTimeToNum(value / change) + " to 0)");
					} else if (value >= storage) {
						$(id).children(".forecast").text("(full)");
					} else {
						$(id).children(".forecast").text("");
					}
				}

				change = Math.round(change * 10000) / 10000;
				$(id).children(".change-indicator").toggleClass("indicator-increase", change > 0 && !isCappedByStorage);
				$(id).children(".change-indicator").toggleClass("indicator-decrease", change < 0);
				$(id).children(".change-indicator").toggleClass("indicator-even", change === 0 || isCappedByStorage);
				GameGlobals.uiFunctions.toggle($(id).children(".change-indicator"), showChangeIcon);
			}
		},

		updateResourceIndicatorCallout: function (id, changeSources) {
			var content = "";
			var source;
			for (let i in changeSources) {
				source = changeSources[i];
				if (source.amount != 0) {
					content += source.source + ": " + Math.round(source.amount * 10000) / 10000 + "/s<br/>";
				}
			}

			if (content.length <= 0) {
				content = "(没有改变)";
			}

			this.updateCalloutContent(id, content);
		},

		updateCalloutContent: function (targetElementId, content, isTargetDirect) {
			if (isTargetDirect)
				$(targetElementId).siblings(".info-callout").children(".info-callout-content").html(content);
			else
				$(targetElementId).parents(".info-callout-target").siblings(".info-callout").children(".info-callout-content").html(content);
		},

		getBlueprintPieceIcon: function (upgradeID) {
			let type = UpgradeConstants.getUpgradeType(upgradeID);
			return "<img src='img/items/blueprints/blueprint-" + type + ".png' alt='' />";
		},

		getTimeToNum: function (seconds) {
			seconds = Math.ceil(Math.abs(seconds));

			var minutes = seconds / 60;
			var hours = minutes / 60;
			var days = hours / 24;

			if (days > 2) {
				return Math.floor(days) + "days";
			} else if (hours > 2) {
				return Math.floor(hours) + "h";
			} else if (minutes > 2) {
				return Math.floor(minutes) + "min";
			} else {
				return Math.round(seconds) + "s";
			}
		},

		getTimeSinceText: function (date) {
			var seconds = Math.floor((new Date() - date) / 1000);

			var interval = Math.floor(seconds / 31536000);
			if (interval > 1) {
				return interval + " 年";
			}
			interval = Math.floor(seconds / 2592000);
			if (interval > 1) {
				return interval + " 月";
			}
			interval = Math.floor(seconds / 86400);
			if (interval > 1) {
				return interval + " 天";
			}
			interval = Math.floor(seconds / 3600);
			if (interval > 1) {
				return interval + " 小时";
			}
			interval = Math.floor(seconds / 60);
			if (interval > 1) {
				return interval + " 分钟";
			}
			if (interval === 1) {
				return interval + " 分";
			}
			if (seconds < 10) {
				return "几秒钟";
			}

			return "小于一分钟";
		},

		getInGameDate: function (gameTime) {
			var secondSinceGameStart = gameTime;
			var inGameDaysSinceGameStart = Math.floor(secondSinceGameStart / 86400 * 365);
			var inGameWeeksSinceGameStart = inGameDaysSinceGameStart / 40;

			var year = StoryConstants.GAME_START_YEAR;
			var week = StoryConstants.GAME_START_WEEK;
			if (inGameWeeksSinceGameStart < 40 - StoryConstants.GAME_START_WEEK) {
				week += inGameWeeksSinceGameStart;
			} else {
				var weeksSinceFirstNewYear = inGameWeeksSinceGameStart - (40 - StoryConstants.GAME_START_WEEK);
				week = weeksSinceFirstNewYear - (Math.floor(weeksSinceFirstNewYear / 40) * 40) + 1;
				year += 1 + (weeksSinceFirstNewYear) / 40;
			}

			year = Math.floor(year);
			week = Math.floor(week);

			return "Y" + year + "-N" + week;
		},

		roundValue: function (value, showDecimalsWhenSmall, showDecimalsAlways, decimalDivisor) {
			decimalDivisor = decimalDivisor || 100;
			let divisor = 0;
			if (showDecimalsWhenSmall && value <= 10) divisor = decimalDivisor;
			if (showDecimalsAlways) divisor = decimalDivisor;

			if (value % 1 === 0 || divisor <= 0) return Math.round(value);
			
			let result = Math.round(value * divisor) / divisor;
			
			if (result == 0) {
				return "< " + (0.5 / divisor);
			}
			
			return result;
		},

		getDisplayValue: function (value) {
			return value.toLocaleString();
		},

		getResourceImg: function (name) {
			return "<img src='img/res-" + name + ".png' alt='" + name + "'/>"
		},
		
		getRangeText: function (range, count) {
			var min = range[0];
			var max = range[1];
			
			if (!count && count !== 0) {
				// text without current count
				if (min >= 0 && max >= 0) {
					return min + "-" + max;
				}
				if (min >= 0) {
					return "min " + min;
				}
				if (max >= 0) {
					return "max " + max;
				}
			} else {
				// text with current count
				if (min >= 0 && max >= 0) {
					return count + "/" + min + "-" + max;
				}
				if (min >= 0) {
					return count + "/" + min;
				}
				if (max >= 0) {
					return count + "/" + max;
				}
			}
			
			return "";
		},

		getBagCapacityDisplayValue: function (bagComponent) {
			if (bagComponent.bonusCapacity > 0) {
				return bagComponent.baseCapacity + " +" + bagComponent.bonusCapacity;
			} else {
				return bagComponent.baseCapacity;
			}
		},

		cleanupText: function (text) {
			return text.replace(/'/g, "&#39;")
		},

	};

	return UIConstants;
});
