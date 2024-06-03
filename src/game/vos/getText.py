
text = '''camp: "Camp",
		collector_food: "Trap",
		collector_water: "Bucket",
		beacon: "Beacon",
		
		passageUpStairs: "Staircase Up",
		passageUpElevator: "Elevator Up (Repair)",
		passageUpHole: "Elevator Up (Build)",
		passageDownStairs: "Staircase Down",
		passageDownElevator: "Elevator Down (Repair)",
		passageDownHole: "Elevator Down (Build)",
		spaceship1: "Colony Hull",
		spaceship2: "Colony Shield",
		spaceship3: "Colony Life Support",
		greenhouse: "Greenhouse",
		tradepost_connector: "Great Elevator",
		
		home: "Tent",
		house: "Hut",
		house2: "Tower block",
		storage: "Storage",
		campfire: "Campfire",
		darkfarm: "Snail farm",
		hospital: "Clinic",
		generator: "Generator",
		tradepost: "Trading post",
		inn: "Inn",
		apothecary: "Apothecary",
		smithy: "Smithy",
		cementmill: "Cement mill",
		library: "Library",
		shrine: "Shrine",
		temple: "Temple",
		market: "Market",
		radiotower: "Radio tower",
		barracks: "Barracks",
		fortification: "Fortification",
		stable: "Caravan Stable",
		aqueduct: "Aqueduct",
		researchcenter: "Research center",
		lights: "Lights",
		ceiling: "Ceiling",
		square: "Square",
		garden: "Moss garden",'''



import re

def replace_quotes(text, replacement):
    lines = text.split('''
''')
    replacement_lines = replacement.split('''
''')
    result = []

    for line in lines:
        quotes = re.findall(r'"(.*?)"', line)
        if quotes:
            for quote in quotes:
                line = line.replace(f'{quote}', replacement_lines.pop(0))
        result.append(line)

    return '''
'''.join(result)


replacement = '''营
陷阱
桶
灯塔
楼梯了
电梯上升(维修)
电梯上升(建造)
楼梯下
电梯下降(维修)
电梯下行(建造)
殖民地船体
殖民地的盾牌
殖民地生命维持
温室
伟大的电梯
帐篷
小屋
大厦
存储
篝火
蜗牛的农场
诊所
发电机
交易站
酒店
药剂师
铁匠铺
水泥磨机
图书馆
神社
寺庙
市场
广播塔
军营
强化
商队稳定
渡槽
研究中心
灯
天花板
广场
苔藓花园


'''

new_text = replace_quotes(text, replacement)
print(new_text)
