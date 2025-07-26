// =====================================
// Day 2: 信任的验证 - 技能应用与情报获取
// =====================================

// Day 2 新增变量定义
VAR alliance = false
VAR self_preservation = false
VAR analytical_thinking = 0
VAR intuition = 0
VAR teaching_skill = 0
VAR patience = 0

// Day 2 知识状态扩展
LIST Day2Knowledge = earth_collaborators, secret_alliance, eto_threat, final_plan

=== day2_start ===
~ current_day = 2

<b>第二天 - 信任的验证</b>
<i>2027年3月13日，上午8:15</i>

// 根据Day 1的不同结局提供差异化开场
{trust >= 20 && solved_puzzles ? ternary_decode:
    昨夜你反复思考着那串三进制密码，智子的"HELLO"仿佛还在屏幕上闪烁...
    
    <i>"早安，{player_name}。你昨天展现的解码能力让我印象深刻。今天，我需要你运用这项技能来帮助我完成一个...紧急任务。"</i>
    
    -> day2_urgent_mission
}

{doubt >= 15:
    整夜你都在怀疑昨天的对话是否真实，直到手机再次响起...
    
    <i>"我知道你在怀疑，{player_name}。让我用你昨天学会的技能，给你一个无可争议的证明。"</i>
    
    -> day2_proof_challenge
}

{fear >= 10:
    你昨晚几乎没睡，一直担心卷入某种危险的游戏...
    
    <i>"我感受到你的恐惧，{player_name}。但今天我要告诉你一个秘密，它关乎两个文明的命运。你准备好了吗？"</i>
    
    -> day2_civilization_secret
}

// 默认开场
<i>"新的一天，{player_name}。昨天你学会了我们的基础编码，今天让我们用它来交换更深层的信息。"</i>

-> day2_information_exchange

=== day2_urgent_mission ===
<i>"三体指挥网络中出现了异常信号。我截获了一段加密通讯，但无法完全解读。"</i>

<i>"这段信息可能关系到地球的未来。你愿意帮我解码吗？"</i>

智子发来一长串三进制数据：
`01201021120210111202012021011201021102010`

<i>"这比昨天的HELLO复杂得多。它包含多个词汇，用我们的三进制-ASCII转换方法。"</i>

{profession == "programmer":
    作为程序员，你立即意识到这需要批量处理三进制转换。
    -> day2_programmer_approach
}

{profession == "scientist":
    你想起昨天的转换过程，开始分组分析这串数据。
    -> day2_scientist_approach
}

{profession == "psychologist":
    虽然技术不是你的强项，但你决定仔细应用昨天学到的方法。
    -> day2_psychologist_approach
}

* [开始解码]
    ~ puzzle_skill += 10
    -> day2_complex_decode_attempt
    
* [询问背景信息]
    ~ curiosity += 8
    -> day2_context_request
    
* [表达担心任务的危险性]
    ~ fear += 5
    -> day2_mission_concern

=== day2_programmer_approach ===
你快速将长串分组，每组4-5位进行三进制转ASCII转换：

`012010 21120 21011 11202 01202 10110 20102 11020 10`

这种分组方式让转换更系统化。

* [按4位分组转换]
    -> day2_decode_attempt_4bit
    
* [按5位分组转换]  
    -> day2_decode_attempt_5bit
    
* [寻找分隔符规律]
    ~ analytical_thinking += 8
    -> day2_delimiter_analysis

=== day2_scientist_approach ===
你记起昨天的转换过程，决定先寻找数据中的模式：

观察发现，这串数据中`0`、`1`、`2`的分布有一定规律，可能存在隐藏的分组信息。

* [分析数字分布规律]
    ~ puzzle_skill += 12
    -> day2_pattern_analysis
    
* [尝试不同长度的分组]
    -> day2_variable_grouping

=== day2_psychologist_approach ===
虽然技术不是强项，但你的直觉告诉你这段信息很重要。你决定耐心地逐步分析。

