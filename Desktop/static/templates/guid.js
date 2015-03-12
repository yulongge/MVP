/*
 * Create by 盖玉龙 on 2014-10-21
 */
define(function(){
    var strVar  = "";

    strVar  +="<div class=\"desktop_window\" style=\"width:500px; height:308px;\">";
    strVar  +="    <div class=\"window_header\">";
    strVar  +="        <div class=\"window_header_title window_header_title1\">身份信息选择<\/div>";
    strVar  +="        <div class=\"window_header_oper\"><a href=\"javascript:void(0)\" class=\"oper3\" title=\"关闭\"><\/a><\/div>";
    strVar  +="    <\/div>";
    strVar  +="    <div class=\"window_main\">";
    strVar  +="        <div class=\"window_apply_form\">";
    strVar  +="            <div class=\"identity_label\"><span>*<\/span>所在供电所<\/div>";
    strVar  +="            <div class=\"window_sel\">";
    strVar  +="                <div class=\"window_clock_see city_select\">";
    strVar  +="                    <div class=\"window_clock_select_con\" style=\"width:140px;\">";
    strVar  +="                        <input type=\"hidden\" name=\"\" class=\"window_clock_input\" \/>";
    strVar  +="                        <div class=\"window_clock_txt\"  style=\"width:120px;\">选择地市<\/div>";
    strVar  +="                        <div class=\"window_clock_btn\"><\/div>";
    strVar  +="                        <ul class=\"window_clock_list window_clock_list1\">";
    strVar  +="                            <li>北京<\/li>";
    strVar  +="                        <\/ul>";
    strVar  +="                    <\/div>";
    strVar  +="                <\/div>";
    strVar  +="                <div class=\"window_clock_see country_select\">";
    strVar  +="                    <div class=\"window_clock_select_con\" style=\"width:140px;\">";
    strVar  +="                        <input type=\"hidden\" name=\"\" class=\"window_clock_input\" \/>";
    strVar  +="                        <div class=\"window_clock_txt\"  style=\"width:120px;\">选择区县<\/div>";
    strVar  +="                        <div class=\"window_clock_btn\"><\/div>";
    strVar  +="                        <ul class=\"window_clock_list window_clock_list1\">";
    strVar  +="                            <li>海淀区<\/li>";
    strVar  +="                        <\/ul>";
    strVar  +="                    <\/div>";
    strVar  +="                <\/div>";
    strVar  +="                <div class=\"window_clock_see powereds_select\">";
    strVar  +="                    <div class=\"window_clock_select_con\" style=\"width:140px;\">";
    strVar  +="                        <input type=\"hidden\" name=\"\" class=\"window_clock_input\" \/>";
    strVar  +="                        <div class=\"window_clock_txt\"  style=\"width:120px;\">选择班组/供电所<\/div>";
    strVar  +="                        <div class=\"window_clock_btn\"><\/div>";
    strVar  +="                        <ul class=\"window_clock_list window_clock_list1\">";
    strVar  +="                            <li>北京供电所<\/li>";
    strVar  +="                        <\/ul>";
    strVar  +="                    <\/div>";
    strVar  +="                <\/div>";
    strVar  +="            <\/div>";
/*    strVar  +="            <div class=\"identity_label\"><span>*<\/span>班组类型<\/div>";
    strVar  +="            <div class=\"window_sel\">";
    strVar  +="                <div class=\"window_clock_see teams_select\">";
    strVar  +="                    <div class=\"window_clock_select_con\" style=\"width:140px;\">";
    strVar  +="                        <input type=\"hidden\" name=\"\" class=\"window_clock_input\" \/>";
    strVar  +="                        <div class=\"window_clock_txt\"  style=\"width:120px;\">选择班组类型<\/div>";
    strVar  +="                        <div class=\"window_clock_btn\"><\/div>";
    strVar  +="                        <ul class=\"window_clock_list window_clock_list1\">";
    strVar  +="                            <li>北京供电所<\/li>";
    strVar  +="                        <\/ul>";
    strVar  +="                    <\/div>";
    strVar  +="                <\/div>";
    strVar  +="            <\/div>";*/
    strVar  +="            <div class=\"identity_label\"><span>*<\/span>所属分类<div class=\"identity_radio\">";
    strVar  +="                <input type=\"radio\" name=\"radio\" id=\"radio1\" class=\"radio\" value=true \/> 调度 ";
    strVar  +="                <input name=\"radio\" type=\"radio\" id=\"radio2\" class=\"radio\"  value=false checked=\"checked\" \/> 检修";
    strVar  +="                <input type=\"radio\" name=\"radio\" id=\"radio1\" class=\"radio\" value=true \/> 营销 ";
    strVar  +="                <input type=\"radio\" name=\"radio\" id=\"radio1\" class=\"radio\" value=true \/> 建设 ";
    strVar  +="                <input type=\"radio\" name=\"radio\" id=\"radio1\" class=\"radio\" value=true \/> 物资 ";
    strVar  +="                <input type=\"radio\" name=\"radio\" id=\"radio1\" class=\"radio\" value=true \/> 其他 ";
    strVar  +="           <\/div><\/div>";
    strVar  +="            <div class=\"window_remark\">选择信息后，将更加准确帮助您的日常工作。<\/div>";
    strVar  +="        </div>";
    strVar  +="        <div class=\"window_btn_wrap window_btn_wrap1\">";
    strVar  +="                     <a class=\"start_but\" href=\"javascript:void(0)\">开始使用<\/a>";
    strVar  +="        <\/div>";
    strVar  +="    <\/div>";
    strVar  +="<\/div>";

    return strVar;
});