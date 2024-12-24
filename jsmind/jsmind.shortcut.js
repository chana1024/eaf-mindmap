(function(){
    var jm = window.jsMind;
    // shortcut provider
    jm.shortcut_provider= function(jm, options){
        this.jm = jm;
        this.opts = options;
        this.mapping = options.mapping;
        this.handles = options.handles;
        this._mapping = {};
    };

    jm.shortcut_provider.prototype = {
        init : function(){
            jm.util.dom.add_event($d,'keydown',this.handler.bind(this));

            this.handles['addchild'] = this.handle_addchild;
            this.handles['addbrother'] = this.handle_addbrother;
            this.handles['editnode'] = this.handle_editnode;
            this.handles['delnode'] = this.handle_delnode;
            this.handles['toggle'] = this.handle_toggle;
            this.handles['up'] = this.handle_up;
            this.handles['down'] = this.handle_down;
            this.handles['left'] = this.handle_left;
            this.handles['right'] = this.handle_right;

            for(var handle in this.mapping){
                if(!!this.mapping[handle] && (handle in this.handles)){
                    this._mapping[this.mapping[handle]] = this.handles[handle];
                }
            }
        },

        enable_shortcut : function(){
            this.opts.enable = true;
        },

        disable_shortcut : function(){
            this.opts.enable = false;
        },

        handler : function(e){
            if(this.jm.view.is_editing()){return;}
            var evt = e || event;
            if(!this.opts.enable){return true;}
            var kc = evt.keyCode;
            if(kc in this._mapping){
                this._mapping[kc].call(this,this.jm,e);
            }
        },

        handle_addchild: function(_jm,e){
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                var nodeid = jm.util.uuid.newid();
                var node = _jm.add_node(selected_node, nodeid, 'Topic');
                if(!!node){
                    _jm.select_node(nodeid);
                    _jm.begin_edit(nodeid);
                }
            }
        },
        handle_addbrother:function(_jm,e){
            var selected_node = _jm.get_selected_node();
            if(!!selected_node && !selected_node.isroot){
                var nodeid = jm.util.uuid.newid();
                var node = _jm.insert_node_after(selected_node, nodeid, 'Topic');
                if(!!node){
                    _jm.select_node(nodeid);
                    _jm.begin_edit(nodeid);
                }
            }
        },
        handle_editnode:function(_jm,e){
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                _jm.begin_edit(selected_node);
            }
        },
        handle_delnode:function(_jm,e){
            var selected_node = _jm.get_selected_node();
            if(!!selected_node && !selected_node.isroot){
                _jm.select_node(selected_node.parent);
                _jm.remove_node(selected_node);
            }
        },
        handle_toggle:function(_jm,e){
            var evt = e || event;
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                _jm.toggle_node(selected_node.id);
                evt.stopPropagation();
                evt.preventDefault();
            }
        },
        handle_up:function(_jm,e){
            var evt = e || event;
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                var up_node = _jm.find_node_before(selected_node);
                if(!up_node){
                    var np = _jm.find_node_before(selected_node.parent);
                    if(!!np && np.children.length > 0){
                        up_node = np.children[np.children.length-1];
                    }
                }
                if(!!up_node){
                    _jm.select_node(up_node);
                }
                evt.stopPropagation();
                evt.preventDefault();
            }
        },

        handle_down:function(_jm,e){
            var evt = e || event;
            var selected_node = _jm.get_selected_node();
            if(!!selected_node){
                var down_node = _jm.find_node_after(selected_node);
                if(!down_node){
                    var np = _jm.find_node_after(selected_node.parent);
                    if(!!np && np.children.length > 0){
                        down_node = np.children[0];
                    }
                }
                if(!!down_node){
                    _jm.select_node(down_node);
                }
                evt.stopPropagation();
                evt.preventDefault();
            }
        },

        handle_left:function(_jm,e){
            this._handle_direction(_jm,e,jm.direction.left);
        },
        handle_right:function(_jm,e){
            this._handle_direction(_jm,e,jm.direction.right);
        },
        _handle_direction:function(_jm,e,d){
            var evt = e || event;
            var selected_node = _jm.get_selected_node();
            var node = null;
            if(!!selected_node){
                if(selected_node.isroot){
                    var c = selected_node.children;
                    var children = [];
                    for(var i=0;i<c.length;i++){
                        if(c[i].direction === d){
                            children.push(i)
                        }
                    }
                    node = c[children[Math.floor((children.length-1)/2)]];
                }
                else if(selected_node.direction === d){
                    var children = selected_node.children;
                    var childrencount = children.length;
                    if(childrencount > 0){
                        node = children[Math.floor((childrencount-1)/2)]
                    }
                }else{
                    node = selected_node.parent;
                }
                if(!!node){
                    _jm.select_node(node);
                }
                evt.stopPropagation();
                evt.preventDefault();
            }
        },
    };


})()