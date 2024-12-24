(function(){
    var jm = window.jsMind;
    jm.mind = function(){
        this.name = null;
        this.author = null;
        this.version = null;
        this.root = null;
        this.selected = null;
        this.nodes = {};
    };

    jm.mind.prototype = {
        get_node:function(nodeid){
            if(nodeid in this.nodes){
                return this.nodes[nodeid];
            }else{
                logger.warn('the node[id='+nodeid+'] can not be found');
                return null;
            }
        },

        set_root:function(nodeid, topic, data){
            if(this.root == null){
                this.root = new jm.node(nodeid, 0, topic, data, true);
                this._put_node(this.root);
            }else{
                logger.error('root node is already exist');
            }
        },

        add_node:function(parent_node, nodeid, topic, data, idx, direction, expanded){
            if(!jm.util.is_node(parent_node)){
                var the_parent_node = this.get_node(parent_node);
                if(!the_parent_node){
                    logger.error('the parent_node[id='+parent_node+'] can not be found.');
                    return null;
                }else{
                    return this.add_node(the_parent_node, nodeid, topic, data, idx, direction, expanded);
                }
            }
            var nodeindex = idx || -1;
            var node = null;
            if(parent_node.isroot){
                var d = jm.direction.right;
                if(isNaN(direction)){
                    var children = parent_node.children;
                    var children_len = children.length;
                    var r = 0;
                    for(var i=0;i<children_len;i++){if(children[i].direction === jm.direction.left){r--;}else{r++;}}
                    d = (children_len > 1 && r > 0) ? jm.direction.left : jm.direction.right
                }else{
                    d = (direction != jm.direction.left) ? jm.direction.right : jm.direction.left;
                }
                node = new jm.node(nodeid,nodeindex,topic,data,false,parent_node,d,expanded);
            }else{
                node = new jm.node(nodeid,nodeindex,topic,data,false,parent_node,parent_node.direction,expanded);
            }
            if(this._put_node(node)){
                parent_node.children.push(node);
                this._reindex(parent_node);
            }else{
                logger.error('fail, the nodeid \''+node.id+'\' has been already exist.');
                node = null;
            }
            return node;
        },

        insert_node_before:function(node_before, nodeid, topic, data){
            if(!jm.util.is_node(node_before)){
                var the_node_before = this.get_node(node_before);
                if(!the_node_before){
                    logger.error('the node_before[id='+node_before+'] can not be found.');
                    return null;
                }else{
                    return this.insert_node_before(the_node_before, nodeid, topic, data);
                }
            }
            var node_index = node_before.index-0.5;
            return this.add_node(node_before.parent, nodeid, topic, data, node_index);
        },

        get_node_before:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return null;
                }else{
                    return this.get_node_before(the_node);
                }
            }
            if(node.isroot){return null;}
            var idx = node.index - 2;
            if(idx >= 0){
                return node.parent.children[idx];
            }else{
                return null;
            }
        },

        insert_node_after:function(node_after, nodeid, topic, data){
            if(!jm.util.is_node(node_after)){
                var the_node_after = this.get_node(node_before);
                if(!the_node_after){
                    logger.error('the node_after[id='+node_after+'] can not be found.');
                    return null;
                }else{
                    return this.insert_node_after(the_node_after, nodeid, topic, data);
                }
            }
            var node_index = node_after.index + 0.5;
            return this.add_node(node_after.parent, nodeid, topic, data, node_index);
        },

        get_node_after:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return null;
                }else{
                    return this.get_node_after(the_node);
                }
            }
            if(node.isroot){return null;}
            var idx = node.index;
            var brothers = node.parent.children;
            if(brothers.length >= idx){
                return node.parent.children[idx];
            }else{
                return null;
            }
        },

        move_node:function(node, beforeid, parentid, direction){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return null;
                }else{
                    return this.move_node(the_node, beforeid, parentid, direction);
                }
            }
            if(!parentid){
                parentid = node.parent.id;
            }
            return this._move_node(node, beforeid, parentid, direction);
        },

        _flow_node_direction:function(node,direction){
            if(typeof direction === 'undefined'){
                direction = node.direction;
            }else{
                node.direction = direction;
            }
            var len = node.children.length;
            while(len--){
                this._flow_node_direction(node.children[len],direction);
            }
        },

        _move_node_internal:function(node, beforeid){
            if(!!node && !!beforeid){
                if(beforeid == '_last_'){
                    node.index = -1;
                    this._reindex(node.parent);
                }else if(beforeid == '_first_'){
                    node.index = 0;
                    this._reindex(node.parent);
                }else{
                    var node_before = (!!beforeid)?this.get_node(beforeid):null;
                    if(node_before!=null && node_before.parent!=null && node_before.parent.id==node.parent.id){
                        node.index = node_before.index - 0.5;
                        this._reindex(node.parent);
                    }
                }
            }
            return node;
        },

        _move_node:function(node, beforeid, parentid, direction){
            if(!!node && !!parentid){
                if(node.parent.id != parentid){
                    // remove from parent's children
                    var sibling = node.parent.children;
                    var si = sibling.length;
                    while(si--){
                        if(sibling[si].id == node.id){
                            sibling.splice(si,1);
                            break;
                        }
                    }
                    node.parent = this.get_node(parentid);
                    node.parent.children.push(node);
                }

                if(node.parent.isroot){
                    if(direction == jsMind.direction.left){
                        node.direction = direction;
                    }else{
                        node.direction = jm.direction.right;
                    }
                }else{
                    node.direction = node.parent.direction;
                }
                this._move_node_internal(node, beforeid);
                this._flow_node_direction(node);
            }
            return node;
        },

        remove_node:function(node){
            if(!jm.util.is_node(node)){
                var the_node = this.get_node(node);
                if(!the_node){
                    logger.error('the node[id='+node+'] can not be found.');
                    return false;
                }else{
                    return this.remove_node(the_node);
                }
            }
            if(!node){
                logger.error('fail, the node can not be found');
                return false;
            }
            if(node.isroot){
                logger.error('fail, can not remove root node');
                return false;
            }
            if(this.selected!=null && this.selected.id == node.id){
                this.selected = null;
            }
            // clean all subordinate nodes
            var children = node.children;
            var ci = children.length;
            while(ci--){
                this.remove_node(children[ci]);
            }
            // clean all children
            children.length = 0;
            // remove from parent's children
            var sibling = node.parent.children;
            var si = sibling.length;
            while(si--){
                if(sibling[si].id == node.id){
                    sibling.splice(si,1);
                    break;
                }
            }
            // remove from global nodes
            delete this.nodes[node.id];
            // clean all properties
            for(var k in node){
                delete node[k];
            }
            // remove it's self
            node = null;
            //delete node;
            return true;
        },

        _put_node:function(node){
            if(node.id in this.nodes){
                logger.warn('the nodeid \''+node.id+'\' has been already exist.');
                return false;
            }else{
                this.nodes[node.id] = node;
                return true;
            }
        },

        _reindex:function(node){
            if(node instanceof jm.node){
                node.children.sort(jm.node.compare);
                for(var i=0;i<node.children.length;i++){
                    node.children[i].index = i+1;
                }
            }
        },
    };

})()