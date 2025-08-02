VAR test_var = 0

-> start

=== start ===
~ test_var++
You are at the start.
* [Go to first] -> first

=== first ===
~ test_var++
You are at first section.
* [Back to start] -> start
* [Go to second] -> second

=== second ===
~ test_var++
You are at second section.
-> END
