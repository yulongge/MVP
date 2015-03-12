/*
* Create by 盖玉龙 on 2014-10-14
*/
define(function(){
       var strVar ="";
            strVar +="<div class=\"desktop_window\" style=\"width:420px; height:230px;\">";
            strVar +="    <div class=\"window_header\">";
            strVar +="        <div class=\"window_header_title window_header_title1\"><%=title%><\/div>";
            strVar +="        <div class=\"window_header_oper\"><a href=\"javascript:void(0)\" class=\"oper3\" title=\"关闭\"><\/a><\/div>";
            strVar +="   <\/div>";
            strVar +="    <div class=\"window_main\">";
            strVar +="       <div class=\"config_shade_con\">";
            strVar +="            <dl>";
            strVar +="                <dt><img src=\"static\/images\/config_delete_shade.png\" \/><\/dt>";
            strVar +="                <dd><h3 style=\"margin-right:20px;\"><%=msg%><\/h3><\/dd>";
            strVar +="            <\/dl>";
            strVar +="         <\/div>";
            strVar +="         <div class=\"window_btn_wrap\">";
            strVar +="            <div class=\"bg\"><a href=\"javascript:void(0)\" class=\"window_gray\">取消<\/a><a href=\"javascript:void(0)\" class=\"window_blue\">确定<\/a><\/div>";
            strVar +="       <\/div>";
            strVar +="    <\/div>";
            strVar +=" <\/div>";
    return strVar; 
});