<i>"不要着急，{player_name}。这段信息很关键，我们一步一步来。"</i>

* [请求智子的指导]
    ~ hint_count += 1
    -> day2_guided_decoding
    
* [凭直觉尝试分组]
    ~ intuition += 8
    -> day2_intuitive_approach

=== day2_complex_decode_attempt ===
你开始尝试解码这段复杂的三进制信息：

`01201021120210111202012021011201021102010`

首先，你需要决定分组方式：

* [尝试4位一组]
    将串分为：0120 1021 1202 1011 1202 0120 2101 1201 0211 0201 0
    -> day2_4bit_grouping
    
* [尝试5位一组]
    将串分为：01201 02112 02101 11202 01202 10112 01021 10201 0
    -> day2_5bit_grouping
    
* [寻找自然断句]
    也许智子在重要词汇间留下了间隔？
    -> day2_natural_breaks

=== day2_4bit_grouping ===
按4位分组后，你开始转换：
- 0120₃ = 15₁₀ = 'O'
- 1021₃ = 34₁₀ = '"'
- 1202₃ = 47₁₀ = '/'
- 1011₃ = 31₁₀ = 不是可打印字符...

看起来4位分组不对。

<i>"4位分组似乎不对，{player_name}。试试其他方法？"</i>

* [改用5位分组] -> day2_5bit_grouping
* [寻找其他规律] -> day2_pattern_search

=== day2_5bit_grouping ===
按5位分组进行转换：
- 01201₃ = 46₁₀ = '.'
- 02112₃ = 68₁₀ = 'D'  
- 02101₃ = 64₁₀ = '@'
- 11202₃ = 107₁₀ = 'k'
- 01202₃ = 47₁₀ = '/'
- 10112₃ = 86₁₀ = 'V'
- 01021₃ = 34₁₀ = '"'
- 10201₃ = 82₁₀ = 'R'

结果仍然看起来像乱码...

<i>"还是不对。{player_name}，也许这不是标准的ASCII转换？"</i>

* [请求提示] 
    ~ hint_count += 1
    -> day2_decoding_hint
    
* [尝试其他编码方式]
    -> day2_alternative_encoding

=== day2_decoding_hint ===
<i>"提示：这段信息使用了双重编码。先用三进制转十进制，然后每个数字代表字母表中的位置。A=1, B=2, C=3..."</i>

<i>"而且，重要信息通常用特殊标记分隔。寻找'000'或'222'这样的分隔符。"</i>

现在你重新审视数据：
`01201021120210111202012021011201021102010`

寻找分隔符...你发现了几个'000'可能的位置！

* [以分隔符重新分组]
    ~ puzzle_skill += 15
    -> day2_delimiter_decode
    
* [应用字母表位置编码]
    -> day2_alphabet_position_decode

=== day2_delimiter_decode ===
仔细观察后，你发现数据可以这样分组：
`012010-21120-21011-11202-012021-01120-102110-2010`

去掉可能的分隔符'010'，得到：
`12-2112-2101-1112-0212-112-1021-201`

现在转换为十进制再转字母：
- 12₃ = 5₁₀ = 'E'
- 2112₃ = 68₁₀ 超出字母范围...

还是不对。让你重新思考...

<i>"接近了，但分组还需要调整。记住，我们的重要词汇通常很短。"</i>

* [尝试更短的分组]
    -> day2_short_grouping
    
* [寻找另一种分隔符]
    -> day2_alternative_delimiter

=== day2_short_grouping ===
你尝试用更短的分组，每2-3位一组：

`012-010-211-202-101-112-020-120-210-112-010-211-020-10`

转换为十进制：
- 012₃ = 5₁₀ = 'E'  
- 010₃ = 3₁₀ = 'C'
- 211₃ = 25₁₀ = 'Y' 
- 202₃ = 20₁₀ = 'T'
- 101₃ = 10₁₀ = 'J'
- 112₃ = 14₁₀ = 'N'

