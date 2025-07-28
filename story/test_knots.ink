=== kitchen ===
你站在厨房里。阳光透过窗户洒进来。

"早上好！"玛丽亚向你打招呼。

* [回应问候] -> greet_maria
* [查看厨房] -> explore_kitchen
* [询问早餐] -> ask_breakfast

=== greet_maria ===
"早上好，玛丽亚！"你微笑着回应。

玛丽亚的脸上露出了满意的笑容。"今天天气真好，不是吗？"

* [同意天气很好] -> agree_weather
* [询问她的心情] -> ask_mood
* [回到厨房] -> kitchen

=== explore_kitchen ===
你环顾四周，厨房里整洁有序。

台面上放着新鲜的水果，炉子上煮着什么香气扑鼻的东西。

* [查看水果] -> check_fruit
* [闻闻炉子上的香味] -> smell_cooking
* [回到玛丽亚身边] -> kitchen

=== ask_breakfast ===
"有什么早餐吗？"你问道。

"当然！我正在做煎蛋和吐司。"玛丽亚说，"还有几分钟就好了。"

* [帮忙准备] -> help_cooking
* [等待] -> wait_breakfast
* [回到厨房] -> kitchen

=== agree_weather ===
"是的，天气确实很棒！"你看向窗外。

蓝天白云，微风轻抚。确实是个好天气。

* [继续聊天] -> continue_chat
* [回到厨房] -> kitchen

=== ask_mood ===
"你今天心情不错啊。"你观察着玛丽亚。

"是的，今天有好事要发生的感觉。"她神秘地眨眨眼。

* [询问什么好事] -> ask_good_news
* [回到厨房] -> kitchen

=== check_fruit ===
台面上摆着红苹果、香蕉和橙子。

看起来都很新鲜，让人食欲大开。

* [拿一个苹果] -> take_apple
* [回到厨房] -> kitchen

=== smell_cooking ===
你走近炉子，香味更浓了。

是煎蛋和培根的味道，还有咖啡的香气。

* [询问什么时候好] -> ask_when_ready
* [回到厨房] -> kitchen

=== help_cooking ===
"我来帮你吧！"你主动提出。

玛丽亚高兴地接受了你的帮助。

* [切吐司] -> cut_toast
* [准备餐具] -> set_table
* [回到厨房] -> kitchen

=== wait_breakfast ===
你决定耐心等待。

时间慢慢过去，香味越来越浓郁。

* [继续等待] -> breakfast_ready
* [回到厨房] -> kitchen

=== continue_chat ===
你们聊起了天气、生活和未来的计划。

时间在愉快的交谈中悄然流逝。

* [询问她的计划] -> ask_plans
* [分享你的计划] -> share_plans
* [回到厨房] -> kitchen

=== ask_good_news ===
"什么好事？能告诉我吗？"你好奇地询问。

"嗯...现在还不能说，但很快你就会知道的。"玛丽亚卖着关子。

* [继续追问] -> press_for_info
* [尊重她的保密] -> respect_secret
* [回到厨房] -> kitchen

=== take_apple ===
你拿起一个红苹果，咬了一口。

甜美的汁液在口中爆开，非常新鲜美味。

* [称赞苹果很甜] -> praise_apple
* [回到厨房] -> kitchen

=== ask_when_ready ===
"还要多久才好呢？"你问道。

"马上就好了，再等两分钟。"玛丽亚答道。

* [帮忙准备] -> help_cooking
* [回到厨房] -> kitchen

=== cut_toast ===
你帮忙切吐司，动作熟练。

"你很会做这些啊！"玛丽亚夸奖道。

* [谦虚回应] -> modest_response
* [回到厨房] -> kitchen

=== set_table ===
你开始摆放餐具，布置餐桌。

不一会儿，餐桌就变得整洁美观。

* [等待开餐] -> wait_to_eat
* [回到厨房] -> kitchen

=== breakfast_ready ===
"好了！"玛丽亚宣布早餐准备完毕。

热腾腾的煎蛋、脆脆的培根和香喷喷的咖啡摆上了桌。

* [开始享用] -> enjoy_breakfast
* [感谢玛丽亚] -> thank_maria

=== ask_plans ===
"你今天有什么计划吗？"你询问。

"我打算去市场买些新鲜蔬菜，然后可能去看望老朋友。"

* [提议一起去] -> suggest_together
* [回到厨房] -> kitchen

