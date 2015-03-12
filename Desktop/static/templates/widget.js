/**
 * Created by Administrator on 2014/10/13.
 */
define(function() {
    var componentstr = "";
        componentstr +="<div class=\"layer_control layer_part widget\">";
        componentstr +="<div class=\"gtasks_box_01 assembly_box\">";
        componentstr +="<div class=\"title\"><span><%=name%><\/span><a href=\"javascript:void(0)\" class=\"renovate\"><\/a><a href=\"javascript:void(0)\" class=\"move\"><\/a><\/div>";
        componentstr +="<div class=\"iframe_part\">";
        componentstr +="<iframe src=\"<%=url%>\" width=\"100%\" height=\"100%\" frameborder=\"0\">";
        componentstr +="<\/iframe>";
        componentstr +=" <\/div>";
        componentstr +="<\/div>";
        componentstr +="<\/div>";
        return componentstr;
});