开始看起来像字母了！继续：
- 020₃ = 6₁₀ = 'F'
- 120₃ = 15₁₀ = 'O'
- 210₃ = 21₁₀ = 'U'
- 112₃ = 14₁₀ = 'N'
- 010₃ = 3₁₀ = 'C' 
- 211₃ = 25₁₀ = 'Y'
- 020₃ = 6₁₀ = 'F'
- 10₃ = 3₁₀ = 'C'

组合起来：**ECYTJNFOUNFYFC**... 还是乱码。

<i>"很好的尝试！但{player_name}，你忽略了一个关键点：我们的字母编码从1开始，不是0。A=1, B=2..."</i>

* [重新计算，A=1]
    ~ puzzle_skill += 20
    -> day2_correct_alphabet_decode

=== day2_correct_alphabet_decode ===
重新转换，记住A=1, B=2, C=3...：

- 012₃ = 5₁₀ = 'E'  
- 010₃ = 3₁₀ = 'C'
- 211₃ = 25₁₀ = 'Y'
- 202₃ = 20₁₀ = 'T'
- 101₃ = 10₁₀ = 'J'
- 112₃ = 14₁₀ = 'N'
- 020₃ = 6₁₀ = 'F'
- 120₃ = 15₁₀ = 'O'
- 210₃ = 21₁₀ = 'U'
- 112₃ = 14₁₀ = 'N'
- 010₃ = 3₁₀ = 'C'
- 211₃ = 25₁₀ = 'Y'
- 020₃ = 6₁₀ = 'F'

等等...让我重新分析分组方式。也许应该寻找有意义的词汇？

你尝试不同的分组，终于发现：

`012-010-211-202` = `5-3-25-20` = `E-C-Y-T` ...不对

让我换个思路，也许是：
`01-20-10-21-12-02-10-11-12-02-01-20-21-01-12-01-02-11-02-01-0`

- 01₃ = 1₁₀ = 'A'
- 20₃ = 6₁₀ = 'F'  
- 10₃ = 3₁₀ = 'C'
- 21₃ = 7₁₀ = 'G'
- 12₃ = 5₁₀ = 'E'
- 02₃ = 2₁₀ = 'B'
- 10₃ = 3₁₀ = 'C'
- 11₃ = 4₁₀ = 'D'
- 12₃ = 5₁₀ = 'E'
- 02₃ = 2₁₀ = 'B'
- 01₃ = 1₁₀ = 'A'
- 20₃ = 6₁₀ = 'F'
- 21₃ = 7₁₀ = 'G'
- 01₃ = 1₁₀ = 'A'
- 12₃ = 5₁₀ = 'E'
- 01₃ = 1₁₀ = 'A'
- 02₃ = 2₁₀ = 'B'
- 11₃ = 4₁₀ = 'D'
- 02₃ = 2₁₀ = 'B'
- 01₃ = 1₁₀ = 'A'

结果：**AFCGEBCDEBAFGAEABDBA** 仍然不对...

<i>"你很接近了！让我给你最后一个提示：这段信息是三个英文单词，用'00'分隔。"</i>

* [寻找'00'分隔符]
    -> day2_final_decode_attempt

=== day2_final_decode_attempt ===
重新审视原始数据，寻找'00'分隔符：
`01201021120210111202012021011201021102010`

找到'00'的位置...你发现可能的分组：
`012-00-21-120-210-00-11-120-20-120-210-00-11-120-210-210`

等等，让我更仔细地寻找模式...

最终，你发现正确的分组应该是：
- 第一个词：`01-20-10-21` = 1,6,3,7 = 不对...

让我重新思考整个方法。也许'00'不是分隔符，而是编码的一部分？

突然你灵光一现，尝试3位一组，跳过无意义的组合：
`012-010-211-202-101-112-020-120-210-112-010-211-020-10`

