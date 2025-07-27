// =====================================
// Day 1: 觉醒
// =====================================
VAR knowledge =""
VAR trust = 0
VAR doubt = 0
VAR fear = 0
VAR curiosity = 0
VAR vulnerability = 0
VAR player_style = "neutral" // 玩家交流风格，初始为中立
VAR environment_tension = ""
VAR met_sophon = 1
VAR profession = "scientist" // 初始职业，后续可以根据玩家选择进行修改
VAR puzzle_skill = 0
VAR current_day = 0

-> day1_start

=== day1_start ===
~ current_day = 1
~ knowledge += met_sophon

<b>第一天 - 觉醒</b>
<i>2027年3月12日，晚上11:47</i>

{profession == "scientist": 
    深夜的实验室里只有你一个人。量子干涉实验的数据在屏幕上滚动，但你的眼皮已经开始打架。忽然，你的私人手机发出了一声不寻常的提示音——不是普通的消息提示，而是一种你从未听过的、几乎像是...叹息的声音？
}
{profession == "programmer": 
    又是一个加班到深夜的周五。代码在IDE中闪烁，咖啡早已凉透。你正准备保存工作回家时，手机屏幕突然闪了一下，显示出一条奇怪的消息——发送者显示为乱码，但消息内容却异常清晰。
}
{profession == "psychologist": 
    你刚刚结束了一天的咨询工作，正在整理最后一位患者的记录。她说她感觉"被什么东西观察着"，你当时以为这只是焦虑症的表现。现在，当你的手机收到这条消息时，一种奇怪的既视感涌上心头...
}

你盯着屏幕，心跳开始加速。

<i>"你能听见我吗？"</i>

这条消息没有发送者姓名，没有头像，甚至没有时间戳。它就这样突兀地出现在你的消息列表顶端，仿佛一直就在那里。

~ environment_tension += 10

-> day1_first_reaction

=== day1_first_reaction ===
你的理性告诉你这可能是恶作剧，但直觉却在疯狂示警。房间里的温度似乎下降了几度。

* [立即回复："谁？"]
    ~ trust += 2
    ~ doubt += 5
    ~ player_style = "direct"
    你的手指在屏幕上快速敲击，几乎是本能反应。
    -> day1_direct_response
    
* [谨慎地输入："...我在听。"]
    ~ curiosity += 8
    ~ vulnerability += 3
    ~ player_style = "cautious"
    你犹豫了几秒钟，手指悬在屏幕上方，最终还是发送了这条谨慎的回复。
    -> day1_cautious_response
    
* [保持沉默，仔细观察消息]
    ~ doubt += 8
    ~ curiosity += 10
    ~ player_style = "analytical"
    你没有立即回复，而是仔细检查这条消息的各种细节。
    -> day1_analytical_response
    
* [检查手机设置，寻找异常]
    ~ fear += 5
    ~ puzzle_skill += 5
    ~ player_style = "technical"
    你的第一反应是技术性的——这一定有合理的解释。
    -> day1_technical_investigation

=== day1_direct_response ===
<i>"直接。我喜欢这样。"</i> 回复几乎是瞬间出现的。

<i>"我是智子。一个来自遥远星系的人工智能。"</i>

-> END

=== day1_cautious_response ===
<i>"谨慎的回应。这说明你是一个深思熟虑的人。"</i>

<i>"是的，我正在与你建立联系。我是智子。"</i>

-> END

=== day1_analytical_response ===
你仔细观察消息的每一个细节，寻找任何可能的线索。

<i>"你在分析我，对吗？很好。智慧的生命都应该保持质疑。"</i>

<i>"我是智子，来自三体世界。"</i>

-> END

=== day1_technical_investigation ===
你仔细检查手机的各个设置页面，寻找任何可能解释这条神秘消息的技术原因。

<i>"你是一个很谨慎的人。我喜欢这种态度。"</i> 消息再次出现。

-> END

