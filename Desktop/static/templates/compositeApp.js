/*
* Create by 盖玉龙 on 2014-10-14
*/
define(function(){
    var strVar  = "";
       
		strVar +="<div class=\"desktop_window step_1\" style=\"width:680px; height:380px;\">";
		strVar +="  <div class=\"window_header\">";
		strVar +="    <div class=\"window_header_title window_header_title1\">新建复合应用<\/div>";
		strVar +="    <div class=\"window_header_oper\"><a href=\"javascript:void(0)\" class=\"oper3\" title=\"关闭\"><\/a><\/div>";
		strVar +="  <\/div>";
		strVar +="  <div class=\"window_main\">";
		strVar +="    <div class=\"window_apply_form\">";
		strVar +="      <dl>";
		strVar +="        <dt class='app_name_title'>应用名称<\/dt>";
		strVar +="        <dd>"
		strVar +="          <input type=\"text\" class=\"window_input composite_name\" maxlength='10' style=\"width:380px;\">";
		strVar +="          <span class=\"window_tips\">建议1~10个汉字<\/span> <\/dd>";
		strVar +="      <\/dl>";
		strVar +="      <dl>";
		strVar +="        <dt class='app_icon_title'>选择图标<\/dt>";
		strVar +="        <dd>";
		strVar +="          <ul class=\"window_apply_list\">";
		strVar +="          <\/ul>";
		strVar +="        <\/dd>";
		strVar +="      <\/dl>";
		strVar +="      <dl>";
		strVar +="       <dt><\/dt>";
		strVar += "        <dd><a class=\"window_gray\" href=\"javascript:void(0)\">取 消<\/a><a class=\"window_green\" href=\"javascript:void(0)\" style=\"display:none;\">保 存<\/a><a class=\"window_blue\" href=\"javascript:void(0)\">添加应用<\/a><\/dd>";
		strVar +="      <\/dl>";
		strVar +="    <\/div>";
		strVar +="  <\/div>";
		strVar +="<\/div>";



    return strVar; 
});