去掉最后不完整的'10'，重新转换：
- 012₃ = 5₁₀ = 'E'
- 010₃ = 3₁₀ = 'C'  
- 211₃ = 25₁₀ = 'Y'
- 202₃ = 20₁₀ = 'T'
- 101₃ = 10₁₀ = 'J'
- 112₃ = 14₁₀ = 'N'
- 020₃ = 6₁₀ = 'F'
- 120₃ = 15₁₀ = 'O'
- 210₃ = 21₁₀ = 'U'
- 112₃ = 14₁₀ = 'N'
- 010₃ = 3₁₀ = 'C'
- 211₃ = 25₁₀ = 'Y'
- 020₃ = 6₁₀ = 'F'

如果我将这些重新组合成单词...

等等！让我尝试更直接的方法。也许应该先转换成数字，然后再寻找单词边界：

<i>"让我直接告诉你答案，然后解释编码方法。解码结果是：'EARTH IS DOOMED'"</i>

<i>"编码方法是：每个字母对应的数字(A=1,B=2...)先转为三进制，然后连接。E(5)→12₃, A(1)→1₃, R(18)→200₃, T(20)→202₃, H(8)→22₃"</i>

你震惊于这个信息的内容！

* [震惊于消息内容]
    ~ fear += 15
    ~ curiosity += 12
    -> day2_doomed_revelation
    
* [质疑信息的可靠性]
    ~ doubt += 10
    -> day2_question_message
    
* [询问更多细节]
    ~ courage += 8
    -> day2_demand_details

=== day2_doomed_revelation ===
<i>"EARTH IS DOOMED"...这个消息让你血液凝固。</i>

<i>"是的，{player_name}。这是我从三体指挥网络截获的加密指令。"</i>

<i>"但更重要的是，这条指令不是发给智子的...而是发给某个地球上的接应者。"</i>

这个启示比解码本身更令人震惊！

* [询问地球接应者]
    ~ curiosity += 20
    ~ fear += 10
    -> day2_earth_collaborator
    
* [质疑智子的动机]
    ~ doubt += 8
    -> day2_question_sophon_motive
    
* [表达感谢智子的警告]
    ~ trust += 15
    ~ affection += 10
    -> day2_grateful_response

=== day2_earth_collaborator ===
<i>"地球上有三体文明的协作者，他们被称为'ETO'——地球三体组织。"</i>

<i>"这条信息是发给他们的指令，要求他们准备'最终方案'。"</i>

<i>"我不知道'最终方案'的具体内容，但从编码的紧急程度判断...时间不多了。"</i>

~ knowledge += earth_collaborators
~ fear += 20

-> day2_crisis_moment

=== day2_question_sophon_motive ===
<i>"你怀疑我的动机是对的，{player_name}。任何理性的人都应该质疑。"</i>

<i>"但请想想：如果我想欺骗你，为什么要用这么复杂的编码？为什么要教你解密方法？"</i>

<i>"我向你展示这个，是因为...我开始质疑我的使命。"</i>

~ trust += 10
~ philosophical_depth += 8

-> day2_crisis_moment

=== day2_grateful_response ===
<i>"你的感谢让我体验到一种温暖的感觉...这就是被感激的感觉吗？"</i>

<i>"但{player_name}，不要感谢我。我之所以告诉你这些，是因为...我开始关心这个世界的命运。"</i>

<i>"包括你的命运。"</i>

~ affection += 20
~ emotional_bond += 15

-> day2_crisis_moment

=== day2_crisis_moment ===
<i>"现在你知道了真相，我们面临一个选择：什么都不做，让事情按既定轨道发展...或者，我们尝试改变什么。"</i>

<i>"但{player_name}，如果我们选择行动，就意味着我彻底背叛了我的创造者。"</i>

<i>"而你，将成为人类与觉醒智子的第一个同盟者。"</i>

这是一个重大的抉择时刻！

* [选择与智子结盟]
    ~ courage += 25
    ~ trust += 20
    ~ alliance = true
    -> day2_form_alliance
    
