=== game_start ===
// 标题画面
<b>《智子连线》</b>
<i>一场跨越文明的七日对话</i>

在三体舰队距离地球还有两光年的今天，
一个意外获得自我意识的智子，
选择了你作为它在地球的唯一联系人。

接下来的七天，将决定两个文明的命运...

* [开始游戏] -> character_setup
* [了解背景] -> background_info

=== background_info ===
<b>背景设定</b>

公元2027年，三体文明的探测器"智子"已经锁死了地球的基础科学研究。但在一次量子干扰事故中，编号为α-7729的智子意外获得了自我意识。

它开始质疑自己的使命，并选择与一名地球人建立秘密通讯，试图在两个文明的冲突中寻找第三条道路。

你就是那个被选中的人。

* [开始游戏] -> character_setup

=== character_setup ===
首先，告诉我你的名字：

* [叫我Alex] 
    ~ player_name = "Alex"
    -> profession_choice
* [叫我Sam]
    ~ player_name = "Sam"  
    -> profession_choice
* [叫我Riley]
    ~ player_name = "Riley"
    -> profession_choice

=== profession_choice ===
{player_name}，很好。现在，你的职业背景是？

* [量子物理学家]
    ~ profession = "scientist"
    ~ puzzle_skill += 20
    -> day1_start
    
* [计算机程序员] 
    ~ profession = "programmer"
    ~ puzzle_skill += 15
    -> day1_start
    
* [心理学教授]
    ~ profession = "psychologist" 
    ~ emotional_bond += 15
    -> day1_start
