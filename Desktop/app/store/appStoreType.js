/**
 * Created by 盖玉龙 on 2014/10/13. 应用中心tab菜单
 */
define(function(require, exports, module) {
    seajs.log("初始化：" + module.id);

    var config = require("app/config");

    var appStoreType_tpl = require("appStoreType_tpl");

	/*
     * 功能类型菜单
     * */
    var AppStoreType = Backbone.Model.extend({defaults:{
    	id:"",
        typeId:"",
        typeName:"",
        typeNum: 0,
        isSelected: false
    }});

    /*
     *功能类型菜单集合
    */
    var AppStoreTypes = Backbone.Collection.extend({
        model:AppStoreType
    });

    /*
     * 系统菜单视图
    */
    var AppStoreTypesView = Backbone.View.extend({
        templateType:_.template(appStoreType_tpl),
        events:{
            "click li":"appStoreTypeClick"
        },
        setModel:function(model){
            this.model = model;
            this.listenTo(this.model, 'add', this.addappType);
            this.listenTo(this.model, 'change:isSelected', this.appTypeChange);
            this.listenTo(this.model, 'reset', this.resetAppTypes);

            var view = this;
            //复合应用销毁逻辑
            PubSub.unsubscribe(config.DestroyStoreTypeEvent);
            PubSub.subscribe(config.DestroyStoreTypeEvent,function(message,data){
                view.destroy();
            });
        },
        destroy: function() {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
        },
        appStoreTypeClick:function(event){
            var $prevElement = this.$el.find("li.active");
            var prevElement = $prevElement.data("data");
            prevElement.set("isSelected",false);

            var $element = $(event.currentTarget);
            var element = $element.data("data");
            element.set("isSelected",true);
        },
        addappType:function(element){
            var $element = $(this.templateType(element.attributes));
            this.$el.append($element);
            if(element.get("isSelected")){
                $element.addClass("active");
                this.changeAppStoreList(element.get("typeNum"));
            }
            $element.data("data",element);
        },
        appTypeChange:function(element){
            var $element = this.$el.find("#" + element.get("id"));
            if(element.get("isSelected")){
                $element.addClass("active");
                this.changeAppStoreList(element.get("typeNum"));
            }else{
                $element.removeClass("active");
            }
        },
        resetAppTypes:function(){
            this.$el.empty();
        },
        changeAppStoreList:function(typeNum){

            if(config.PageHelper.Type == "Search"){
                if(config.PageHelper.FieldId != ""){
                    config.PageHelper.Type = "ListField";
                }
                if(config.PageHelper.SystemId != ""){
                    config.PageHelper.Type = "ListSystem";
                }
            }
            config.PageHelper.PageIndex = 1;
            config.PageHelper.AppType = typeNum;
            $(".desktop_store .window_con_height").scrollTop(0);
            $(".desktop_store .search_input input").val("").trigger("change");
            $(".desktop_store .search_del").hide();
            $(".desktop_store .search_icon").show();
            PubSub.publishSync(config.RestStorePagingEvent);
            PubSub.publishSync(config.AppStorePageEvent,typeNum);
        }
    });

    module.exports = {
        AppStoreType:AppStoreType,
        AppStoreTypes:AppStoreTypes,
        AppStoreTypesView:AppStoreTypesView
    };
});