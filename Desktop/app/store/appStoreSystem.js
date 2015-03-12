/**
 * Created by 盖玉龙 on 2014/10/13. 应用中心系统菜单
 */
define(function(require, exports, module) {
    seajs.log("初始化：" + module.id);

    var util = require("app/util");
    var config = require("app/config");

    var appStoreSystem_tpl = require("appStoreSystem_tpl");
    var appStoreField_tpl = require("appStoreField_tpl");


    /*
     * 系统菜单
     * */
    var AppStoreField = Backbone.Model.extend({defaults:{
        id:"",
        fieldId:"",
        fieldName:"",
        num:0
    }});

    /*
     *系统菜单集合
     */
    var AppStoreFields = Backbone.Collection.extend({
        model:AppStoreField
    });

    /*
     * 系统菜单
     * */
    var AppStoreSystem = Backbone.Model.extend({defaults:{
    	id:"",
        systemId:"",
        systemName:"",
    	num:0
    }});

    /*
     *系统菜单集合
    */
    var AppStoreSystems = Backbone.Collection.extend({
        model:AppStoreSystem
    });

    /*
     * 系统菜单视图
    */
    var AppStoreSystemsView = Backbone.View.extend({
        templateSystem:_.template(appStoreSystem_tpl),
        templateField:_.template(appStoreField_tpl),
        events:{
            "click li.li_field":"appStoreFieldClick",
            "click li.li_system":"appStoreSystemClick"
            //"click li.li_field span":"showOrHideField"
        },
        setModel:function(fields,systems){
            this.modelField = fields;
            this.modelSystem = systems;
            this.listenTo(this.modelField, 'add', this.addField);
            this.listenTo(this.modelField, 'reset', this.resetField);
            this.listenTo(this.modelSystem, 'add', this.addSystem);
            this.listenTo(this.modelSystem, 'reset', this.resetSystem);
            this.renderField();
            this.renderSystem();

            var view = this;
            //复合应用销毁逻辑
            PubSub.unsubscribe(config.DestroyStoreSystemEvent);
            PubSub.subscribe(config.DestroyStoreSystemEvent,function(message,data){
                view.destroy();
            });
        },
        destroy: function() {
            this.stopListening();
            this.undelegateEvents();
            this.$el.empty();
        },
        appStoreFieldClick:function(event){
            event.stopPropagation();
            this.$el.find("li").removeClass("active");
            this.$el.find("li").removeClass("active_btn");
            var $element = $(event.currentTarget);
			if($element.find("ul").is(":visible")){
				$element.find("ul").hide();
				$element.removeClass("active_btn");
			}else{
				$element.addClass("active");
				$element.find("ul").show();
				var element = $element.data("data");
				var fieldId = element.get("fieldId");
				//加载业务域下应用
				this.changeAppStoreListField(fieldId);	
				$(".guid_tip1").hide();
				$(".guid_tip2").show();
			}
            
        },
        showOrHideField:function(event){
            event.stopPropagation();
            var $element = $(event.currentTarget);
            if( $element.parent().next().is(":visible")){
                $element.parent().next().hide();
                $element.parent().parent().removeClass("active");
                $element.parent().parent().removeClass("active_btn");
            }else{
                $element.parent().parent().trigger("click");
                $element.parent().next().show();
            }
        },
        appStoreSystemClick:function(event){
            event.stopPropagation();
            this.$el.find("li").removeClass("active");
            var $element = $(event.currentTarget);
            $element.addClass("active");
            $element.parent().parent().addClass("active_btn");

            var element = $element.data("data");
            var systemId = element.get("systemId");
            //加载系统下应用
            this.changeAppStoreListSystem(systemId);
            $(".guid_tip1").hide();
            $(".guid_tip2").show();
        },
        renderField:function(){
            this.$el.empty();
            this.modelField.each(this.addField,this);
        },
        renderSystem:function(){
            this.modelSystem.each(this.addSystem,this);
        },
        resetField:function(){
            this.$el.empty();
            this.render();
        },
        addField:function(element){
            var $element = $(this.templateField(element.attributes));
            this.$el.append($element);
            $element.data("data",element);
            if(element.isActive){
                $element.addClass("active");
                var fieldId = element.get("fieldId");
                this.changeAppStoreListField(fieldId);
            }
        },
        resetSystem:function(){
            this.$el.find("li.li_field ul").empty();
            this.$el.find("li.li_field ul").hide();
            this.renderSystem();
        },
        addSystem:function(element){
            var $element = $(this.templateSystem(element.attributes));
            this.$el.find("li.li_field.active ul").show();
            this.$el.find("li.li_field.active ul").append($element);
            $element.data("data",element);
        },
        changeAppStoreListField:function(fieldId){
            config.PageHelper.Type = "ListField";
            config.PageHelper.SystemId = "";
            config.PageHelper.FieldId = fieldId;
            config.PageHelper.SearchKey = "";
            config.PageHelper.PageIndex = 1;
            //并且加载业务域下系统
            $(".desktop_store .window_con_height").scrollTop(0);
            $(".desktop_store .search_input input").val("").trigger("change");
            $(".desktop_store .search_del").hide();
            $(".desktop_store .search_icon").show();
            PubSub.publishSync(config.GetSystemsByFieldId,fieldId);
            PubSub.publishSync(config.GetStoreType,fieldId);
        },
        changeAppStoreListSystem:function(systemId){
            config.PageHelper.Type = "ListSystem";
            config.PageHelper.SystemId = systemId;
            config.PageHelper.FieldId = "";
            config.PageHelper.SearchKey = "";
            config.PageHelper.PageIndex = 1;
            $(".desktop_store .window_con_height").scrollTop(0);
            $(".desktop_store .search_input input").val("").trigger("change");
            $(".desktop_store .search_del").hide();
            $(".desktop_store .search_icon").show();
            PubSub.publishSync(config.GetStoreType,systemId);
        }
    });

 

    module.exports = {
        AppStoreSystem:AppStoreSystem,
        AppStoreSystems:AppStoreSystems,
        AppStoreField:AppStoreField,
        AppStoreFields:AppStoreFields,
        AppStoreSystemsView:AppStoreSystemsView

    };
});