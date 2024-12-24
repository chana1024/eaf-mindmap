(function(){
    var jm = window.jsMind;
    jm.format = {
        node_tree:{
            example:{
                "meta":{
                    "name":jm.name,
                    "author":jm.author,
                    "version":jm.version
                },
                "format":"node_tree",
                "data":{"id":"root","topic":"Welcome to EAF MindMap"}
            },
            get_mind:function(source){
                var df = jm.format.node_tree;
                var mind = new jm.mind();
                mind.name = source.meta.name;
                mind.author = source.meta.author;
                mind.version = source.meta.version;
                df._parse(mind,source.data);
                return mind;
            },
            get_data:function(mind){
                var df = jm.format.node_tree;
                var json = {};
                json.meta = {
                    name : mind.name,
                    author : mind.author,
                    version : mind.version
                };
                json.format = 'node_tree';
                json.data = df._buildnode(mind.root);
                return json;
            },

            _parse:function(mind, node_root){
                var df = jm.format.node_tree;
                var data = df._extract_data(node_root);
                mind.set_root(node_root.id, node_root.topic, data);
                if('children' in node_root){
                    var children = node_root.children;
                    for(var i=0;i<children.length;i++){
                        df._extract_subnode(mind, mind.root, children[i]);
                    }
                }
            },

            _extract_data:function(node_json){
                var data = {};
                for(var k in node_json){
                    if(k == 'id' || k=='topic' || k=='children' || k=='direction' || k=='expanded'){
                        continue;
                    }
                    data[k] = node_json[k];
                }
                return data;
            },

            _extract_subnode:function(mind, node_parent, node_json){
                var df = jm.format.node_tree;
                var data = df._extract_data(node_json);
                var d = null;
                if(node_parent.isroot){
                    d = node_json.direction == 'left'?jm.direction.left:jm.direction.right;
                }
                var node = mind.add_node(node_parent, node_json.id, node_json.topic, data, null, d, node_json.expanded);
                if('children' in node_json){
                    var children = node_json.children;
                    for(var i=0;i<children.length;i++){
                        df._extract_subnode(mind, node, children[i]);
                    }
                }
            },

            _buildnode:function(node){
                var df = jm.format.node_tree;
                if(!(node instanceof jm.node)){return;}
                var o = {
                    id : node.id,
                    topic : node.topic,
                    expanded : node.expanded
                };
                if(!!node.parent && node.parent.isroot){
                    o.direction = node.direction == jm.direction.left?'left':'right';
                }
                if(node.data != null){
                    var node_data = node.data;
                    for(var k in node_data){
                        o[k] = node_data[k];
                    }
                }
                var children = node.children;
                if(children.length > 0){
                    o.children = [];
                    for(var i=0;i<children.length;i++){
                        o.children.push(df._buildnode(children[i]));
                    }
                }
                return o;
            }
        },

        node_array:{
            example:{
                "meta":{
                    "name":jm.name,
                    "author":jm.author,
                    "version":jm.version
                },
                "format":"node_array",
                "data":[
                    {"id":"root","topic":"Welcome to EAF MindMap", "isroot":true}
                ]
            },

            get_mind:function(source){
                var df = jm.format.node_array;
                var mind = new jm.mind();
                mind.name = source.meta.name;
                mind.author = source.meta.author;
                mind.version = source.meta.version;
                df._parse(mind,source.data);
                return mind;
            },

            get_data:function(mind){
                var df = jm.format.node_array;
                var json = {};
                json.meta = {
                    name : mind.name,
                    author : mind.author,
                    version : mind.version
                };
                json.format = 'node_array';
                json.data = [];
                df._array(mind,json.data);
                return json;
            },

            _parse:function(mind, node_array){
                var df = jm.format.node_array;
                var narray = node_array.slice(0);
                // reverse array for improving looping performance
                narray.reverse();
                var root_id = df._extract_root(mind, narray);
                if(!!root_id){
                    df._extract_subnode(mind, root_id, narray);
                }else{
                    logger.error('root node can not be found');
                }
            },

            _extract_root:function(mind, node_array){
                var df = jm.format.node_array;
                var i = node_array.length;
                while(i--){
                    if('isroot' in node_array[i] && node_array[i].isroot){
                        var root_json = node_array[i];
                        var data = df._extract_data(root_json);
                        mind.set_root(root_json.id,root_json.topic,data);
                        node_array.splice(i,1);
                        return root_json.id;
                    }
                }
                return null;
            },

            _extract_subnode:function(mind, parentid, node_array){
                var df = jm.format.node_array;
                var i = node_array.length;
                var node_json = null;
                var data = null;
                var extract_count = 0;
                while(i--){
                    node_json = node_array[i];
                    if(node_json.parentid == parentid){
                        data = df._extract_data(node_json);
                        var d = null;
                        var node_direction = node_json.direction;
                        if(!!node_direction){
                            d = node_direction == 'left'?jm.direction.left:jm.direction.right;
                        }
                        mind.add_node(parentid, node_json.id, node_json.topic, data, null, d, node_json.expanded);
                        node_array.splice(i,1);
                        extract_count ++;
                        var sub_extract_count = df._extract_subnode(mind, node_json.id, node_array);
                        if(sub_extract_count > 0){
                            // reset loop index after extract subordinate node
                            i = node_array.length;
                            extract_count += sub_extract_count;
                        }
                    }
                }
                return extract_count;
            },

            _extract_data:function(node_json){
                var data = {};
                for(var k in node_json){
                    if(k == 'id' || k=='topic' || k=='parentid' || k=='isroot' || k=='direction' || k=='expanded'){
                        continue;
                    }
                    data[k] = node_json[k];
                }
                return data;
            },

            _array:function(mind, node_array){
                var df = jm.format.node_array;
                df._array_node(mind.root, node_array);
            },

            _array_node:function(node, node_array){
                var df = jm.format.node_array;
                if(!(node instanceof jm.node)){return;}
                var o = {
                    id : node.id,
                    topic : node.topic,
                    expanded : node.expanded
                };
                if(!!node.parent){
                    o.parentid = node.parent.id;
                }
                if(node.isroot){
                    o.isroot = true;
                }
                if(!!node.parent && node.parent.isroot){
                    o.direction = node.direction == jm.direction.left?'left':'right';
                }
                if(node.data != null){
                    var node_data = node.data;
                    for(var k in node_data){
                        o[k] = node_data[k];
                    }
                }
                node_array.push(o);
                var ci = node.children.length;
                for(var i=0;i<ci;i++){
                    df._array_node(node.children[i], node_array);
                }
            },
        },

        freemind:{
            example:{
                "meta":{
                    "name":jm.name,
                    "author":jm.author,
                    "version":jm.version
                },
                "format":"freemind",
                "data":"<map version=\"1.0.1\"><node ID=\"root\" TEXT=\"freemind Example\"/></map>"
            },
            get_mind:function(source){
                var df = jm.format.freemind;
                var mind = new jm.mind();
                mind.name = source.meta.name;
                mind.author = source.meta.author;
                mind.version = source.meta.version;
                var xml = source.data;
                var xml_doc = df._parse_xml(xml);
                var xml_root = df._find_root(xml_doc);
                df._load_node(mind, null, xml_root);
                return mind;
            },

            get_data:function(mind){
                var df = jm.format.freemind;
                var json = {};
                json.meta = {
                    name : mind.name,
                    author : mind.author,
                    version : mind.version
                };
                json.format = 'freemind';
                var xmllines = [];
                xmllines.push('<map version=\"1.0.1\">');
                df._buildmap(mind.root, xmllines);
                xmllines.push('</map>');
                json.data = xmllines.join(' ');
                return json;
            },

            _parse_xml:function(xml){
                var xml_doc = null;
                if (window.DOMParser){
                    var parser = new DOMParser();
                    xml_doc = parser.parseFromString(xml,'text/xml');
                }else{ // Internet Explorer
                    xml_doc = new ActiveXObject('Microsoft.XMLDOM');
                    xml_doc.async = false;
                    xml_doc.loadXML(xml);
                }
                return xml_doc;
            },

            _find_root:function(xml_doc){
                var nodes = xml_doc.childNodes;
                var node = null;
                var root = null;
                var n = null;
                for(var i=0;i<nodes.length;i++){
                    n = nodes[i];
                    if(n.nodeType == 1 && n.tagName == 'map'){
                        node = n;
                        break;
                    }
                }
                if(!!node){
                    var ns = node.childNodes;
                    node = null;
                    for(var i=0;i<ns.length;i++){
                        n = ns[i];
                        if(n.nodeType == 1 && n.tagName == 'node'){
                            node = n;
                            break;
                        }
                    }
                }
                return node;
            },

            _load_node:function(mind, parent_id, xml_node){
                var df = jm.format.freemind;
                var node_id = xml_node.getAttribute('ID');
                var node_topic = xml_node.getAttribute('TEXT');
                // look for richcontent
                if(node_topic == null){
                    var topic_children = xml_node.childNodes;
                    var topic_child = null;
                    for(var i=0;i<topic_children.length;i++){
                        topic_child = topic_children[i];
                        //logger.debug(topic_child.tagName);
                        if(topic_child.nodeType == 1 && topic_child.tagName === 'richcontent'){
                            node_topic = topic_child.textContent;
                            break;
                        }
                    }
                }
                var node_data = df._load_attributes(xml_node);
                var node_expanded = ('expanded' in node_data)?(node_data.expanded == 'true') : true;
                delete node_data.expanded;

                var node_position = xml_node.getAttribute('POSITION');
                var node_direction = null;
                if(!!node_position){
                    node_direction = node_position=='left'?jm.direction.left:jm.direction.right;
                }
                //logger.debug(node_position +':'+ node_direction);
                if(!!parent_id){
                    mind.add_node(parent_id, node_id, node_topic, node_data, null, node_direction, node_expanded);
                }else{
                    mind.set_root(node_id, node_topic, node_data);
                }
                var children = xml_node.childNodes;
                var child = null;
                for(var i=0;i<children.length;i++){
                    child = children[i];
                    if(child.nodeType == 1 && child.tagName == 'node'){
                        df._load_node(mind, node_id, child);
                    }
                }
            },

            _load_attributes:function(xml_node){
                var children = xml_node.childNodes;
                var attr = null;
                var attr_data = {};
                for(var i=0;i<children.length;i++){
                    attr = children[i];
                    if(attr.nodeType == 1 && attr.tagName === 'attribute'){
                        attr_data[attr.getAttribute('NAME')] = attr.getAttribute('VALUE');
                    }
                }
                return attr_data;
            },

            _buildmap:function(node, xmllines){
                var df = jm.format.freemind;
                var pos = null;
                if(!!node.parent && node.parent.isroot){
                    pos = node.direction === jm.direction.left?'left':'right';
                }
                xmllines.push('<node');
                xmllines.push('ID=\"'+node.id+'\"');
                if(!!pos){
                    xmllines.push('POSITION=\"'+pos+'\"');
                }
                xmllines.push('TEXT=\"'+node.topic+'\">');

                // store expanded status as an attribute
                xmllines.push('<attribute NAME=\"expanded\" VALUE=\"'+node.expanded+'\"/>');

                // for attributes
                var node_data = node.data;
                if(node_data != null){
                    for(var k in node_data){
                        xmllines.push('<attribute NAME=\"'+k+'\" VALUE=\"'+node_data[k]+'\"/>');
                    }
                }

                // for children
                var children = node.children;
                for(var i=0;i<children.length;i++){
                    df._buildmap(children[i], xmllines);
                }

                xmllines.push('</node>');
            },
        },
    };
})()