=== share_plans ===
你分享了自己今天的计划和想法。

玛丽亚认真地听着，时不时点头表示理解。

* [询问她的看法] -> ask_opinion
* [回到厨房] -> kitchen

=== press_for_info ===
"真的不能告诉我吗？我很好奇。"你继续询问。

玛丽亚笑着摇头："耐心一点，很快就知道了。"

* [放弃追问] -> give_up_asking
* [回到厨房] -> kitchen

=== respect_secret ===
"好吧，我会耐心等待的。"你理解地说。

"谢谢你的理解。"玛丽亚感激地说。

* [继续聊其他的] -> continue_chat
* [回到厨房] -> kitchen

=== praise_apple ===
"这苹果真甜！在哪买的？"你问道。

"是从果园直接买的，当然新鲜。"玛丽亚骄傲地说。

* [询问果园位置] -> ask_orchard
* [回到厨房] -> kitchen

=== modest_response ===
"还好啦，只是基本功。"你谦虚地回应。

"太谦虚了，你明明很厉害。"玛丽亚坚持夸奖。

* [接受夸奖] -> accept_praise
* [回到厨房] -> kitchen

=== wait_to_eat ===
一切准备就绪，你们坐下准备享用美味的早餐。

阳光透过窗户洒在餐桌上，一切都显得如此美好。

* [开始用餐] -> enjoy_breakfast
* [感谢这一刻] -> appreciate_moment

=== enjoy_breakfast ===
你开始享用这顿美味的早餐。

每一口都充满了幸福的味道。

这是美好一天的开始。

-> END

=== thank_maria ===
"谢谢你准备这么美味的早餐！"你真诚地感谢。

"不客气，能和你一起享受很开心。"玛丽亚微笑着说。

* [开始用餐] -> enjoy_breakfast

=== suggest_together ===
"要不我陪你一起去？"你提议。

"那太好了！有伴一起去会更有趣。"玛丽亚高兴地同意。

* [约定时间] -> plan_trip
* [回到厨房] -> kitchen

=== ask_opinion ===
"你觉得我的计划怎么样？"你询问她的看法。

玛丽亚仔细思考后给出了中肯的建议。

* [采纳建议] -> accept_advice
* [回到厨房] -> kitchen

=== give_up_asking ===
"好吧，我不问了。"你决定放弃。

"谢谢你的理解，真的很快就知道了。"玛丽亚安慰道。

* [回到厨房] -> kitchen

=== ask_orchard ===
"果园在哪里？听起来很不错。"你感兴趣地问。

"在城外大约十分钟车程的地方，风景很美。"

* [提议去看看] -> suggest_visit_orchard
* [回到厨房] -> kitchen

=== accept_praise ===
"谢谢夸奖！"你开心地接受了赞美。

气氛变得更加融洽愉快。

* [回到厨房] -> kitchen

=== appreciate_moment ===
你深深地感受着这个美好的时刻。

简单的早餐，温暖的陪伴，这就是生活的美好。

* [开始用餐] -> enjoy_breakfast

=== plan_trip ===
你们开始计划今天的市场之行。

"十点出发怎么样？"玛丽亚建议。

* [同意] -> agree_time
* [回到厨房] -> kitchen

=== accept_advice ===
"你说得很有道理，我会考虑的。"你接受了她的建议。

"很高兴能帮到你。"玛丽亚露出满意的笑容。

* [回到厨房] -> kitchen

=== suggest_visit_orchard ===
"改天能带我去看看吗？"你提议。

"当然可以！下个周末就很好。"玛丽亚愉快地答应。

* [约定下周末] -> plan_orchard_visit
* [回到厨房] -> kitchen

=== agree_time ===
"十点很好，我准时到。"你同意了时间安排。

"太好了！那我们一起度过愉快的一天。"

* [期待今天的行程] -> look_forward
* [回到厨房] -> kitchen

=== plan_orchard_visit ===
你们约定下个周末去果园游览。

"我会准备野餐食物的。"玛丽亚兴奋地说。

* [提议带相机] -> suggest_camera
* [回到厨房] -> kitchen

=== look_forward ===
"我很期待今天的市场之行。"你诚恳地说。

"我也是！会很有趣的。"玛丽亚充满期待。

* [回到厨房] -> kitchen

=== suggest_camera ===
"我可以带相机记录美好时光。"你建议。

"好主意！那里确实很适合拍照。"玛丽亚赞同。

* [回到厨房] -> kitchen