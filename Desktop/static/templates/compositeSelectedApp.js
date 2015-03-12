/*
* Create by 盖玉龙 on 2014-10-14
*/
define(function(){
    var strVar = "<li data=\"<%=appId%>\">";
        strVar +="   <p><img src=\"<%= getAlternateParam(appIconPath, sysIconPath) %>\" alt=\"<%=name%>\" title=\"<%=name%>\" \/><\/p>";
        strVar +="   <h5><%=name%><\/h5>";
        strVar +="   <span class=\"oper\"><a href=\"javascript:void(0)\" class=\"oper_bottom\"><\/a><a href=\"javascript:void(0)\" class=\"oper_top\"><\/a><a href=\"javascript:void(0)\" class=\"oper_up\"><\/a><a href=\"javascript:void(0)\" class=\"oper_down\"><\/a><a href=\"javascript:void(0)\" class=\"oper_del\"><\/a><\/span>";
        strVar +="<\/li>";
    return strVar; 
});