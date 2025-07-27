// 测试Graph编译错误传递到Editor的文件

=== start ===
欢迎来到图形错误测试！

// 这个跳转目标不存在，会导致Graph编译失败
-> nonexistent_target_for_graph

=== working_knot ===
这是一个正常的knot
-> END