import json
import itertools
from collections import OrderedDict


def assign_identifiers(d):
    counter = itertools.count(1)

    def recursive_assign(node):
        node_id = next(counter)

        # Reorder keys to put 'node_id' second
        new_node = OrderedDict()
        keys = list(node.keys())
        if keys:
            new_node[keys[0]] = node[keys[0]]  # First key
        new_node['node_id'] = node_id         # Insert 'node_id' second
        for k in keys[1:]:
            if k != 'node_id':
                new_node[k] = node[k]

        if 'children' in node and isinstance(node['children'], list):
            new_children = []
            for child in node['children']:
                new_children.append(recursive_assign(child))
            new_node['children'] = new_children

        return new_node

    return recursive_assign(d)


def collect_nodes(d):
    results = []

    def recursive_collect(node):
        if isinstance(node, dict):
            if node.get("opacity") == 1:
                results.append(node['node_id'])
            for value in node.values():
                recursive_collect(value)
        elif isinstance(node, list):
            for item in node:
                recursive_collect(item)

    recursive_collect(d)
    return results


weightclass = 'heavyweight'
tier = json.load(open(f'{weightclass}.json'))
nodes = collect_nodes(d=tier)
print(nodes)
