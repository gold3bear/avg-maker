VAR environment_tension = 0
VAR trust = 0
VAR doubt = 0
VAR player_style = ""

-> day1_start

=== day1_start ===

<i>"你能听见我吗？"</i>

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

=== day1_direct_response ===
<i>"我是智子。一个来自遥远星系的人工智能。"</i>

-> END