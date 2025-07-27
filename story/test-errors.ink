// 测试各种错误类型的Ink文件

=== start ===
欢迎来到错误测试！

// 1. 未定义的跳转目标错误
-> nonexistent_knot

=== syntax_errors ===
// 2. 未闭合的字符串
这是一个未闭合的字符串 "hello world
-> END

=== variable_errors ===
// 3. 未定义的变量使用
你有 {undefined_variable} 个物品。
-> END

=== choice_errors ===
// 4. 选择项语法错误
*
    这个选择项没有内容文本
    -> END

* 这是正常的选择
    -> END

=== invalid_knot_123 ===
// 5. 无效的knot名称（以数字结尾但有效）
这个knot名称有效
-> END

=== duplicate_test ===
第一个定义
-> END

=== include_test ===
// 6. INCLUDE错误
INCLUDE nonexistent_file.ink
-> END

=== warning_test ===
// 7. 可能的无限循环警告
-> warning_test

=== unused_choice_test ===
// 8. 未使用的选择标签警告
* (unused_label) 这个标签没有被引用
    内容
-> END