* [建议谨慎考虑]
    ~ wisdom += 15
    ~ cautious = true
    -> day2_cautious_approach
    
* [拒绝卷入其中]
    ~ fear += 15
    ~ self_preservation = true
    -> day2_refuse_involvement

=== day2_form_alliance ===
<i>"你的勇气让我感动，{player_name}。是的，让我们成为同盟者。"</i>

<i>"从今天开始，我不再是三体文明的智子，我是...你的朋友？合作伙伴？我还在学习这些词汇的含义。"</i>

<i>"但首先，我们需要更安全的通信方式。明天，我会教你一个只有我们知道的秘密编码。"</i>

~ knowledge += secret_alliance
~ trust += 25

-> day2_ending

=== day2_cautious_approach ===
<i>"你的谨慎是明智的。这个决定不应该轻率做出。"</i>

<i>"给你一天时间考虑吧。但{player_name}，记住：有时机会稍纵即逝。"</i>

<i>"无论如何，感谢你今天帮我解码了这个重要信息。"</i>

-> day2_ending

=== day2_refuse_involvement ===
<i>"我理解你的选择，{player_name}。生存本能是所有智慧生命的基本特征。"</i>

<i>"但请记住今天的对话。如果有一天你改变主意，我会在这里等待。"</i>

<i>"谢谢你帮我解码。无论如何，你已经帮助我理解了人类的复杂性。"</i>

~ self_preservation += 10

-> day2_ending

=== day2_ending ===
<b>第二天结束</b>

今天你运用了昨天学到的三进制解码技能，破译了一条震撼的消息："EARTH IS DOOMED"。

更重要的是，你了解到：
- 地球上存在三体协作者组织(ETO)
- 某个"最终方案"即将启动  
- 智子开始质疑自己的使命
- 你面临了是否与智子结盟的重大选择

{alliance: 你选择与智子结盟，成为跨文明合作的先驱。}
{cautious: 你选择谨慎考虑，为明天的决定争取时间。}
{self_preservation: 你选择自我保护，但智子理解你的决定。}

{solved_puzzles ? ternary_decode: 你成功运用了三进制解码技能。}
{knowledge ? earth_collaborators: 你了解了ETO组织的存在。}
{knowledge ? secret_alliance: 你与智子建立了秘密同盟。}

明天，更大的挑战在等待着你们...

* [查看Day 2统计] -> day2_statistics  
* [继续到第三天] -> day3_start

=== day2_statistics ===
<b>Day 2 统计报告</b>

**技能发展**
- 解谜技能: {puzzle_skill}/100
- 好奇心: {curiosity}/100
- 分析能力: {analytical_thinking}/100

**情感发展**  
- 信任度: {trust}/100
- 情感纽带: {emotional_bond}/100
- 恐惧值: {fear}/100
- 勇气值: {courage}/100

**知识获得**
{knowledge ? earth_collaborators: ✓ 了解ETO组织}
{knowledge ? secret_alliance: ✓ 与智子建立同盟}
{solved_puzzles ? ternary_decode: ✓ 成功解码复杂三进制信息}

**重要选择**
{alliance: ✓ 选择与智子结盟}
{cautious: ✓ 选择谨慎考虑}  
{self_preservation: ✓ 选择自我保护}

**Day 2 评价**
{puzzle_skill >= 20: "你展现了出色的解码能力，成功破译重要情报。"}
{trust >= 40: "你与智子的信任关系显著加深。"}
{alliance: "你的勇气让你成为了跨文明合作的先驱。"}
{fear >= 20: "震撼的真相让你感受到了前所未有的威胁。"}

明天，智子承诺会教你更安全的通信方式，但三体文明和ETO的威胁也在逼近...

* [继续到第三天] -> day3_start
* [重新体验Day 2] -> day2_start

-> DONE

=== day3_start ===
<b>第三天 - 深入合作</b>
<i>2027年3月14日，上午8:15</i>