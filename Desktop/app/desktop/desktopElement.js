/**
 * Created by Administrator on 2014/9/29.
 */
define(function(require, exports, module){

    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var application_tpl = require("application_tpl");

    var elBase = require("app/desktop/desktopElBase");
    var application  = require("app/desktop/desktopApplication");
    var composite  = require("app/desktop/desktopComposite");
    var foldermin = require("app/desktop/desktopFolderMin");
    var foldermax  = require("app/desktop/desktopFolderMax");

    /*
     * 桌面组件视图
     * */
    var DesktopElementsView = Backbone.View.extend({
        events:{
            "click .layer_element":"elementClick"
        },
        /*
         * 桌面组件模型绑定
         * */
        setModel: function (layer,model) {
            this.model = model;
            this.layer = layer;

            this.listenTo(this.model, 'add', this.addElement);
            this.listenTo(this.model, 'remove', this.removeElement);
            this.listenTo(this.model, "change", this.propertyChange);

            this.render();

            var view = this;
            var desktopId = this.layer.get("id");
            //整理桌面-右键菜单
            PubSub.subscribe([desktopId,config.TidyElmentsEvent].join("."),function(message,data){
                view.tidyElements(data);
            });

            PubSub.subscribe([desktopId,config.ToAllElementTopEvent].join("."),function(message,data){
                view.toElementsTop(data);
            });

            //移除应用
            PubSub.subscribe([desktopId,config.RemoveDesktopElementEvent].join("."),function(message,data){
                view.model.remove(data);
                view.reSorAllColumn();
            });

            //桌面添加应用
            PubSub.subscribe([desktopId,config.CreateDesktopElementEvent].join("."),function(message,data){
                view.model.add(data);
                view.reSorAllColumn();
            });

            //重置网格布局排序操作
            PubSub.subscribe([desktopId,config.ResetSortableCellEvent].join("."),function(message,data){
                config.IsInitFinish = false;
                view.reSorAllColumn();
                config.IsInitFinish = true;

                seajs.log("ResetSortableCellEvent cause changed");
                PubSub.publishSync(config.DesktopIsChangedEvent);
            });

            //应用按系统分组
            PubSub.subscribe([desktopId,config.GroupAppToFolderEvent].join("."),function(message,data){

                // 目前只分组应用
                // 先分组再整理桌面
                if(view.model.length>0){
                    var groupElements = _.groupBy(view.model.where({"appType":config.ElementType.Application}), function(element) {
                        return element.get("systemId");
                    });

                    $.each(groupElements,function(index,group){
                        var flag = false;//如果是本地通应用程序就不分组
                        $.each(group,function(n,app){
                            seajs.log("opentype====="+app.get("openType"));
                            if(app.get("openType")==7){flag = true;return;}
                            view.model.remove(app);
                        });
                        if(flag)return;

                        var name = index;
                        var systems = _.where(config.AllSystems,{"SystemID":index});
                        if(systems && systems.length > 0){
                            name = systems[0].SystemName;
                        }

                        var existFolders = util.getActiveLayer().find(".g_file");
                        var isHaveExistFolder = null;
                        existFolders.each(function(i,v){

                            var data = $(v).data("data");
                            if(data.get("name")==name){
                                isHaveExistFolder = $(v);
                                return;
                            }
                        });
                        if(isHaveExistFolder!=null){
                            var data = isHaveExistFolder.data("data");

                            $.each(group, function(i, app){
                                if(app.get("openType")==7){return;}
                                data.get("folderApps").add(app.clone());

                            });
                            PubSub.publishSync(config.DesktopIsChangedEvent);
                            return;
                        }

                        var folder = new foldermax.DesktopFolderMax();
                        var folderId = "F" + util.getNewId();
                        var folderApps = new elBase.DesktopElements();
                        var postion = {
                            left:0,
                            top:0,
                            width:util.postion.Param.Folder.Width,
                            height:util.postion.Param.Folder.Height
                        };
                        var toPos = util.postion.checkBoundary(postion,{top:util.postion.Param.Folder.MarginTop,bottom:util.postion.Param.Folder.MarginBottom});
                        folder.set({
                            id: folderId,
                            appId: folderId,
                            name: name,
                            appType:config.ElementType.Folder,
                            index:0,
                            position: toPos,
                            folderType:config.FolderType_MAX,
                            folderLayout:config.FolderLayout_Grid,
                            folderApps: folderApps
                        });

                        $.each(group, function(i, app){
                            if(app.get("openType")==7){return;}
                            folderApps.add(app.clone());
                        });

                        PubSub.publishSync([desktopId,config.CreateDesktopFloatEvent].join("."),folder);
                    });

                    config.IsInitFinish = false;

                    if(config.CurrentLayoutType == config.LayoutType.Grid){
                        view.reSorAllColumn();
                    }

                    config.IsInitFinish = true;

                    seajs.log("GroupAppToFolderEvent cause changed");
                    PubSub.publishSync(config.DesktopIsChangedEvent);
                }

                setTimeout(function(){
                    PubSub.publishSync([desktopId,config.TidyDesktopEvent].join("."));
                },300);
            });


        },
        /*
         * 渲染桌面组件
         * */
        render:function(){
            this.model.each(this.addElement, this);
        },
        /*
         * 添加桌面组件
         * */
        addElement: function (element) {
            if(element.get("appType") == config.ElementType.Application){
                element.view = new application.DesktopApplicationView();
            }else if(element.get("appType") == config.ElementType.Composite){
                element.view = new composite.DesktopCompositeView();
            }else if(element.get("appType") == config.ElementType.Folder){
                element.view = new foldermin.DesktopFolderMinView();
            }
            element.view.setModel(this.layer,this.$el,element,this);

            if(config.CurrentLayoutType == config.LayoutType.Free){
                this.addToDragCell(element.view.$el);
            }else{
                element.view.$el.css({"left":"0px","top":"0px","position":"relative"});
                this.addToSortableCell(element.view.$el);
            }

            element.view.$el.data("data",element); //元素数据
            element.view.$el.data("from","desktop"); //元素位置
            element.view.$el.data("desktop",this.layer.get("id")); //元素桌面

            element.view.$el.hide().fadeIn();

            seajs.log("addElement cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 移除桌面组件
         * */
        removeElement:function(element){
            if(element.view){
                element.view.destroy();
            }
            seajs.log("removeElement cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 属性变更，保存桌面
         * */
        propertyChange:function(){
            seajs.log("propertyChange cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 释放视图
         * */
        destroy: function() {
            this.remove();
        },
        /*
         * 添加拖拽元素
         * */
        addToDragCell:function($element){
            this.$el.append($element);
            this.dragElementEvent($element);
        },
        /*
         * 添加排序元素
         * */
        addToSortableCell:function($element){
            var $column = this.getLastCanUseColumn();
            $column.append($element);
        },
        /*
         * 获取最后可使用的列
         * */
        getLastCanUseColumn:function(){
            var layerId =  this.layer.get("id");
            var $canUserColumn = $('<div class="desktop_layer_row layer_row_'+layerId +'"></div>');
            var layerColumnCount = this.$el.find(">.desktop_layer_row").length;
            if(layerColumnCount <= 0){
                this.$el.append($canUserColumn);
                this.sortableColumn($canUserColumn);
                $canUserColumn.css({
                    top: util.postion.Param.SortableColumn.Top,
                    left: util.postion.Param.SortableColumn.Left,
                    width: util.postion.Param.SortableColumn.Width,
                    height: util.postion.Param.SortableColumn.Height
                });
            }else{
                var $lastColumn = this.$el.find("> .desktop_layer_row:last");
                var n = this.$el.find("> .desktop_layer_row").length;
                if($lastColumn.find("> .layer_element").length >= util.postion.Param.SortableColumn.ElementCount){
                    this.$el.append($canUserColumn);
                    this.sortableColumn($canUserColumn);
                    $canUserColumn.css({
                        top: util.postion.Param.SortableColumn.Top,
                        left:util.postion.Param.SortableColumn.Left + n * util.postion.Param.SortableColumn.Width,
                        width: util.postion.Param.SortableColumn.Width,
                        height: util.postion.Param.SortableColumn.Height
                    });
                }else{
                    $canUserColumn = $lastColumn;
                }
            }
            return $canUserColumn;
        },
        /*
         * 应用排序
         * */
        sortableColumn:function($column){
            var view = this;
            $column.sortable({
                connectWith:".layer_row_" + view.layer.get("id"),
                placeholder:"sortable_placeholder layer_element",
                dropOnEmpty:true,
                scroll:false,
                scrollSensitivity:0,
                start:function(event,ui){
                    config.OverLayer.IsELementMoving = true;
                    config.OverLayer.DragOverUi = ui;
                    config.OverLayer.DragOverOrigin = $column;

                    //最小化文件夹下拉与排序的修复
                    ui.item.data("moving",true);

                    ui.placeholder.attr("style",ui.item.attr("style")).css({"position":"relative"});
                    PubSub.publishSync(config.HideDesktopPopThings);

                    config.IsInitFinish = false;
                },
                out:function(event,ui){
                    view.reSorChangedColumn();
                },
                over:function(event,ui){
                    view.reSorChangedColumn();
                },
                //效率不高
                /*sort:function(event,ui){
                    view.reSorChangedColumn();
                },*/
                receive:function(event,ui){
                    view.reSorChangedColumn();
                },
                stop:function(event,ui){
                    config.OverLayer.IsELementMoving = false;
                    config.OverLayer.DragOverUi = null;
                    config.OverLayer.DragOverOrigin = null;

                    ui.item.hide().fadeIn();

                    view.reSorAllColumn();
                    config.IsInitFinish = true;

                    seajs.log("sortableColumn cause changed");
                    PubSub.publishSync(config.DesktopIsChangedEvent);

                    setTimeout(function(){
                        ui.item.data("moving",false);

                        //Fix dropable hoverclass
                        view.$el.find(".foldermin_candrop").removeClass("foldermin_candrop")
                    },300);
                }
            });
        },
        /*
         * 重新排序
         * */
        reSorChangedColumn:function(){
            var view = this;
            var $allSortableColumn = this.$el.find("> .desktop_layer_row");
            $allSortableColumn.each(function(i,v){
                var elementCount = $(v).find("> div.layer_element").not(".ui-sortable-helper").length;
                if(elementCount < util.postion.Param.SortableColumn.ElementCount){
                    var $nextElement = $(v).nextAll(".desktop_layer_row").first().find("> div.layer_element").not(".ui-sortable-helper").first();
                    $nextElement.detach();
                    $(v).append($nextElement);
                    //$nextElement.hide().fadeIn();
                }else if(elementCount > util.postion.Param.SortableColumn.ElementCount){
                    var $lastELement = $(v).find("> div.layer_element").not(".ui-sortable-helper").last();
                    $lastELement.detach();
                    var $nextColumn = $(v).nextAll(".desktop_layer_row").first();
                    if( $nextColumn.length == 0){
                        $nextColumn = view.getLastCanUseColumn();
                    }
                    $nextColumn.prepend($lastELement);
                    //$lastELement.hide().fadeIn();
                }
                if($(v).find("> div.layer_element").length <= 0){
                    $(v).remove();
                }
            });
            this.computeCellIndexAndPostion();
        },
        /*
         * 重新排序
         * */
        reSorAllColumn:function(){
            var view = this;
            var $allSortableColumn = this.$el.find("> .desktop_layer_row");
            var $allSortableElement = $allSortableColumn.find("> div.layer_element");
            //$allSortableColumn.find(".sortable_placeholder").remove();
            var detachElements = [];
            $allSortableElement.each(function(i,el){
                var $el = $(el);
                $el.detach();
                detachElements.push($el);
            });
            $allSortableColumn.remove();
            $.each(detachElements,function(i,$el){
                view.addToSortableCell($el);
            });
            this.computeCellIndexAndPostion();
        },
        /*
        * 元素点击
        * */
        elementClick:function(event){
            var $element = $(event.currentTarget);
            this.toElementsTop($element);
        },
        /*
         * 计算布局
         * */
        computeCellIndexAndPostion:function(){
            config.IsInitFinish = false;

            var $allSortableColumn = this.$el.find("> .desktop_layer_row");
            $allSortableColumn.each(function(i,col){
                var $sortableElement = $(col).find("> div.layer_element").not(".sortable_placeholder");
                $sortableElement.each(function(j,el){
                    var element = $(el).data("data");
                    element.set("index", i * util.postion.Param.SortableColumn.ElementCount + j);
                    element.set("position",{
                        width:util.postion.Param.Element.Width,
                        height:util.postion.Param.Element.Height,
                        top: $(el).offset().top,
                        left: $(el).offset().left
                    })
                });
            });
            this.model.sort();

            config.IsInitFinish = true;

            seajs.log("computeCellIndexAndPostion cause changed");
            PubSub.publishSync(config.DesktopIsChangedEvent);
        },
        /*
         * 拖拽事件
         * */
        dragElementEvent:function($element){
            var view = this;
            //拖拽支持
            $element.draggable({
                cursor: "pointer",
                start: function (event, ui) {
                    view.toElementsTop($element);
                    config.IsELementMoving = true;
                    $element.data("moving",true);
                    //移除弹出文件夹
                    PubSub.publish([util.getActiveLayerId(),config.RemovePopFolderEvent].join("."));
                },
                drag: function (event, ui) {
                },
                stop: function (event, ui) {
                    var element = $element.data("data");
                    var elementId = element.get("id");
                    //从应用集合移除则不执行逻辑，如拖入文件夹
                    if(view.model.where({id:elementId }).length > 0){
                        var pos = {
                            top : ui.position.top,
                            left : ui.position.left
                        };
                        var toPos = util.postion.checkBoundary(pos);
                        ui.helper.animate({left:toPos.left,top:toPos.top});
                        element.set("position", toPos);
                    }
                    setTimeout(function(){
                        config.IsELementMoving = false;
                        $element.data("moving",false);
                    },300);
                }
            }).data("from","desktop");
        },
        /*
         * 元素置顶
         * */
        toElementsTop:function($element){
            var maxIndex = 0;
            this.$el.find(".layer_element").each(function(){
                var index = $(this).css("z-index");
                index = isNaN(index) ? 1 : index;
                maxIndex = Math.max(maxIndex,index);
            });
            $element.css("z-index", ++maxIndex);
        },
        /*
         * 整理桌面
         * */
        tidyElements:function(position){

        }
    });

    module.exports = {
        DesktopElement: elBase.DesktopElement,
        DesktopElements: elBase.DesktopElements,
        DesktopElementsView: DesktopElementsView
    };
});