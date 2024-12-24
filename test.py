import os
import random
import json
class OrgParser:
    def __init__(self, url=""):
        self.header_list = []
        self.data = {}
        self.header_prefix = "*"
        self.root_name = os.path.basename(url),
        if url.endswith(".org"):
            self.header_prefix = "*"
        elif url.endswith(".md"):
            self.header_prefix = "#"

    def parse_emm(self, emm):
        """
        read a emm format structure
        """
        self.data = emm["data"]
        self.header = self.flatten(False)

    def parse_lines(self, lines):
        """
        from lines to tree
        """
        self.data = {
            "id": "root",
            "topic": self.root_name,
        }

        path = [self.data]
        i, level = 0, 0
        n = len(lines)
        while i < n:
            content = []
            while i < n and not self.is_header(lines[i]):
                content.append(lines[i])
                i += 1
            path[-1]["content"] = "".join(content)
            if i == n:
                break
            stars, header = lines[i].split(" ", 1)
            self.header_list.append(header.strip())
            new_level = len(stars)

            node = {
                "id": generate_id(),
                "topic": header.strip(),
            }
            if new_level <= level:
                for _ in range(level - new_level + 1):
                    path.pop()
            else:
                path[-1]["children"] = []
                new_level = level + 1  # fix ill format

            path[-1]["children"].append(node)
            path.append(node)
            level = new_level
            i += 1

    def to_emm(self):
        """
        convert self.data to emm format, a tree copy algorithm(bfs)
        """

        queue = [self.data]
        level = 1
        root = {
            "id": "root",
            "topic": self.data["topic"],
            "expanded": True,
            "children": [],
        }
        dual = {"root": root}
        while queue:
            temp_queue = []
            for node in queue:
                for i, child in enumerate(node.get("children", [])):
                    if level == 1:
                        half = (len(node["children"]) + 1) // 2
                        direction = "right" if i < half else "left"
                    else:
                        direction = dual[node["id"]]["direction"]
                    new_node = {
                        "id": child["id"],
                        "topic": child["topic"],
                        "expanded": True,
                        "direction": direction,
                        "children": [],
                    }
                    temp_queue.append(child)
                    dual[child["id"]] = new_node
                    dual[node["id"]]["children"].append(new_node)
            level += 1
            queue = temp_queue

        emm = {
            "meta": {
                "name": "jsMind",
                "author": "hizzgdev@163.com",
                "version": "0.4.6",
            },
            "format": "node_tree",
        }
        emm["data"] = dual["root"]
        return emm

    def flatten(self, with_content=True):
        """
        convert tree to lines,  preorder traverse
        """

        def dfs(root, level=0, res=[]):
            content = root["content"] if "content" in root else ""
            header = root["topic"]
            if level == 0:
                if with_content:
                    res.append(content)
            else:
                res.append(self.header_prefix * level + " " + header + "\n")
                if with_content:
                    res.append(content)

            children = root["children"] if "children" in root else []
            for child in children:
                dfs(child, level + 1, res)

        lines = []
        dfs(self.data, 0, lines)
        return lines

    def is_header(self, line, level=None):
        if not line.startswith(self.header_prefix):
            return False
        if len(line.split()) <= 1:
            return False
        stars = line.split()[0]
        if level:
            return (
                list(set(stars)) == [self.header_prefix]
                and len(stars) == level
            )
        else:
            return list(set(stars)) == [self.header_prefix]

    def merge(self, other, by="id"):
        """
        merge other tree into self.data
        by:  id or topic
        """

        lookup = {}

        def build_map(root):
            lookup[root[by]] = root
            for node in root.get("children", []):
                build_map(node)

        build_map(self.data)

        def _merge(root):
            if root[by] in lookup:
                if "content" in root:
                    lookup[root[by]]["content"] = root["content"]
            for node in root.get("children", []):
                _merge(node)

        _merge(other.data)

    def path_finder(self, target_id):
        """
        traverse emm tree to get the topic path from root to target_id
        """
        res, path = [], []

        def dfs(root, level=0):
            if root["id"] == target_id:
                res.append(list(path))
            elif "children" in root:
                for node in root["children"]:
                    path.append(
                        self.header_prefix * (level + 1) + " " + node["topic"]
                    )
                    dfs(node, level + 1)
                    path.pop()

        dfs(self.data)
        return res[0]
def generate_id():
    return str(random.random())[2:]
if __name__ == "__main__":
    parser = OrgParser("test")
    with open("test.org", "r") as f:
        parser.parse_lines(f.readlines())

    emm_json = json.dumps(parser.to_emm())
    print(emm_json)