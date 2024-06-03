import json
import pandas as pd

mname='UpgradeData'

# 读取JSON文件
#with open(mname+'.json', 'r', encoding='utf-8') as f:
#    data = json.load(f)

with open(f"UpgradeData.json", 'r', encoding='utf-8') as f:
    data = json.load(f)

# 提取所有节点的description属性
descriptions = []
def extract_descriptions(node):
    if isinstance(node, dict):
        if 'name' in node:
            descriptions.append(node['name'])
        for value in node.values():
            extract_descriptions(value)
    elif isinstance(node, list):
        for item in node:
            extract_descriptions(item)

extract_descriptions(data)

# 将结果保存到Excel表格中
df = pd.DataFrame(descriptions, columns=['name'])
df.to_excel(mname+'name.xlsx', index=False)
